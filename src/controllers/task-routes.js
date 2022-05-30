const express = require('express')

const taskRoutes = express.Router();
const userRepository = require('../repositories/user-repository');
const taskRepository = require('../repositories/task-repository');
const {body, validationResult} = require("express-validator");
const Roles = require("../security/roles");
const {updateUser} = require("../repositories/user-repository");
const {updateTask} = require("../repositories/task-repository");

let guard = require('express-jwt-permissions')({
    permissionsProperty : "roles"
})

require('dotenv').config()
taskRoutes.route('/')
    .get(guard.check([[Roles.User]]), async (req, res) => {
        const user = await userRepository.getUser({id: req.user.id})
        const tasks = await user.getTasks();
        const array = tasks.map(task => {return {
            id: task.id,
            name: task.name,
            wholeDay: task.wholeDay,
            frequency: task.frequency,
            begginingDate: task.begginingDate,
            endDate: task.endDate,
            begginingTime: task.begginingTime,
            endTime: task.endTime,
            progression: task.progression,
            createdAt: task.createdAt
        }})
        res.status(200).send(array);
    })
    .post(
        body('name')
            .notEmpty().withMessage('missing'),
        body('wholeDay').notEmpty().withMessage('missing')
            .toBoolean()
            .custom((val, {req})=> {
                console.log(req.body.begginingTime)
                if(val === true) {
                    if((!req.body.begginingDate||
                        !req.body.endDate)
                        ||
                        (req.body.begginingTime||
                        req.body.endTime)
                    ) {
                        throw new Error("no-time-yes-dates-if-wholeday")
                    }
                } else {
                    if((req.body.begginingDate||
                            req.body.endDate)
                        ||
                        (!req.body.begginingTime ||
                            !req.body.endTime)) {
                        throw new Error("yes-time-no-dates-if-not-wholeday")

                    }
                }
                return true;
            }),
        body('begginingDate')
            .isDate().withMessage('wrong-type')
            .optional(),
        body('endDate')
            .isDate().withMessage('wrong-type')
            .optional(),
        body('begginingTime')
            .isNumeric().withMessage('wrong-type')
            .isInt({min: 8, max: 17}).withMessage('wrong-value')
            .optional(),
        body('endTime')
            .isNumeric().withMessage('wrong-type')
            .isInt({min: 9, max: 18}).withMessage('wrong-value')
            .optional(),
        body('frequency')
            .notEmpty().withMessage('missing')
            .isNumeric().withMessage('wrong-type')
            .isInt({min: 0, max: 3}).withMessage('wrong-value')
            .custom((val, {req}) => {
                if(val === undefined) {
                    return true;
                }
                if(req.body.wholeDay === true && val !== 0) {
                    throw new Error("whole-day-cant-repeat")
                }
                return true;
            })
        ,
        guard.check([[Roles.User]]), async(req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() })
            }
            let task = {
                name: req.body.name,
                wholeDay: req.body.wholeDay,
                progression: 0,
                user: req.user.id,
                frequency: req.body.frequency,
                begginingTime: req.body.begginingTime,
                endTime: req.body.begginingTime,
                begginingDate: req.body.begginingDate,
                endDate: req.body.endDate
            }
            taskRepository.createTask(task)
            res.status(201).send()
        });

taskRoutes.route('/:idTask')
    .get(guard.check([[Roles.User]]), async(req, res) => {
        let filteredTask = await getTaskFromUser(req.user.id, req.params.idTask)
        if(!filteredTask) {
            return res.status(404).send();
        }
        const data =  {
            id: filteredTask.id,
            name: filteredTask.name,
            wholeDay: filteredTask.wholeDay,
            frequency: filteredTask.frequency,
            begginingDate: filteredTask.begginingDate,
            endDate: filteredTask.endDate,
            begginingTime: filteredTask.begginingTime,
            endTime: filteredTask.endTime,
            progression: filteredTask.progression,
            createdAt: filteredTask.createdAt
        }
        res.status(200).send(data);
    })
    .delete(guard.check([[Roles.User]]), async(req, res) => {
        let filteredTask = await getTaskFromUser(req.user.id, req.params.idTask)
        if(!filteredTask) {
            return res.status(404).send()
        }
        taskRepository.deleteTask(filteredTask)
        res.status(204).send()
    })
    .put(guard.check([[Roles.User]]), async (req, res) => {
        let filteredTask = await getTaskFromUser(req.user.id, req.params.idTask)
        if(!filteredTask) {
            return res.status(404).send()
        }
        const data = {
            id: filteredTask.id,
            name: req.body.name,
            wholeDay: undefined,
            frequency: undefined,
            begginingDate: undefined,
            endDate: undefined,
            begginingTime: undefined,
            endTime: undefined,
            progression: req.body.progression,
        }
        taskRepository.updateTask(filteredTask, data)
        res.status(204).send()
    })

exports.initializeRoutes = () => {
    return taskRoutes;
}

async function getTaskFromUser(userId, taskId) {
    const user = await userRepository.getUser({id: userId})
    const tasks = await user.getTasks()
    return tasks.filter(task => task.id === taskId)[0]
}