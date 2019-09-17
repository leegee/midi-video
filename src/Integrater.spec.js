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
            fs.unlinkSync(integrater.options.outputpath);
        }
    });

    it('create video', () => {
        expect(integrater).to.be.an.instanceOf(Integrater);

        const p = integrater.integrate();
        expect(p).to.be.an.instanceOf(Promise);

        p.then(() => {
            expect(integrater.options.outputpath).to.be.a.path();
        });
    });

});

