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
let titleMaker;

describe('Titles', function () {
    this.timeout(1000 * 60);

    beforeEach(() => {
        titleMaker = new TitleMaker({
            width: imageMaker.canvas.width,
            height: imageMaker.canvas.height,
            title: {
                text: "What'll I Do",
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
    });

    it('renders a title image', async () => {
        const canvas = titleMaker.getCanvas();
        const imageBuffer = canvas.toBuffer('image/png');
        const savePath = path.resolve('temp-title.png');
        fs.writeFileSync(savePath, imageBuffer);
        expect(savePath).to.be.a.path();
    });

    it('fades out', () => {
        const canvas = titleMaker.getCanvas();
        const savePath = path.resolve('temp-title-faded.png');

        this.options = {
            fadeTitleDuration: 8,
            titleDuration: 10,
        };

        const timeFrame = 1 / 10;

        const onePc = 100 / ((this.options.titleDuration - this.options.fadeTitleDuration) / timeFrame);

        let i = 0;
        for (let seconds = this.options.fadeTitleDuration; seconds <= this.options.titleDuration; seconds += timeFrame) {
            const pc = onePc * i++;

            const fadedTitleCanvas = titleMaker.getFadedTitleCanvas(pc);
            const titleImageBuffer = fadedTitleCanvas.toBuffer('image/png');

            if (pc > 60 && pc < 70) {
                fs.writeFileSync(savePath, titleImageBuffer);
                expect(savePath).to.be.a.path();
            }
        }

    });
});
