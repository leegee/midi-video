const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-as-promised"));

const Jimp = require('jimp');

const ImageMaker = require("./ImageMaker.mjs");

describe('ImageMaker', () => {
    it('get', async () => {
        const imageMaker = new ImageMaker({ width: 10, height: 10 });
        expect(imageMaker).to.be.an.instanceOf(ImageMaker);
        await imageMaker.addNotes();
        expect(imageMaker.image).to.be.an.instanceOf(Jimp);
        expect(imageMaker.render()).to.eventually.be.an.instanceOf(Buffer);
    });

});

