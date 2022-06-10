const express = require('express')
const uuid = require('uuid');
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
function dateEqual(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
}
require('dotenv').config()
taskRoutes.route('/')
    .get(guard.check([[Roles.User]]), async (req, res) => {
        const user = await userRepository.getUser({id: req.user.id})
        const tasks = await user.getTasks();
        const array = tasks.map(task => {return {
            id: task.id,
            name: task.name,
            wholeDay: task.wholeDay,
            date: task.date,
            begginingDate: task.begginingDate,
            endDate: task.endDate,
            begginingTime: task.begginingTime,
            endTime: task.endTime,
            repeatingId: task.repeatingId,
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
                if(val === true) {
                    if((!req.body.begginingDate||
                        !req.body.endDate)
                        ||
                        (req.body.begginingTime||
                        req.body.endTime)
                    ) {
                        throw new Error("no-time-yes-dates-if-wholeday")
                    }
                }
                return true;
            }),
        body('date')
            .notEmpty().withMessage("missing")
            .isDate( {format: "YYYY-MM-DD", strictMode: true}).withMessage('wrong-type')
            .optional(),
        body('begginingDate')
            .notEmpty().withMessage("missing")
            .isDate({format: "YYYY-MM-DD", strictMode: true}).withMessage('wrong-type')
            .optional(),
        body('endDate')
            .notEmpty().withMessage("missing")
            .isDate({format: "YYYY-MM-DD", strictMode: true}).withMessage('wrong-type')
            .custom((val, {req}) => {
                const begginingDate = new Date(req.body.begginingDate)
                const endDate = new Date(val)
                if(!(begginingDate instanceof Date && !isNaN(begginingDate)) || !(endDate instanceof Date && !isNaN(endDate))) {
                    return
                }
                if(endDate < begginingDate) {
                    throw new Error("must-be-superior-than-beggining-date")
                }
                return true

            })
            .optional(),
        body('begginingTime')
            .isNumeric().withMessage('wrong-type')
            .isInt({min: 8, max: 17}).withMessage('wrong-value')
            .optional(),
        body('endTime')
            .isNumeric().withMessage('wrong-type')
            .isInt({min: 9, max: 18}).withMessage('wrong-value')
            .custom((val, {req}) => {
                if(val === undefined || req.body.begginingTime === undefined || req.body.begginingTime === null ) {
                    return
                }
                if(parseInt(val) <= parseInt(req.body.begginingTime)) {
                    throw new Error("must-be-superior-than-beggining-time")
                }
                return true
            })
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
                if(val > 0 && (!req.body.begginingDate || !req.body.endDate)) {
                    throw new Error("repeating-needs-day-interval")
                }
                if(val === 2 && !req.body.dayOfWeek) {
                    throw new Error("weekly-tasks-needs-dayOfWeek")
                }
                if(val === 3 && !req.body.dayOfMonth) {
                    throw new Error("monthly-tasks-needs-dayOfMonth")
                }
                return true;
            }),

        body()
            .custom(async (val, {req}) => {
                const date = new Date(val.date)
                if(date === "" && val.frequency === 0) {
                    return
                }
                const begginingDate = val.begginingDate
                const endDate = val.endDate;
                if(begginingDate === "" || endDate === "" || !(new Date(begginingDate) instanceof Date && !isNaN(new Date(begginingDate)))  || !(new Date(endDate) instanceof Date && !isNaN(new Date(endDate)))){
                    return
                }
                if(new Date(begginingDate) > new Date(endDate)) {
                    return
                }
                const begginingTime = val.begginingTime
                const endTime = val.endTime
                const wholeDay = val.wholeDay
                const frequency = val.frequency
                const dayOfWeek = val.dayOfWeek
                const dayOfMonth = val.dayOfMonth
                if(frequency === undefined || wholeDay === undefined) {
                    return
                }
                const user = await userRepository.getUser({id: req.user.id})
                const tasks = await user.getTasks();

                for(const task of tasks) {

                    taskDate = new Date(task.date)
                    taskBegginingTime = parseInt(task.begginingTime)
                    taskEndTime = parseInt(task.endTime)
                    taskWholeDay = task.wholeDay
                    if(req.body.frequency == 0 && wholeDay === false) {

                        if(dateEqual(date, taskDate) &&
                            (
                                (begginingTime <= taskBegginingTime && taskEndTime <= endTime) ||
                                (taskBegginingTime <= begginingTime && begginingTime <= taskEndTime) ||
                                (taskBegginingTime <= endTime && endTime <= taskEndTime)
                            )) {
                            throw new Error("task-conflict")
                        }
                    } else {
                        const firstDay = new Date(req.body.begginingDate)
                        const lastDay = new Date(req.body.endDate)
                        let loopDay = new Date(firstDay)
                        const lastDayPlusOneDay = new Date(lastDay)
                        lastDayPlusOneDay.setDate(lastDayPlusOneDay.getDate() + 1)
                        while(!dateEqual(
                                loopDay,
                                lastDayPlusOneDay)
                            ) {
                            if(taskWholeDay) {
                                const taskFirstDay = new Date(task.begginingDate)
                                const taskLastDay = new Date(task.endDate)
                                const taskLastDayPlusOneDay = new Date(task.endDate)
                                taskLastDayPlusOneDay.setDate(taskLastDayPlusOneDay.getDate() + 1)
                                const loopDay2 = new Date(taskFirstDay)
                                while(!dateEqual(loopDay2, taskLastDayPlusOneDay)) {
                                    if((frequency === 1 || wholeDay === true) ||
                                        (frequency === 2 && (loopDay2.getDay() === req.body.dayOfWeek) )
                                        || (frequency === 3 && (loopDay2.getDate() === req.body.dayOfMonth))) {
                                        if(dateEqual(taskDate, loopDay2) &&
                                            (

                                                (begginingTime <= taskBegginingTime && taskEndTime <= endTime) ||
                                                (taskBegginingTime <= begginingTime && begginingTime <= taskEndTime) ||
                                                (taskBegginingTime <= endTime && endTime <= taskEndTime)
                                            )) {
                                            throw new Error("task-conflict")
                                        }
                                    }
                                    loopDay2.setDate(loopDay2.getDate()+1)
                                }
                            } else {
                                if((frequency === 1 || wholeDay === true) ||
                                    (frequency === 2 && (loopDay.getDay() === req.body.dayOfWeek) )
                                    || (frequency === 3 && (loopDay.getDate() === req.body.dayOfMonth))) {
                                    if(dateEqual(taskDate, loopDay) &&
                                        (

                                            (begginingTime <= taskBegginingTime && taskEndTime <= endTime) ||
                                            (taskBegginingTime <= begginingTime && begginingTime <= taskEndTime) ||
                                            (taskBegginingTime <= endTime && endTime <= taskEndTime)
                                        )) {
                                        throw new Error("task-conflict")
                                    }
                                }
                            }


                            loopDay.setDate(loopDay.getDate()+1)
                        }
                    }

                }

            })
        ,
        guard.check([[Roles.User]]), async(req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() })
            }
            let begginingTime = req.body.begginingTime
            if(begginingTime) {
                begginingTime = `${begginingTime}:00`.padStart(5, '0')
            }
            let endTime = req.body.endTime
            if(endTime) {
                endTime = `${endTime}:00`.padStart(5, '0')
            }

            if(parseInt(req.body.frequency) === 0) {
                let task = {
                    name: req.body.name,
                    wholeDay: req.body.wholeDay,
                    progression: 0,
                    user: req.user.id,
                    begginingTime:  begginingTime,
                    endTime: endTime,
                    date: req.body.wholeDay === true ? null: new Date(req.body.date),
                    begginingDate: req.body.wholeDay === true ? new Date(req.body.begginingDate): null,
                    endDate: req.body.wholeDay === true ? new Date(req.body.endDate): null,
                    repeatingId: null
                }
                await taskRepository.createTask(task)
            } else {
                const repeatingId = uuid.v4();
                const firstDay = new Date(req.body.begginingDate)
                const lastDay = new Date(req.body.endDate)
                lastDayPlusOneDay = new Date(lastDay)
                lastDayPlusOneDay.setDate(lastDay.getDate()+1)
                let loopDay = new Date(firstDay)
                while(!dateEqual(
                    loopDay,
                    lastDayPlusOneDay)
                ) {
                    if(loopDay.getDay() === 6 || loopDay.getDay() === 0) {
                        loopDay.setDate(loopDay.getDate() + 1);
                        continue;
                    }
                    console.log(typeof req.body.dayOfWeek)
                    if((req.body.frequency === 1) ||
                        (req.body.frequency === 2 && (loopDay.getDay() === req.body.dayOfWeek) )
                    || (req.body.frequency === 3 && (loopDay.getDate() === req.body.dayOfMonth))) {
                        let task = {
                            name: req.body.name,
                            wholeDay: req.body.wholeDay,
                            progression: 0,
                            user: req.user.id,
                            begginingTime:  begginingTime,
                            endTime: endTime,
                            date: loopDay,
                            begginingDate: null,
                            endDate: null,
                            repeatingId: repeatingId
                        }
                        await taskRepository.createTask(task)
                    }
                    loopDay.setDate(loopDay.getDate() + 1);

                }

            }

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
        if(req.body.applyToAll === true && req.body.repeatingId) {
            const tasks = await taskRepository.getTasks({repeatingId: req.body.repeatingId}, null)
            for(const task of tasks) {
                await taskRepository.deleteTask(task)
            }
        } else {
            await taskRepository.deleteTask(filteredTask)
        }
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
        if(req.body.applyToAll === true && req.body.repeatingId) {
            const tasks = await taskRepository.getTasks({repeatingId: req.body.repeatingId}, null)
            for(const task of tasks) {
                await taskRepository.updateTask(task, data)
            }
        } else {
            await taskRepository.updateTask(filteredTask, data)
        }
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