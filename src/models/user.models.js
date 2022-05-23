const { sequelize } = require('./db');
const { Sequelize, DataTypes } = require('sequelize');

 const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    username : {
        type: DataTypes.STRING(30),
        unique: true,
        allowNull: false,

    },
    firstName: {
        type: DataTypes.STRING(60),
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING(60),
        allowNull: false
    },
    password: {
        type: DataTypes.STRING(60),
        allowNull: false

    },
     roles: {
        type: DataTypes.JSON,
         allowNull: false,
         defaultValue: 'ROLE_USER'
     }
}, {

});
module.exports = User;
