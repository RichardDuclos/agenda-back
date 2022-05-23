const express = require('express')

const authRoute = express.Router();
const userRepository = require('../repositories/user-repository');
let ejwt = require("express-jwt");
let jwt = require('jsonwebtoken');

let guard = require('express-jwt-permissions')({
    permissionsProperty : "roles"
})
require('dotenv').config()

let auth = require("../security/auth");

const { body, validationResult } = require('express-validator')

//LOGIN REQUEST
authRoute.post('/login',
    body('username').notEmpty()
        .withMessage("Veuillez renseigner votre nom d'utilisateur"),
    body('password').notEmpty()
        .withMessage("Veuillez renseigner un mot de passe")
    , async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let user = await userRepository.getUserByUsername(req.body.username);
    if(user === null) {
        return res.status(401).send();
    }
    let result = await userRepository.checkPassword( req.body.password, user.password);
    if(!result) {
        return res.status(401).send();
    }
    let token = auth.getJWT(user.id, user.roles);
    res.status(200).send({token: token});
});

authRoute.get('/token',
    (req, res) => {
        res.status(204).send();
    });
//CREATE USER
authRoute.post(
    '/register',
    body('email').notEmpty()
        .withMessage("Veuillez renseigner votre adresse email"),
    body('email').isEmail()
        .withMessage("Veuillez renseigner une adresse email valide"),
    body('firstName').notEmpty()
        .withMessage("Veuillez renseigner votre prénom"),
    body('lastName').notEmpty()
    .withMessage("Veuillez renseignr votre nom"),
    body('password').notEmpty()
        .withMessage("Veuillez renseigner un mot de passe"),
    body('password').isLength({ min: 8 })
        .withMessage("Le mot de passe doit faire 8 caractères minimum"),
    body('birthday').isDate({format : "YYYY-MM-DD"})
        .withMessage("Veuillez renseigner votre date de naissance"),

    async (req, res) => {

        const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    if(await userRepository.getUserByEmail(req.body.email)) {
        return res.status(405).send();
    }
    await userRepository.createUser(req.body);

    res.status(201).send();
});

exports.initializeRoutes = () => {
    return authRoute;
}