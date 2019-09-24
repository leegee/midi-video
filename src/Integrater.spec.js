const path = require('path');
const fs = require('fs');

const chai = require("chai");
const expect = chai.expect;
chai.use(require('chai-fs'));
chai.use(require("chai-as-promised"));

const Integrater = require("./Integrater.mjs");

const options = {
    logging: false,
    bpm: 60,
    midiFilepath: 'fixtures/4bars.mid',
    audioFilepath: 'fixtures/4bars-60bpm.wav',
    fps: 5
};

let integrater;

describe('Integrater', function () {
    this.timeout(1000 * 60); 

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

