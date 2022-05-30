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
    body('username')
        .notEmpty().withMessage("missing"),
    body('password')
        .notEmpty().withMessage("missing")
    , async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    let user = await userRepository.getUser({username: req.body.username}, null);
    if(user === null) {
        return res.status(401).send();
    }
    let result = await userRepository.checkPassword( req.body.password, user.password);
    if(!result) {
        return res.status(401).send({error : "bad-credentials"});
    }
    let token = auth.getJWT(user.id, user.roles);
    res.status(200).send({token: token});
});

authRoute.get('/token',
    (req, res) => {
        res.status(204).send();
    });

exports.initializeRoutes = () => {
    return authRoute;
}