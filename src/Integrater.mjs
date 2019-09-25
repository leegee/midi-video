const MidiFile = require('./MidiFile.mjs');
const Encoder = require('./Encoder.mjs');
const ImageMaker = require('./ImageMaker.mjs');
const assertOptions = require('./assertOptions.mjs');

module.exports = class Integrater {
    options = {
        logging: false,
        bpm: null,
        midiFilepath: null,
        outputpath: 'output.mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        trackColours: undefined,
        defaultColour: 'blue',
        fitNotesToScreen: false,
        beatsOnScreen: 12
    };
    totalImagesAdded = 0;
    beatsOnScreen = undefined;
    imageMaker = undefined;

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.log = this.options.logging ? console.log : () => {};

        this.log('Create new  Integrater');

        assertOptions(this.options, {
            bpm: 'a number representing the MIDI bpm',
            midiFilepath: 'path to the MIDI file to parse',
            beatsOnScreen: 'integer representing the number of whole measures to display at one time',
            fitNotesToScreen: 'scale the screen to fit the note-range used by the MIDI file'
        });

        this.beatsOnScreen = this.options.beatsOnScreen;
    }

    async init() {
        this.log('Integrater.init enter');

        this.midiFile = new MidiFile(this.options);

        const midiNoteRange = await this.midiFile.parse();

        this.log('Reset MIDI note range: ', midiNoteRange);
        this.log('Integrater.new create ImageMaker');

        this.imageMaker = new ImageMaker({
            trackColours: this.options.trackColours ? this.midiFile.mapTrackNames2Colours(this.options.trackColours) : undefined,
            defaultColour: this.options.defaultColour,
            width: this.options.width,
            height: this.options.height,
            midiNoteRange: midiNoteRange,
            secondWidth: Math.floor(this.options.width / this.beatsOnScreen),
            beatsOnScreen: this.beatsOnScreen
        });

        await this.imageMaker.init();

        this.log('noteHeight: ', this.imageMaker.options.noteHeight);

        this.log('Integrater.new create Encoder');
        this.log('BPM: ', this.options.bpm);
        this.log('FPS:', this.options.fps);

        this.encoder = new Encoder(this.options);

        this.log('Integrater.init done');
    }

    async integrate() {
        this.log('Integrater.integrate enter');
        const promiseResolvesWhenFileWritten = this.encoder.init();

        const timeFrame = 1 / this.options.fps;
        const maxTime = this.midiFile.durationSeconds + (this.beatsOnScreen * 2);

        this.log('Integrater.integrate MIDI of %d seconds timeFrame for %d beats on screen: timeFrame size %d, expected length %d ',
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