const { sequelize } = require('./db');
const { Sequelize, DataTypes } = require('sequelize');
const User = require("./user.models.js");

const Task = sequelize.define('Task', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    begginingDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    wholeDay: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    begginingTime: {
        type: DataTypes.TIME,
        allowNull: true
    },
    endTime: {
        type: DataTypes.TIME,
        allowNull: true
    },
    repeatingId : {
        type: DataTypes.UUID,
        allowNull: true
    },
    progression: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {

});
module.exports = Task;
