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
            secondWidth: 10
        });

        await imageMaker.init();

        expect(imageMaker).to.be.an.instanceOf(ImageMaker);
        await imageMaker.renderAsBuffer();
        expect(imageMaker.renderAsBuffer()).to.eventually.be.an.instanceOf(Buffer);
    });

    it('overlay pitch, varied velocity', async () => {
        await Note.init();

        const notes = [
            new Note({
                startSeconds: 0,
                endSeconds: 1,
                pitch: 50,
                velocity: 100,
                channel: 0,
                track: 0
            }),
            new Note({
                startSeconds: 0,
                endSeconds: 1,
                pitch: 50,
                velocity: 50,
                channel: 0,
                track: 1
            })
        ];

        const imageMaker = new ImageMaker({ 
            width: 1000, 
            height: 700,
            noteHeight: 10,
            secondWidth: 60,
            // trackColours: ['red', 'blue']
        });

        await imageMaker.init();

        await imageMaker.createBlankImage();

        imageMaker.addNotes(notes);

        expect(imageMaker).to.be.an.instanceOf(ImageMaker);
        imageMaker.image = ImageMaker.Blank.clone();

        imageMaker._render(0.5);
        imageMaker.image.write('temp.png');
    });
    
});

