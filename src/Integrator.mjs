const path = require('path');
const fs = require('fs');

const appLogger = require('./appLogger.mjs');

const MidiFile = require('./MidiFile.mjs');
const Encoder = require('./Encoder.mjs');
const ImageMaker = require('./ImageMaker.mjs');
const TitleMaker = require('./TitleMaker.mjs');
const assertOptions = require('./assertOptions.mjs');

module.exports = class Integrator {
    options = {
        RENDER_DISABLED: false,
        midipath: undefined,
        titleDuration: 4,
        fadeTitleDuration: 1,
        outputpath: undefined,
        width: 1920,
        height: 1080,
        fps: 30,
        trackHues: undefined,
        defaultHue: 100,
        fitNotesToScreen: true,
        beatsOnScreen: 12,
        text: undefined,
        colour: {
            minSaturationPc: 77,
            minLuminosityPc: 20,
            maxLuminosityPc: 100,
        }
    };
    totalImagesAdded = 0;
    beatsOnScreen = undefined;
    imageMaker = undefined;
    titleMaker = undefined;

    constructor(options = {}) {
        if (typeof options === 'string') {
            options = {
                midipath: options
            };
        }

        this.options = Object.assign({}, this.options, options);

        this.logger = appLogger;

        this.logger.debug('Create new  Integrator');

        if (this.options.RENDER_DISABLED) {
            this.logger.warn('*'.repeat(40), '\n', '* NO RENDERING TO VIDEO\n', '*'.repeat(40), '\n');
        }

        assertOptions(this.options, {
            midipath: 'path to the MIDI file to parse',
            beatsOnScreen: 'integer representing the number of whole measures to display at one time',
            fitNotesToScreen: 'boolean: scale the screen to fit the note-range used by the MIDI file. If false, supply the option midiNoteRange',
            colour: {
                minLuminosityPc: 'Number, 0-100',
                maxLuminosityPc: 'Number, 0-100'
            }
        });

        if (!this.options.outputpath) {
            this.options.outputpath =
                path.resolve(
                    path.dirname(this.options.midipath),
                    path.basename(
                        this.options.midipath,
                        path.extname(this.options.midipath)
                    ) + '.mp4'
                );

            console.info('Output will be:', this.options.outputpath);
        }

        if (this.options.midiNoteRange) {
            this.options.fitNotesToScreen = false;
        }

        this.beatsOnScreen = this.options.beatsOnScreen;

        ['midipath', 'audiopath'].forEach(key => {
            if (typeof this.options[key] !== 'undefined') {
                this.options[key] = path.resolve(this.options[key]);
                if (!fs.existsSync(this.options[key])) {
                    throw new Error('The input file for option "' + key + '" does not exist: ' + this.options[key]);
                }
            }
        });
    }

    async _init() {
        this.logger.debug('Integrator.init enter');

        this.midiFile = new MidiFile(this.options);

        const midiNoteRange = await this.midiFile.parse();

        this.logger.debug('MIDI note range: ', midiNoteRange);
        this.logger.debug('Integrator.new create ImageMaker');

        const trackHues = this.options.trackHues ? this.midiFile.mapTrackNames2Hues(this.options.trackHues, this.options.defaultHue) :
            ImageMaker.createColourList(this.midiFile.tracks.length, this.options.defaultHue);

        const imArgs = {
            ...this.options,
            midiNoteRange,
            trackHues,
            beatsOnScreen: this.beatsOnScreen,
            secondWidth: Math.floor(this.options.width / this.beatsOnScreen),
        };
        if (this.options.noteHues) {
            imArgs.noteHues = this.midiFile.fitNoteHues(this.options.noteHues);
        }
        this.imageMaker = new ImageMaker(imArgs);

        await this.imageMaker.init();

        this.logger.debug('noteHeight: ', this.imageMaker.noteHeight);
        this.logger.debug('FPS:', this.options.fps);

        this.logger.debug('Integrator.init done');
    }

    async integrate() {
        this.logger.debug('Integrator.integrate enter');
        await this._init();

        let promiseResolvesWhenFileWritten;
        if (this.options.RENDER_DISABLED) {
            promiseResolvesWhenFileWritten = Promise.resolve();
        } else {
            this.encoder = new Encoder(this.options);
            promiseResolvesWhenFileWritten = this.encoder.init();
        }

        const timeFrame = 1 / this.options.fps;

        this.logger.debug('Integrator.integrate MIDI of %d seconds timeFrame for %d beats on screen: timeFrame size %d',
            this.midiFile.durationSeconds, this.beatsOnScreen, timeFrame
        );

        if (this.options.createTitle || this.options.text) {
            if (this.options.titleDuration - this.options.fadeTitleDuration < 0) {
                throw new RangeError('this.options.titleDuration - this.options.fadeTitleDuration < 0');
            }

            const durationOpaque = this.options.titleDuration - this.options.fadeTitleDuration;
            const titleCanvas = this.getTitleCanvas();
            const titleImage = titleCanvas.toBuffer('image/png');

            this.logger.info('Titles: full=%d, opaque=%d, fade=%d',
                this.options.titleDuration, durationOpaque, this.options.fadeTitleDuration
            );

            if (!this.options.RENDER_DISABLED) {
                for (let seconds = 0; seconds <= durationOpaque; seconds += timeFrame) {
                    this.encoder.addImage(titleImage);
                }
            }

            const onePc = 100 / (this.options.fadeTitleDuration / timeFrame);
            let i = 0;

            for (let seconds = 0; seconds <= this.options.fadeTitleDuration; seconds += timeFrame) {
                const pc = onePc * i++;
                const fadedTitleCanvas = this.titleMaker.getFadedTitleCanvas(pc);
                const titleImage = fadedTitleCanvas.toBuffer('image/png');
                if (!this.options.RENDER_DISABLED) {
                    this.encoder.addImage(titleImage);
                }
            }
        }

        for (
            let currentTime = 0; currentTime <= this.midiFile.durationSeconds + (this.beatsOnScreen / 2); currentTime += timeFrame
        ) {
            this.logger.debug('Current time = ', currentTime);
            const image = await this.imageMaker.getFrame(currentTime);
            if (!this.options.RENDER_DISABLED) {
                this.encoder.addImage(image);
            }
        }

        if (!this.options.RENDER_DISABLED) {
            this.logger.debug('All time frames parsed: call Encoder.finalise');
            this.encoder.finalise();
            this.logger.debug('Called Encoder.finalise');
        }

        this.logger.debug('ImageMaker height %d, range: ', this.imageMaker.options.height, this.imageMaker.ranges);
        return promiseResolvesWhenFileWritten;
    }

    getTitleCanvas() {
        this.titleMaker = new TitleMaker({
            width: this.options.width,
            height: this.options.height,
            title: {
                text: this.options.text ? this.options.text.title || '' : '',
                maxSize: 500,
                color: 'white',
                font: path.resolve('fonts/Playfair_Display/PlayfairDisplay-Italic.ttf')
            },
            composer: {
                text: this.options.text ? this.options.text.composer || '' : '',
                maxSize: 80,
                color: 'rgba(255, 255, 255, 0.7)',
                font: path.resolve('fonts/Playfair_Display/PlayfairDisplay-Regular.ttf')
            },
            performer: {
                text: this.options.text ? this.options.text.performer || '' : '',
                maxSize: 80,
                color: 'rgba(255, 255, 255, 0.7)',
                font: path.resolve('fonts/Playfair_Display/PlayfairDisplay-Regular.ttf')
            }
        });

        return this.titleMaker.getCanvas();
    }
}