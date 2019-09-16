const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-as-promised"));

const Jimp = require('jimp');

const Image = require("./Image.mjs");

describe('Image', () => {
    it('getBuffer', async () => {
        const image = new Image();
        expect(image).to.be.an.instanceOf(Image);
        const rv = await image.create({ width: 10, height: 10 });
        expect(rv).to.be.an.instanceOf(Image);
        expect(image.jimp).to.be.an.instanceOf(Jimp);
        expect(image.getBuffer()).to.eventually.be.an.instanceOf(Buffer);
    });

});

