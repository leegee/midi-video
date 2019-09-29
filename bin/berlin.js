const path = require('path');
const fs = require('fs');

const App = require("../src");

main();

main() {
    const integrator = new App({
        audiopath: '../fixtures/berlin/49-IrvgB What ll I Do (1924) cb Irving Berlin pb Adam Carroll [204871]-110bpm.wav',
        midipath: '../fixtures/berlin/49_MOD-IrvgB What ll I Do (1924) cb Irving Berlin pb Adam Carroll [204871].mid',
    });

    await integrator.init();

    const encoderExitStatus = await integrator.integrate();
    
    console.log('Completed with code', encoderExitStatus);
}