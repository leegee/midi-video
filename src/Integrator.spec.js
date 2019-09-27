const path = require('path');
const fs = require('fs');

const chai = require("chai");
const expect = chai.expect;
chai.use(require('chai-fs'));
chai.use(require("chai-as-promised"));

const Integrator = require("./index");

const options = {
    midipath: 'fixtures/4bars-60bpm.mid',
    audioFilepath: 'fixtures/4bars-60bpm.wav',
    fps: 1, // 30,
};

let integrator;

describe('Integrator', function () {
    this.timeout(1000 * 60); 

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

