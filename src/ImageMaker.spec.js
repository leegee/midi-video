const path = require('path');
const fs = require('fs');
const chai = require("chai");
const expect = chai.expect;

chai.use(require('chai-fs'));

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
            midiNoteRange: 10,
            logging: true,
            debug: true
        });

        await imageMaker.init();

        expect(imageMaker).to.be.an.instanceOf(ImageMaker);
        await imageMaker.renderToBuffer();
        expect(imageMaker.renderToBuffer()).to.be.an.instanceOf(Buffer);
    });

    it('overlay pitch, varied velocity', async () => {
        await Note.init();

        const noteArgs = {
            startSeconds: 0,
            endSeconds: 1,
            pitch: 1,
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
            logging: true,
            debug: true,
            width: 1000,
            height: 1000,
            noteHeight: 10,
            secondWidth: 60,
            beatsOnScreen: 1,
            midiNoteRange: 10
        });
        expect(im).to.be.an.instanceOf(ImageMaker);

        await im.init();
        im.createBlankImage();

        // im.image = ImageMaker.Blank.clone();
        // im.positionPlayingNotes(0.5);
        // im._drawPlayingNotes(0.5);

        const imageBuffer = await im.getFrame(0.5);

        expect(imageBuffer).to.be.an.instanceOf(Buffer);

        const savePath = path.resolve('temp.png');
        fs.writeFileSync(savePath, imageBuffer);

        expect(savePath).to.be.a.path();
    });

});

