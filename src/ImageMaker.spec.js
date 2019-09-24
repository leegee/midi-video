const Jimp = require('jimp');

const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-as-promised"));

const ImageMaker = require("./ImageMaker.mjs");
const Note = require('./Note.mjs');


describe('ImageMaker', () => {
    it('get', async () => {
        const imageMaker = new ImageMaker({
            width: 100,
            height: 100,
            noteHeight: 10,
            secondWidth: 10,
            beatsOnScreen: 10,
            logging: true,
            debug: true
        });

        await imageMaker.init();

        expect(imageMaker).to.be.an.instanceOf(ImageMaker);
        await imageMaker.renderToBuffer();
        expect(imageMaker.renderToBuffer()).to.eventually.be.an.instanceOf(Buffer);
    });

    it('overlay pitch, varied velocity', async () => {
        await Note.init();

        new Note({
            startSeconds: 0,
            endSeconds: 1,
            pitch: 50,
            velocity: 100,
            channel: 0,
            track: 0
        }).save();

        new Note({
            startSeconds: 0,
            endSeconds: 1,
            pitch: 50,
            velocity: 50,
            channel: 0,
            track: 1
        }).save();

        const im = new ImageMaker({
            width: 1000,
            height: 700,
            noteHeight: 10,
            secondWidth: 60,
            beatsOnScreen: 10,
            // trackColours: ['red', 'blue']
        });

        await im.init();

        await im.createBlankImage();
        expect(im).to.be.an.instanceOf(ImageMaker);

        // im.image = ImageMaker.Blank.clone();
        // im.positionPlayingNotes(0.5);
        // im._drawPlayingNotes(0.5);

        const imageBuffer = await im.getFrame(0.5);

        expect(imageBuffer).to.be.an.instanceOf(Buffer);

        imageBuffer.write('temp.png');
    });

});

