// const fs = require('fs');

const { expect } = require("chai");
// require('chai').use(require('chai-fs'));
// const tmp = require('tmp');

const Encoder = require("./Encoder.mjs");

// const tempDir = tmp.dirSync().name;

describe('init', () => {
    beforeEach(() => {
    });

    it('init', () => {
        const e = new Encoder();
        expect(e).to.be.an.instanceOf(Encoder);
    });

});

