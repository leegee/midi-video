#!/usr/bin/env node

const App = require("../src");

main();

async function main() {
    const app = new App({
        outputpath: 'alexanders_ragtime_band.mp4',
        audiopath: 'wav/alexanders_ragtime_band.wav',
        midipath: 'fixtures/todo/03-IrvgB Alexanders Ragtime Band (1911) cb Irving Berlin [3070].mid',
        text: {
            title: "Alexander's Ragtime Band",
            composer: 'Irving Berlin',
            performer: '1911'
        }
    });

    try {
        const encoderExitStatus = await app.integrate();
        app.options.logger.debug('Completed with code', encoderExitStatus);
    }
    catch (e) {
        console.trace();
        console.error('------------------');
        console.error(e);
    }
}
