const path = require('path');

const MidiFile = require('./MidiFile.mjs');
const Encoder = require('./Encoder.mjs');
const ImageMaker = require('./ImageMaker.mjs');
const TitleMaker = require('./TitleMaker.mjs');
const assertOptions = require('./assertOptions.mjs');

module.exports = class Integrator {
    options = {
        logging: false,
        midipath: null,
        titleDuration: 2,
        outputpath: 'output.mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        trackHues: undefined,
        defaultHue: 100,
        fitNotesToScreen: true,
        beatsOnScreen: 12,
        createTitle: true,
        colour: {
            minSaturationPc: 77,
            minLuminosityPc: 20,
            maxLuminosityPc: 100,
            text: {
                composer: '',
                performer: '',
                title: ''
            }
        }
    };
    finalPath = undefined;
    totalImagesAdded = 0;
    beatsOnScreen = undefined;
    imageMaker = undefined;

    constructor(options = {}) {
        if (typeof options === 'string') {
            options = {
                midipath: options
            };
        }

        this.options = Object.assign({}, this.options, options);
        this.log = this.options.logging ? console.log : () => { };

        this.log('Create new  Integrator');

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
            this.options.outputpath = path.join(
                path.dirname(this.options.midipath),
                path.basename(
                    this.options.midipath,
                    path.extname(this.options.midipath)
                ) + '.mp4'
            );
        }

        this.finalPath = this.options.outputpath;

        // if (typeof this.options.fitNotesToScreen === 'undefined' && typeof this.options.midiNoteRange === 'undefined') {
        //     throw new TypeError('Supply either fitNotesToScreen=true or midiNoteRange=integer.');
        // }

        if (this.options.midiNoteRange) {
            this.options.fitNotesToScreen = false;
        }

        this.beatsOnScreen = this.options.beatsOnScreen;
    }

    async _init() {
        this.log('Integrator.init enter');

        this.midiFile = new MidiFile(this.options);

        const midiNoteRange = await this.midiFile.parse();

        this.log('Reset MIDI note range: ', midiNoteRange);
        this.log('Integrator.new create ImageMaker');

        const trackHues = this.options.trackHues ? this.midiFile.mapTrackNames2Hues(this.options.trackHues, this.options.defaultHue)
            : ImageMaker.createColourList(this.midiFile.tracks.length, this.options.defaultHue);

        this.imageMaker = new ImageMaker({
            ...this.options,
            midiNoteRange,
            trackHues,
            beatsOnScreen: this.beatsOnScreen,
            secondWidth: Math.floor(this.options.width / this.beatsOnScreen),
        });

        await this.imageMaker.init();

        this.log('noteHeight: ', this.imageMaker.options.noteHeight);
        this.log('FPS:', this.options.fps);

        this.log('Integrator.init done');
    }

    async integrate() {
        this.log('Integrator.integrate enter');
        await this._init();

        this.encoder = new Encoder(this.options);
        const promiseResolvesWhenFileWritten = this.encoder.init();

        const timeFrame = 1 / this.options.fps;
        const maxTime = this.midiFile.durationSeconds + (this.beatsOnScreen / 2);

        this.log('Integrator.integrate MIDI of %d seconds timeFrame for %d beats on screen: timeFrame size %d, expected length %d ',
            this.midiFile.durationSeconds, this.beatsOnScreen, timeFrame, maxTime
        );

        if (this.options.createTitle) { // xxx
            const titleCanvas = this.getTitleCanvas();
            const titleImage = titleCanvas.toBuffer('image/png');
            for (let seconds = 0; seconds <= this.options.titleDuration; seconds++) {
                this.encoder.addImage(titleImage);
            }
        }

        for (let currentTime = 0; currentTime <= maxTime; currentTime += timeFrame) {
            this.log('Current time = ', currentTime);
            const image = await this.imageMaker.getFrame(currentTime);
            this.encoder.addImage(image);
        }

        this.log('All time frames parsed: call Encoder.finalise');
        this.encoder.finalise();
        this.log('Called Encoder.finalise');
        return promiseResolvesWhenFileWritten;
    }

    getTitleCanvas() {
        const titleMaker = new TitleMaker({
            width: this.options.width,
            height: this.options.height,
            title: {
                text: this.options.text.title,
                maxSize: 500,
                color: 'white',
                font: path.resolve('fonts/Playfair_Display/PlayfairDisplay-Italic.ttf')
            },
            composer: {
                text: this.options.text.composer,
                maxSize: 80,
                color: 'rgba(255, 255, 255, 0.7)',
                font: path.resolve('fonts/Playfair_Display/PlayfairDisplay-Regular.ttf')
            },
            performer: {
                text: this.options.text.performer,
                maxSize: 80,
                color: 'rgba(255, 255, 255, 0.7)',
                font: path.resolve('fonts/Playfair_Display/PlayfairDisplay-Regular.ttf')
            }
        });

        return titleMaker.getCanvas();
    }

}