const path = require('path');
const fs = require('fs');

const chai = require("chai");
const expect = chai.expect;
chai.use(require('chai-fs'));
chai.use(require("chai-as-promised"));

const MidiFile = require('./MidiFile.mjs');
const Integrator = require("./Integrator.mjs");

MidiFile.logging = false;

const options = {
    bpm: 100,
    midiFilepath: 'fixtures/4bars.mid',
    audioFilepath: 'fixtures/4bars-100bpm.wav',
    fps: 5,
    fitNotesToScreen: true,
    logging: true
};

let integrator;

describe('Integrator', function () {
    this.timeout(1000 * 30);

    beforeEach(async () => {
        integrator = new Integrator(options);
        await integrator.init();
        if (fs.existsSync(integrator.options.outputpath)) {
            fs.unlinkSync(integrator.options.outputpath);
        }
    });

    afterEach(() => {
        if (fs.existsSync(integrator.options.outputpath)) {
            // fs.unlinkSync(integrator.options.outputpath);
        }
    });

    it('creates a video file', async () => {
        expect(integrator).to.be.an.instanceOf(Integrator);

        const promiseResolvesWhenFileWritten = integrator.integrate();
        expect(promiseResolvesWhenFileWritten).to.be.an.instanceOf(Promise);

        const encoderExitStatus = await promiseResolvesWhenFileWritten;
        expect(encoderExitStatus).to.equal(0);

        expect(
            path.resolve(integrator.options.outputpath)
        ).to.be.a.path();
    });

});

