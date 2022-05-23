const { Sequelize } = require('sequelize');
require('dotenv').config()

exports.sequelize = new Sequelize(`${process.env.DB_TYPE}://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}/${process.env.POSTGRES_DB_NAME}`, {
logging: false
})
