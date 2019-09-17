const chai = require("chai");
const expect = chai.expect;
chai.use(require('chai-fs'));
chai.use(require("chai-as-promised"));

const fs = require('fs');
// const tmp = require('tmp');

const Integrater = require("./Integrater.mjs");

// const tempDir = tmp.dirSync().name;

const options = {
    bpm: 107,
    filepath: 'fixtures/boo.mid'
};

let integrater;

describe('Encoder', () => {
    beforeEach(() => {
        integrater = new Integrater(options);
        if (fs.existsSync(integrater.options.outputpath)) {
            fs.unlinkSync(integrater.options.outputpath);
        }
    });

    afterEach(() => {
        if (fs.existsSync(integrater.options.outputpath)) {
            // fs.unlinkSync(integrater.options.outputpath);
        }
    });

    it('create video', async () => {
        expect(integrater).to.be.an.instanceOf(Integrater);

        const promiseResolvesWhenFileWritten = integrater.integrate();
        expect(promiseResolvesWhenFileWritten).to.be.an.instanceOf(Promise);

        await promiseResolvesWhenFileWritten;
        expect(integrater.options.outputpath).to.be.a.path();
    });

});

