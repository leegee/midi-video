const path = require('path');

const winston = require('winston');

module.exports = winston.createLogger({
    transports: [
        new (winston.transports.Console)({
            level: process.env.LEVEL || 'info',
            format: format.combine(
                format.splat(),
                format.simple()
            ),
        }),
        new (winston.transports.File)({
            filename: __filename + '.log',
            level: 'silly'
        })
    ]
});

function getStackInfo(stackIndex) {
    const stacklist = (new Error()).stack.split('\n').slice(3)

    const stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
    const stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

    const s = stacklist[stackIndex] || stacklist[0];
    const sp = stackReg.exec(s) || stackReg2.exec(s);

    if (sp && sp.length === 5) {
        return sp[1] + ' ' + path.relative(__dirname, sp[2]) + ' ' + sp[3];
        //   return {
        //     method: sp[1],
        //     relativePath: path.relative(__dirname, sp[2]),
        //     line: sp[3],
        //     pos: sp[4],
        //     file: path.basename(sp[2]),
        //     stack: stacklist.join('\n')
        //   }
    }

    return '';
}