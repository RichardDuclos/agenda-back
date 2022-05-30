const User = require('../models/user.models');
const Task = require('../models/task.models');
const bcrypt = require("bcrypt");
const { sequelize } = require('../models/db');
const { Op } = require("sequelize");
const getUsers = async function (where, order) {
    return await User.findAll({
        attributes: ["id", "username", "firstName", "lastName", "password"],
        where: where,
        order: order,
        include: Task

    });
}
const getUserById = async function (id) {
    return await User.findOne({
        where: {
            id:  id
        },
        include: Task
    });
}
const getUser = async function (where) {
    return await User.findOne({
        where: where,
        include: Task
    })
}
const createUser = async function (data) {
    const user = data;
    if((user.firstName === undefined) ||
        (user.lastName === undefined) ||
        (user.password === undefined) ||
        (user.username === undefined) ||
        (user.roles === undefined)) {
        return false;
    }
    let hash = await bcrypt.hash(user.password, 12);
    user.password = hash;
    await User.create({
        firstName : user.firstName,
        lastName : user.lastName,
        username : user.username,
        password : user.password,
        roles: user.roles
    });
    return true;

}
const updateUser = async function (user, data) {
    if(typeof data.firstName !== "undefined") {
        user.firstName = data.firstName
    }
    if(typeof data.lastName !== "undefined") {
        user.lastName = data.lastName
    }
    if(typeof data.password !== "undefined") {
        user.password = data.password
    }
    if(typeof data.password !== "undefined") {
        user.roles = data.roles
    }
    if(typeof data.username !== "undefined") {
        user.username = data.username
    }
    user.save()
}
const deleteUser = async function(user) {
    return await user.destroy()
}
/*const updateUser = async function (data) {
    await User.update({
        firstName: data.firstName,
        lastName : data.lastName,
        password : data.password,
        role : data.role
    }, {
        where: {
            id: data.id
        }
    });
}*/
const checkPassword = async function (password, hash){
    return await bcrypt.compare(password, hash);
}


const Seed =  async () => {

    let users = await User.findAll();

    if(users.length === 0) {
        createUser({
            firstName: "richard",
            lastName: "duclos",
            username: "richard",
            password: "password",
            roles: ['ROLE_ADMIN', 'ROLE_USER']
        });
        createUser({
            firstName: "John",
            lastName: "Doe",
            username: "johndoe",
            password: "password",
            roles: ['ROLE_USER']
        });
        createUser({
            firstName: "Joe",
            lastName: "Doackes",
            username: "joadoackes",
            password: "password",
            roles: ['ROLE_USER']
        });
    }
}

module.exports = {
    getUsers,
    getUserById,
    createUser,
    getUser,
    deleteUser,
    checkPassword,
    Seed,
    updateUser
}


