const path = require('path');
const fs = require('fs');

const chai = require("chai");
const expect = chai.expect;
chai.use(require('chai-fs'));
chai.use(require("chai-as-promised"));

const Integrator = require("./index");
const Note = require("./Note.mjs");
const noteHues = require('../src/Colours/roland-td11.mjs');

beforeEach(async () => {
    await Note.reset();
});
afterEach(async () => {
    await Note.reset();
});

describe('Integrator', function () {
    this.timeout(1000 * 60);

    it('noteHues for drums', async () => {
        const integrator = new Integrator({
            noteHues,
            midipath: 'fixtures/drum-track.mid'
        });

        await integrator.integrate();
    });

    xit('Y range', async () => {
        const integrator = new Integrator({
            outputpath: path.resolve('god-bless-america.mp4'),
            midipath: path.resolve('fixtures/berlin/16-MOD-IrvgB God Bless America (1939) cb Irving Berlin [7024].mid'),
            fps: 1,
            createTitle: false,
            RENDER_DISABLED: true
        });

        await integrator.integrate();

        expect(integrator.imageMaker.options.height).not.to.be.NaN;
        expect(integrator.imageMaker.ranges.y.lo).not.to.be.undefined;
    });

    xit('creates a video file from simple MIDI', async () => {
        const integrator = new Integrator({
            midipath: 'fixtures/4bars-60bpm.mid',
            audiopath: 'fixtures/4bars-60bpm.wav',
            largerNotes: true,
            fps: 5, // 30,
            text: {
                title: "4 Bar Test",
                composer: 'Random',
                performer: 'Bitwig'
            }
        });
        expect(integrator).to.be.an.instanceOf(Integrator);

        expect(integrator.options.outputpath).to.equal(
            path.resolve('fixtures/4bars-60bpm.mp4')
        );

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

    xit('creates a video file from real world Irving Berlin MIDI', async () => {
        const integrator = new Integrator({
            // audiopath: 'fixtures/berlin/49-IrvgB What ll I Do (1924) cb Irving Berlin pb Adam Carroll [204871]-110bpm.wav',
            midipath: 'fixtures/berlin/49_MOD-IrvgB What ll I Do (1924) cb Irving Berlin pb Adam Carroll [204871].mid',
            text: {
                title: "What'll I Do",
                composer: 'Irving Berlin, 1923',
                performer: 'Piano Roll by Adam Carroll'
            }
        });

        expect(integrator).to.be.an.instanceOf(Integrator);

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