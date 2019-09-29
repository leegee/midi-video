const path = require('path');
const fs = require('fs');

const chai = require("chai");
const expect = chai.expect;
chai.use(require('chai-fs'));
chai.use(require("chai-as-promised"));

const TitleMaker = require("./TitleMaker.mjs");
const ImageMaker = require("./ImageMaker.mjs");

const imageMaker = new ImageMaker({
    beatsOnScreen: 2,
    secondWidth: 1,
    width: 1920,
    height: 1080
});

const canvas = imageMaker.createBlankImage();

describe('Titles', function () {
    this.timeout(1000 * 60);

    it('renders a title image', async () => {
        const titleMaker = new TitleMaker({
            width: imageMaker.canvas.width,
            height: imageMaker.canvas.height,
            title: {
                text: 'What Would I Do',
                maxSize: 500,
                color: 'white',
                font: path.resolve('fonts/Playfair_Display/PlayfairDisplay-Italic.ttf')
            },
            composer: {
                text: 'Irving Berlin, 1923',
                maxSize: 80,
                color: 'rgba(255, 255, 255, 0.7)',
                font: path.resolve('fonts/Playfair_Display/PlayfairDisplay-Regular.ttf')
            },
            performer: {
                text: 'Piano Roll by Adam Carroll',
                maxSize: 80,
                color: 'rgba(255, 255, 255, 0.7)',
                font: path.resolve('fonts/Playfair_Display/PlayfairDisplay-Regular.ttf')
            }
        });

        const canvas = titleMaker.getCanvas();
        const imageBuffer = canvas.toBuffer('image/png');
        const savePath = path.resolve('temp-title.png');
        fs.writeFileSync(savePath, imageBuffer);
        expect(savePath).to.be.a.path();
    });

});
