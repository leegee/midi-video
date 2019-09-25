const path = require('path');
const fs = require('fs');

const MidiFile = require('../src/MidiFile.mjs');
const Integrator = require("../src/Integrator.mjs");

MidiFile.logging = false;

const orchestraColours = {
    'Flauti': 'hsl(60, 77%, 63%)',
    'Oboi': 'hsl(90, 77%, 33%)',
    'Clarinetti': 'hsl(90, 77%, 43%)',
    'Fagotti': 'hsl(300, 77%, 83%)',
    'Corni ': 'hsl(120, 77%, 43%)',
    'Corni': 'hsl(150, 77%, 43%)',
    'Trombe': 'hsl(180, 77%, 43%)',
    'Tromboni': 'hsl(210, 77%, 43%)',
    'Trombono Basso': 'hsl(240, 77%, 43%)',
    'Timpani': 'hsl(280, 77%, 43%)',
    'Violini I': 'hsl(63, 77%, 53%)',
    'Violini II': 'hsl(66, 77%, 63%)',
    'Viole': 'hsl(60, 77%, 33%)',
    'Violoncelli': 'hsl(30, 77%, 43%)',
    'Contrabassi': 'hsl(7, 77%, 43%)'
};

const options = {
    bpm: 60,
    // midiFilepath: 'fixtures/b.mid',
    midiFilepath: 'fixtures/symphony_9_2_(c)cvikl.mid',
    // audioFilepath: 'fixtures/4bars-60bpm.wav',
    fps: 5,
    trackColours: orchestraColours,
    fitNotesToScreen: false,
    logging: false,
};

main();

async function main() {
    console.info('Begin...');
    
    const integrator = new Integrator(options);

    if (fs.existsSync(integrator.options.outputpath)) {
        fs.unlinkSync(integrator.options.outputpath);
    }

    await integrator.init();
    await integrator.integrate();

    console.log('Wrote ',
        path.resolve(integrator.options.outputpath)
    );
}
