const path = require('path');
const fs = require('fs');

const orchestraColours = require('../src/Colours/Orchestral.mjs');
const App = require("../src");

const options = {
    // midipath: 'fixtures/b.mid',
    midipath: 'fixtures/boo-full.mid',
    audiopath: 'fixtures/boo-107bpm.wav',
    fps: 25,
    logging: false,
    fitNotesToScreen: true,
};

main();

async function main() {
    console.info('Begin...');

    const app = new App(options);

    if (fs.existsSync(app.options.outputpath)) {
        fs.unlinkSync(app.options.outputpath);
    }

    await app.init();
    await app.integrate();

    console.log('Wrote ',
        path.resolve(app.options.outputpath)
    );
}
