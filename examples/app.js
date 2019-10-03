#!/usr/bin/env node

const App = require("../src");

main();

async function main() {
    const app = new App({
        // outputpath: 'Scott_Joplin_1920_The_Entertainer.mp4',
        audiopath: 'fixtures/google-groove/groove/drummer1/session1/1_funk_80_beat_4-4.wav',
        midipath: 'fixtures/google-groove/groove/drummer1/session1/1_funk_80_beat_4-4.mid',
        text: {
            title: "4/4 Funk",
            composer: 'From the Google Groove Dataset',
            performer: 'Dillon Vado (Never Weather), Jonathan Fishman (Phish), Michaelle Goerlitz (Wild Mango), Nick Woodbury (SF Contemporary Music Players), Randy Schwartz (El Duo), Jon Gillick, Mikey Steczo, Sam Berman, and Sam Hancock'
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
