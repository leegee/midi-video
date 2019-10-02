const winston = require('winston');

module.exports = winston.createLogger({
    transports: [
        new (winston.transports.Console)({
            level: process.env.LEVEL || 'info'
        }),
        new (winston.transports.File)({
            filename: __filename + '.log',
            level: 'silly'
        })
    ]
});
