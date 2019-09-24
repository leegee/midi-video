const path = require('path');
const fs = require('fs');
const Jimp = require('jimp');
const chai = require("chai");
const expect = chai.expect;

chai.use(require('chai-fs'));
chai.use(require("chai-as-promised"));

const ImageMaker = require("./ImageMaker.mjs");
const Note = require('./Note.mjs');


describe('ImageMaker', () => {
    xit('get', async () => {
        const imageMaker = new ImageMaker({
            width: 100,
            height: 100,
            noteHeight: 10,
            secondWidth: 10,
            beatsOnScreen: 10,
            logging: false,
            debug: true
        });

        await imageMaker.init();

        expect(imageMaker).to.be.an.instanceOf(ImageMaker);
        await imageMaker.renderToBuffer();
        expect(imageMaker.renderToBuffer()).to.eventually.be.an.instanceOf(Buffer);
    });

    it('overlay pitch, varied velocity', async () => {
        await Note.init();

        const noteArgs = {
            startSeconds: 0,
            endSeconds: 1,
            pitch: 50,
            channel: 0,
        };

        new Note({
            ...noteArgs,
            track: 0,
            velocity: 100
        }).save();

        new Note({
            ...noteArgs,
            track: 1,
            velocity: 50
        }).save();

        const im = new ImageMaker({
            debug: true,
            width: 1000,
            height: 1000,
            noteHeight: 10,
            secondWidth: 60,
            beatsOnScreen: 1,
            trackColours: ['#ffdd00', 'blue', 'pink']
        });
        expect(im).to.be.an.instanceOf(ImageMaker);

        await im.init();
        await im.createBlankImage();

        // im.image = ImageMaker.Blank.clone();
        // im.positionPlayingNotes(0.5);
        // im._drawPlayingNotes(0.5);

        const imageBuffer = await im.getFrame(0.5);

        expect(imageBuffer).to.be.an.instanceOf(Buffer);

        console.log(imageBuffer);

        const savePath = path.resolve('temp.png');
        // imageBuffer.write(savePath);
        fs.writeFileSync(savePath, imageBuffer);

        expect(savePath).to.be.a.path();
    });

});

