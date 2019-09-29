const path = require('path');
const fs = require('fs');

const chai = require("chai");
const expect = chai.expect;
chai.use(require('chai-fs'));
chai.use(require("chai-as-promised"));

const Titles = require("./Titles.mjs");
const ImageMaker = require("./ImageMaker.mjs");

const imageMaker = new ImageMaker({
    beatsOnScreen: 2,
    secondWidth: 1,
    width: 1920,
    height: 1080
});

const canvas = imageMaker.createBlankImage();

describe('Titles', function () {
    this.timeout(1000 * 60);

    it('renders a title image', async () => {
        const titles = new Titles({
            ctx: imageMaker.ctx,
            title: 'What Would I Do',
            composer:  'Irving Berlin, 1923',
            performer: 'Piano Roll by Adam Carroll',
        });
    });

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
});
