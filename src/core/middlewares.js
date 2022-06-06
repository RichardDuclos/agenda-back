const express = require('express');
const { DateTime } = require('luxon');
const cors = require('cors');
let ejwt = require('express-jwt');
require('dotenv').config()

const initJWTMiddleware = (app) => {
    app.use(ejwt(
        { secret: process.env.JSWT_SECRETWORD  , algorithms: ['HS256']})
        .unless(
            {
                path:
                    ['/auth/login',
                    {
                        url: '/users',
                        methods: ['POST']
                    }
                ]
            }
        ));
    }

const initJsonHandlerMiddlware = (app) => app.use(express.json());

const initCorsMiddlware = (app) => app.use(cors({origin: '*'}));

const initJSONMiddleware = (app) => app.use(express.json());

const initLoggerMiddlware = (app) => {
    app.use((req, res, next) => {
        const begin = new DateTime(new Date());

        res.on('finish', () => {
            const requestDate = begin.toString();
            const remoteIP = `IP: ${req.connection.remoteAddress}`;
            const httpInfo = `${req.method} ${req.baseUrl || req.path}`;

            const end = new DateTime(new Date());
            const requestDurationMs = end.diff(begin).toMillis();
            const requestDuration = `Duration: ${requestDurationMs}ms`;

            console.log(`[${requestDate}] - [${remoteIP}] - [${httpInfo}] - [${requestDuration}] - [status ${res.statusCode}]`);
        })
        next();
    });
};

exports.initializeConfigMiddlewares = (app) => {
    initJWTMiddleware(app);
    initJsonHandlerMiddlware(app);
    initCorsMiddlware(app);
    initLoggerMiddlware(app);
    initJSONMiddleware(app);
}

exports.initializeErrorMiddlwares = (app) => {
    app.use((err, req, res, next) => {
        res.status(500).send(err.message);
    });
}
