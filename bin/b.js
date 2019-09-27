const path = require('path');
const fs = require('fs');

const orchestraColours =require('../src/Colours/Orchestral.mjs');
const App = require("../src");

const options = {
    // midiFilepath: 'fixtures/b.mid',
    midiFilepath: 'fixtures/symphony_9_2_(c)cvikl.mid',
    // audioFilepath: 'fixtures/4bars-60bpm.wav',
    fps: 25,
    trackHues: orchestraColours,
    fitNotesToScreen: false,
    logging: false,
};

main();

async function main() {
    console.info('Begin...');
    
    const app = new App(options);

    await app.init();
    await app.integrate();

    console.log('Wrote ',
        path.resolve(app.options.outputpath)
    );
}
