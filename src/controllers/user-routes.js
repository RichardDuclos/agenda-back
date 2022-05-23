const express = require('express')

const userRoutes = express.Router();
const userRepository = require('../repositories/user-repository');
const {body, validationResult} = require("express-validator");
const Roles = require("../security/roles");
const {updateUser} = require("../repositories/user-repository");

let guard = require('express-jwt-permissions')({
    permissionsProperty : "roles"
})

require('dotenv').config()

//GET ALL USERS
userRoutes.route('/')
    .get(guard.check([[Roles.Admin]]), async (req, res) => {
        res.status(200).send( await userRepository.getUsers());
    })
    .post(
        body('username').notEmpty()
            .withMessage("missing"),
        body('username').isLength({min: 5})
            .withMessage("too-short"),
        body('username').isLength({max: 30})
            .withMessage("too-long"),
        body('username').custom(async val => {
            return userRepository.getUserByUsername(val).then(user => {
                if (user) {
                    return Promise.reject();
                }
            })
        })
            //check if username is already used
            .withMessage('already-used'),
        body('firstName').notEmpty()
            .withMessage("missing"),
        body('firstName').isLength({max: 60})
            .withMessage('too-long'),
        body('lastName').notEmpty()
            .withMessage("missing"),
        body('lastName').isLength({max: 60})
            .withMessage('too-long'),
        body('password').notEmpty()
            .withMessage("missing"),
        body('password').isLength({ min: 8 })
            .withMessage("too-short"),
        body('password').isLength({ max: 256 })
            .withMessage("too-long"),
        async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() })
            }
            let user = req.body
            user.roles = ['ROLE_USER']
            await userRepository.createUser(user);
            res.status(201).send();
        });

userRoutes.route('/:userId/')
    .get(guard.check([[Roles.User]]), async (req, res) => {
        if(!req.user.roles.includes(Roles.Admin) && req.params.userId !== req.user.id) {
            return res.status(404).send()
        }
        let user = await userRepository.getUserById(req.params.userId);
        if(!user) {
            return res.status(404).send()
        }
        res.status(200).send({
            id: user.id,
            email : user.email,
            firstName : user.firstName,
            lastName : user.lastName,
            role : user.role
        });
    })
    .put(guard.check(Roles.User), async (req, res) => {

        let user = await userRepository.getUserById(req.params.userId);
        const data = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            username: req.body.username
        }
        updateUser(user, data)
        res.status(204).send();
    })
    .delete(guard.check(Roles.Admin), async (req, res) => {

        let result = await userRepository.deleteUser(req.params.id);
        if(!result) {
            throw new Error("Delete failed");
        }
        res.status(204).send();
});


exports.initializeRoutes = () => {
    return userRoutes;
}