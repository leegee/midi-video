#!/usr/bin/env node

const App = require("../src");

main();

async function main() {
    const integrator = new App({
        outputpath: 'Scott_Joplin_1920_The_Entertainer.mp4',
        audiopath: 'wav/the_enterainer.wav',
        midipath: 'fixtures/29-Scott Joplin - The Entertainer (1920) Smythe.mid',
        text: {
            title: "The Entertainer",
            composer: 'Scott Joplin, 1920',
            performer: 'anonymous Piano Roll'
        }
    });

    try {
        const encoderExitStatus = await integrator.integrate();
        this.logger.debug('Completed with code', encoderExitStatus);
    }
    catch (e) {
        console.trace();
        this.logger.error(e);
    }
}
