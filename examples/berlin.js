const path = require('path');
const fs = require('fs');

const App = require("../src");

main();

async function main() {
    const integrator = new App({
        audiopath: path.resolve('fixtures/berlin/49-IrvgB What ll I Do (1924) cb Irving Berlin pb Adam Carroll [204871]-110bpm.wav'),
        midipath: path.resolve('fixtures/berlin/49_MOD-IrvgB What ll I Do (1924) cb Irving Berlin pb Adam Carroll [204871].mid'),
        text: {
            title: "What'll I Do",
            composer: 'Irving Berlin, 1923',
            performer: 'Piano Roll by Adam Carroll'
        }
    });

    try {
        await integrator.init();

        const encoderExitStatus = await integrator.integrate();

        console.log('Completed with code', encoderExitStatus);
    }
    catch (e) {
        console.error(e);
    }
}
