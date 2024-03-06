import path from 'path';
import util from 'util';
import winston from 'winston';

function transform ( info, opts ) {
    const args = info[ Symbol.for( 'splat' ) ];
    if ( args ) {
        info.message = util.format( info.message, ...args );
    }
    return info;
}

function utilFormatter () {
    return {
        transform
    };
}

export default winston.createLogger( {
    transports: [
        new ( winston.transports.Console )( {
            level: process.env.LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp( {
                    format: 'YYYY-MM-DD HH:mm:ss.SSS'
                } ),
                utilFormatter(),
                winston.format.colorize(),
                winston.format.printf( ( {
                    level,
                    message,
                    label,
                    timestamp
                } ) => `${ timestamp } ${ label || '-' } ${ level }: ${ message }` ),
            )
        } ),
        // new(winston.transports.File)({
        //     filename: path.join(process.cwd(), 'log.log'),
        //     level: 'silly',
        //     format: winston.format.combine(
        //         winston.format.timestamp({
        //             format: 'YYYY-MM-DD HH:mm:ss.SSS'
        //         }),
        //         utilFormatter(),
        //         winston.format.colorize(),
        //         winston.format.printf(({
        //             level,
        //             message,
        //             label,
        //             timestamp
        //         }) => `${timestamp} ${label || '-'} ${level}: ${message}`),
        //     )
        // })
    ]
} );

// function getStackInfo(stackIndex) {
//     const stacklist = (new Error()).stack.split('\n').slice(3)

//     const stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
//     const stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

//     const s = stacklist[stackIndex] || stacklist[0];
//     const sp = stackReg.exec(s) || stackReg2.exec(s);

//     if (sp && sp.length === 5) {
//         return sp[1] + ' ' + path.relative(__dirname, sp[2]) + ' ' + sp[3];
//         //   return {
//         //     method: sp[1],
//         //     relativePath: path.relative(__dirname, sp[2]),
//         //     line: sp[3],
//         //     pos: sp[4],
//         //     file: path.basename(sp[2]),
//         //     stack: stacklist.join('\n')
//         //   }
//     }

//     return '';
// }