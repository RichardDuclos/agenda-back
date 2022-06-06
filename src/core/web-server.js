const express = require('express');
const { initializeConfigMiddlewares, initializeErrorMiddlwares } = require('./middlewares');
const userRoutes = require('../controllers/user-routes')
const authRoutes = require('../controllers/auth-routes')
const taskRoutes = require('../controllers/task-routes')
const { sequelize } = require('../models/db')
const bodyParser = require('body-parser')
const userRepository = require('../repositories/user-repository')
const taskRepository = require('../repositories/task-repository')
class WebServer {
    app = undefined;
    port = 3000;
    server = undefined;

    constructor() {
        this.app = express();
        this.app.use(bodyParser.json({limit : '50mb'}));
        this.app.use(bodyParser.urlencoded({ extended :true}));
        this.syncDb();

        initializeConfigMiddlewares(this.app);
        this._initializeRoutes();
        initializeErrorMiddlwares(this.app);
    }

    async syncDb() {
        await sequelize.sync({alter : true/*force: true*/});
        await userRepository.Seed();
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`Agenda app listening on port ${this.port}`);
        });
    }

    stop() {
        this.server.close();
    }
    _initializeRoutes() {
        this.app.use('/users', userRoutes.initializeRoutes());
        this.app.use('/tasks', taskRoutes.initializeRoutes());
        this.app.use('/auth', authRoutes.initializeRoutes());
    }
}

module.exports = WebServer;
