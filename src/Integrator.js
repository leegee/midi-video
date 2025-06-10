import path from 'path';
import fs from 'fs';

import appLogger from './appLogger.js';

import MidiFile from './MidiFile.js';
import Encoder from './Encoder.js';
import ImageMaker from './ImageMaker.js';
import TitleMaker from './TitleMaker.js';
import assertOptions from './assertOptions.js';

export default class Integrator {
    options = {
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

        this.options.logger = this.options.logger || appLogger;

        this.options.logger.debug('Create new  Integrator');

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

        for (const key of ['midipath', 'audiopath']) {
            if (typeof this.options[key] !== 'undefined') {
                this.options[key] = path.resolve(this.options[key]);
                if (!fs.existsSync(this.options[key])) {
                    throw new Error('The input file for option "' + key + '" does not exist: ' + this.options[key]);
                }
            }
        }
    }

    async _init() {
        this.options.logger.debug('Integrator.init enter');

        this.midiFile = new MidiFile(this.options);

        const midiNoteRange = await this.midiFile.parse();

        this.options.logger.debug('MIDI note range: ', midiNoteRange);
        this.options.logger.debug('Integrator.new create ImageMaker');

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

        this.options.logger.debug('noteHeight: ', this.imageMaker.noteHeight);
        this.options.logger.debug('FPS:', this.options.fps);

        this.options.logger.debug('Integrator.init done');
    }

    async integrate() {
        this.options.logger.debug('Integrator.integrate enter');
        await this._init();

        let promiseResolvesWhenImgPipeClosed;
        this.encoder = new Encoder(this.options);
        promiseResolvesWhenImgPipeClosed = this.encoder.init();

        const timeFrame = 1 / this.options.fps;

        this.options.logger.debug('Integrator.integrate MIDI of %d seconds timeFrame for %d beats on screen: timeFrame size %d',
            this.midiFile.durationSeconds, this.beatsOnScreen, timeFrame
        );

        if (this.options.text) {
            if (this.options.titleDuration - this.options.fadeTitleDuration < 0) {
                throw new RangeError('this.options.titleDuration - this.options.fadeTitleDuration < 0');
            }

            const durationOpaque = this.options.titleDuration - this.options.fadeTitleDuration;
            const titleCanvas = this.getTitleCanvas();
            const titleImage = titleCanvas.toBuffer('image/png');

            this.options.logger.info('Titles: full=%d, opaque=%d, fade=%d',
                this.options.titleDuration, durationOpaque, this.options.fadeTitleDuration
            );

            for (let seconds = 0; seconds <= durationOpaque; seconds += timeFrame) {
                this.encoder.addImage(titleImage);
            }

            const onePc = 100 / (this.options.fadeTitleDuration / timeFrame);
            let i = 0;

            for (let seconds = 0; seconds <= this.options.fadeTitleDuration; seconds += timeFrame) {
                const pc = onePc * i++;
                const fadedTitleCanvas = this.titleMaker.getFadedTitleCanvas(pc);
                const titleImage = fadedTitleCanvas.toBuffer('image/png');
                this.encoder.addImage(titleImage);
            }
        }

        this.options.logger.info('Integrator: beginning main render');

        // for (
        //     let currentTime = 0;
        //     currentTime <= this.midiFile.durationSeconds + (this.beatsOnScreen / 2);
        //     currentTime += timeFrame
        // ) {
        //     this.options.logger.debug('Current time = ', currentTime);
        //     const image = await this.imageMaker.getFrame(currentTime);
        //     this.encoder.addImage(image);
        // }

        const renderDuration = this.midiFile.durationSeconds + (this.beatsOnScreen / 2);
        const totalFrames = Math.ceil(renderDuration * this.options.fps);   // integer
        const timePerFrame = 1 / this.options.fps;

        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
            const currentTime = frameIndex * timePerFrame;

            this.options.logger.debug('Frame %d / %d  |  t = %f s', frameIndex, totalFrames, currentTime);

            const image = await this.imageMaker.getFrame(currentTime);
            this.encoder.addImage(image);
        }


        this.options.logger.info('Integrator: Main render complete');
        this.options.logger.debug('ImageMaker height %d, range: ', this.imageMaker.options.height, this.imageMaker.ranges);
        this.options.logger.debug('All time frames parsed: call Encoder.finalise');

        this.encoder.finalise();
        this.options.logger.debug('Called Encoder.finalise. All done.');

        return promiseResolvesWhenImgPipeClosed;
    }

    getTitleCanvas() {
        this.titleMaker = new TitleMaker({
            width: this.options.width,
            height: this.options.height,
            title: {
                text: this.options.text ? this.options.text.title || '' : '',
                maxSize: 500,
            },
            composer: {
                text: this.options.text ? this.options.text.composer || '' : '',
                maxSize: 80,
            },
            performer: {
                text: this.options.text ? this.options.text.performer || '' : '',
                maxSize: 80,
            }
        });

        return this.titleMaker.getCanvas();
    }
}