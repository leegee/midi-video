#!/usr/bin/env node

const App = require("../src");

main();

async function main() {
    const app = new App({
        outputpath: 'Scott_Joplin_1920_The_Entertainer.mp4',
        audiopath: 'wav/the_entertainer.wav',
        midipath: 'fixtures/the_entertainer.mid',
        text: {
            title: "The Entertainer",
            composer: 'Scott Joplin, 1920',
            performer: 'Anonymous Piano Roll'
        }
    });

    try {
        const encoderExitStatus = await app.integrate();
        this.logger.debug('Completed with code', encoderExitStatus);
    }
    catch (e) {
        console.trace();
        console.error(e);
    }
}
