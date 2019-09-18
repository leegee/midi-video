const path = require('path');
const fs = require('fs');
// const tmp = require('tmp');
const chai = require("chai");
const expect = chai.expect;
chai.use(require('chai-fs'));
chai.use(require("chai-as-promised"));

const Integrater = require("./Integrater.mjs");

// const tempDir = tmp.dirSync().name;

const options = {
    bpm: 107,
    filepath: 'fixtures/one.mid'
};

let integrater;

describe('Integrater', () => {
    beforeEach(() => {
        integrater = new Integrater(options);
        if (fs.existsSync(integrater.options.outputpath)) {
            fs.unlinkSync(integrater.options.outputpath);
        }
    });

    // afterEach(() => {
    //     if (fs.existsSync(integrater.options.outputpath)) {
    //         // fs.unlinkSync(integrater.options.outputpath);
    //     }
    // });

    it('creates a video file', async () => {
        expect(integrater).to.be.an.instanceOf(Integrater);

        const promiseResolvesWhenFileWritten = integrater.integrate();
        expect(promiseResolvesWhenFileWritten).to.be.an.instanceOf(Promise);

        await promiseResolvesWhenFileWritten;
        console.log('Promise resolved');
        expect(
            path.resolve(integrater.options.outputpath)
        ).to.be.a.path();
    });

});

