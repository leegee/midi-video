const path = require('path');
const fs = require('fs');

const chai = require("chai");
const expect = chai.expect;
chai.use(require('chai-fs'));
chai.use(require("chai-as-promised"));

const Integrator = require("./index");

let integrator;

describe('Integrator', function () {
    this.timeout(1000 * 60);

    xit('creates a video file from simple MIDI', async () => {
        const integrator = new Integrator({
            midipath: 'fixtures/4bars-60bpm.mid',
            audiopath: 'fixtures/4bars-60bpm.wav',
            fps: 1, // 30,
        });
        expect(integrator).to.be.an.instanceOf(Integrator);

        await integrator.init();
        if (fs.existsSync(integrator.options.outputpath)) {
            fs.unlinkSync(integrator.options.outputpath);
        }

        const promiseResolvesWhenFileWritten = integrator.integrate();
        expect(promiseResolvesWhenFileWritten).to.be.an.instanceOf(Promise);

        const encoderExitStatus = await promiseResolvesWhenFileWritten;
        expect(encoderExitStatus).to.equal(0);

        expect(
            path.resolve(integrator.options.outputpath)
        ).to.be.a.path();
    });

    it('creates a video file from real world  MIDI', async () => {
        const integrator = new Integrator({
            audiopath: 'fixtures/berlin/49-IrvgB What ll I Do (1924) cb Irving Berlin pb Adam Carroll [204871]-110bpm.wav',
            midipath: 'fixtures/berlin/49_MOD-IrvgB What ll I Do (1924) cb Irving Berlin pb Adam Carroll [204871].mid',
        });

        expect(integrator).to.be.an.instanceOf(Integrator);

        await integrator.init();
        if (fs.existsSync(integrator.options.outputpath)) {
            fs.unlinkSync(integrator.options.outputpath);
        }

        const promiseResolvesWhenFileWritten = integrator.integrate();
        expect(promiseResolvesWhenFileWritten).to.be.an.instanceOf(Promise);

        const encoderExitStatus = await promiseResolvesWhenFileWritten;
        expect(encoderExitStatus).to.equal(0);

        expect(
            path.resolve(integrator.options.outputpath)
        ).to.be.a.path();
    });
});

