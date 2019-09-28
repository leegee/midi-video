const path = require('path');
const fs = require('fs');

const orchestraColours =require('../src/Colours/Orchestral.mjs');
const App = require("../src");

const options = {
    // midipath: 'fixtures/b.mid',
    midipath: 'fixtures/symphony_9_2_(c)cvikl.mid',
    // audiopath: 'fixtures/4bars-60bpm.wav',
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
