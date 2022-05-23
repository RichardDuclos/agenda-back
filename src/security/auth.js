const jwt = require("jsonwebtoken");
require('dotenv').config()


const getJWT = function (id, role) {
    return jwt.sign({
        id: id,
        roles: role
    }, process.env.JSWT_SECRETWORD, {
        algorithm : "HS256"
    });
};

module.exports = {
    getJWT
}