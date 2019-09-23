const path = require('path');
const fs = require('fs');

const chai = require("chai");
const expect = chai.expect;
chai.use(require('chai-fs'));
chai.use(require("chai-as-promised"));

const MidiFile = require('./MidiFile.mjs');
const Integrater = require("./Integrater.mjs");

MidiFile.verbose = true;

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
    midiFilepath: 'fixtures/b.mid',
    // midiFilepath: 'fixtures/symphony_9_2_(c)cvikl.mid',
    // audioFilepath: 'fixtures/4bars-60bpm.wav',
    fps: 5,
    trackColours: orchestraColours,
    fitNotesToScreen: false
};

let integrater;

describe('Integrater', function () {
    this.timeout(1000 * 30);

    beforeEach(async () => {
        integrater = new Integrater(options);
        await integrater.init();
        if (fs.existsSync(integrater.options.outputpath)) {
            fs.unlinkSync(integrater.options.outputpath);
        }
    });

    afterEach(() => {
        if (fs.existsSync(integrater.options.outputpath)) {
            // fs.unlinkSync(integrater.options.outputpath);
        }
    });

    it('creates a video file', async () => {
        expect(integrater).to.be.an.instanceOf(Integrater);

        const promiseResolvesWhenFileWritten = integrater.integrate();
        expect(promiseResolvesWhenFileWritten).to.be.an.instanceOf(Promise);

        const encoderExitStatus = await promiseResolvesWhenFileWritten;
        expect(encoderExitStatus).to.equal(0);

        expect(
            path.resolve(integrater.options.outputpath)
        ).to.be.a.path();
    });

});

