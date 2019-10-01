#!/usr/bin/env node

const path = require('path');

const App = require("../src");

main();

async function main() {
    const integrator = new App({
        // audiopath: path.resolve('fixtures/berlin/49-IrvgB What ll I Do (1924) cb Irving Berlin pb Adam Carroll [204871]-110bpm.wav'),
        // midipath: path.resolve('fixtures/berlin/49_MOD-IrvgB What ll I Do (1924) cb Irving Berlin pb Adam Carroll [204871].mid'),
        outputpath: path.resolve('god-bless-america.mp4'),
        audiopath: path.resolve('wav/god-bless-america.wav'),
        midipath: path.resolve('fixtures/berlin/16-MOD-IrvgB God Bless America (1939) cb Irving Berlin [7024].mid'),
        text: {
            title: "God Bless America",
            composer: 'Irving Berlin, 1918',
            // performer: 'Piano Roll by Adam Carroll'
        }
    });

    try {
        const encoderExitStatus = await integrator.integrate();
        console.log('Completed with code', encoderExitStatus);
    }
    catch (e) {
        console.trace();
        console.error(e);
    }
}
