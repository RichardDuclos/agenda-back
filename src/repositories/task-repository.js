const Task = require('../models/task.models');
const { sequelize } = require('../models/db');
const { Op } = require("sequelize");
const getTasks = async function (where, order) {
    return await Task.findAll({
        attributes: ["id", "name", "begginingDate", "endDate", "wholeDay",
        "begginingTime", "endTime", "progression"],
        where: where,
        order: order
    });
}
const getTaskById = async function (id) {
    return await Task.findOne({
        where: {
            id:  id
        }
    });
}
const getTask = async function (where) {
    return await Task.findOne({
        where: where
    })
}
const createTask = async function (data) {
    const task = data;

    if((task.name === undefined) ||
        (task.wholeDay === undefined) ||
        (task.progression === undefined) ||
        (task.user === undefined)) {
        return false;
    }

    const entity = await Task.create({
        name : task.name,
        wholeDay : task.wholeDay,
        progression : task.progression,
        date: task.date,
        begginingDate: task.begginingDate,
        endDate: task.endDate,
        begginingTime: task.begginingTime,
        endTime: task.endTime,
        repeatingId: task.repeatingId
    });
    entity.setUser(task.user);
    return true;

}
const updateTask = async function (task, data) {
    if(typeof data.name !== "undefined") {
        task.name = data.name
    }
    if(typeof data.begginingDate !== "undefined") {
        task.begginingDate = data.begginingDate
    }
    if(typeof data.endDate !== "undefined") {
        task.endDate = data.endDate
    }
    if(typeof data.wholeDay !== "undefined") {
        task.wholeDay = data.wholeDay
    }
    if(typeof data.begginingTime !== "undefined") {
        task.begginingTime = data.begginingTime
    }
    if(typeof data.endTime !== "undefined") {
        task.endTime = data.endTime
    }
    if(typeof data.progression !== "undefined") {
        task.progression = data.progression
    }
    task.save()
}
const deleteTask = async function(task) {
    return await task.destroy()
}
const Seed =  async () => {

    let tasks = await getTasks();

    if(tasks.length === 0) {

    }
}

module.exports = {
    getTasks,
    getTask,
    getTaskById,
    createTask,
    deleteTask,
    Seed,
    updateTask
}


