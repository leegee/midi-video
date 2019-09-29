const path = require('path');
const fs = require('fs');

const chai = require("chai");
const expect = chai.expect;
chai.use(require('chai-fs'));
chai.use(require("chai-as-promised"));

const Integrator = require("./Integrator.mjs");

const options = {
    midipath: 'fixtures/b.mid',
    midipath: 'fixtures/2019-09-02.mid',
    audiopath: 'fixtures/2019-09-02.wav',
    fps: 30,
    // trackHues: orchestraColours,
    fitNotesToScreen: true
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

