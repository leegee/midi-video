const path = require('path');

const MidiFile = require('./MidiFile.mjs');
const Encoder = require('./Encoder.mjs');
const ImageMaker = require('./ImageMaker.mjs');
const assertOptions = require('./assertOptions.mjs');

module.exports = class Integrator {
    options = {
        logging: false,
        midipath: null,
        outputpath: 'output.mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        trackHues: undefined,
        defaultHue: 100,
        fitNotesToScreen: true,
        beatsOnScreen: 12,
        colour: {
            minSaturationPc: 77,
            minLuminosityPc: 20,
            maxLuminosityPc: 100
        }
    };
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

        // if (typeof this.options.fitNotesToScreen === 'undefined' && typeof this.options.midiNoteRange === 'undefined') {
        //     throw new TypeError('Supply either fitNotesToScreen=true or midiNoteRange=integer.');
        // }

        if (this.options.midiNoteRange) {
            this.options.fitNotesToScreen = false;
        }

        this.beatsOnScreen = this.options.beatsOnScreen;
    }

    async init() {
        this.log('Integrator.init enter');

        this.midiFile = new MidiFile(this.options);

        const midiNoteRange = await this.midiFile.parse();

        this.log('Reset MIDI note range: ', midiNoteRange);
        this.log('Integrator.new create ImageMaker');

        this.imageMaker = new ImageMaker({
            ...this.options,
            midiNoteRange,
            trackHues: this.options.trackHues ? this.midiFile.mapTrackNames2Hues(this.options.trackHues, this.options.defaultHue)
                : ImageMaker.createColourList(this.midiFile.tracks.length),
            beatsOnScreen: this.beatsOnScreen,
            secondWidth: Math.floor(this.options.width / this.beatsOnScreen),
        });

        await this.imageMaker.init();

        this.log('noteHeight: ', this.imageMaker.options.noteHeight);
        this.log('FPS:', this.options.fps);
        this.log('Integrator.new create Encoder');

        this.encoder = new Encoder(this.options);

        this.log('Integrator.init done');
    }

    async integrate() {
        this.log('Integrator.integrate enter');
        const promiseResolvesWhenFileWritten = this.encoder.init();

        const timeFrame = 1 / this.options.fps;
        const maxTime = this.midiFile.durationSeconds + (this.beatsOnScreen / 2);

        this.log('Integrator.integrate MIDI of %d seconds timeFrame for %d beats on screen: timeFrame size %d, expected length %d ',
            this.midiFile.durationSeconds, this.beatsOnScreen, timeFrame, maxTime
        );

        for (
            let currentTime = 0; currentTime <= maxTime; currentTime += timeFrame
        ) {
            this.log('Current time = ', currentTime);
            const image = await this.imageMaker.getFrame(currentTime);
            this.encoder.addImage(image);
        }

        this.log('All time frames parsed: call Encoder.finalise');
        this.encoder.finalise();
        this.log('Called Encoder.finalise');

        return promiseResolvesWhenFileWritten;
    }

}