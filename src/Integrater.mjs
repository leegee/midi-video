const MidiFile = require('./MidiFile.mjs');
const Note = require("./Note.mjs").verbose();
const Encoder = require('./Encoder.mjs');
const ImageMaker = require('./ImageMaker.mjs');
const assertOptions = require('./assertOptions.mjs');

module.exports = class Integrater {
    options = {
        verbose: true,
        bpm: null,
        filepath: null,
        outputpath: 'output.mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        beatsOnScreen: 4,
        midiNoteRange: 88
    };
    totalImagesAdded = 0;
    beatsOnScreen = undefined;
    imageMaker = new ImageMaker();

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.log = this.options.verbose ? console.log : () => { };

        this.log('Create new  Integrater');

        assertOptions(this.options, {
            bpm: '"bpm" as a number representing the MIDI bpm',
            filepath: '"filepath" should be the path to the MIDI file to parse'
        });

        this.beatHeight = Math.floor(this.options.height / this.options.midiNoteRange);
        this.beatWidth = Math.floor(this.options.width / this.options.beatsOnScreen);
    }

    async init() {
        this.log('Integrater.new create MidiFIle');

        await Note.init();

        this.midiFile = new MidiFile(this.options);

        await this.midiFile.parse();

        this.beatsOnScreen = this.midiFile.timeSignature * 3;

        this.log('Integrater.new create Encoder');
        this.log('Time signature: ', this.midiFile.timeSignature);
        this.log('BPM: ', this.options.bpm);
        this.log('fps:', this.options.fps);

        this.encoder = new Encoder(this.options);

        this.log('Integrater.new done');
    }

    async integrate() {
        this.log('Enter Integrater.integrate');
        const promiseResolvesWhenFileWritten = this.encoder.init();

        console.log('='.repeat(50));
        console.log('Begin adding images at fps %d for %d seconds',
            this.options.fps, this.midiFile.durationSeconds
        );
        console.log('='.repeat(50));

        for (let currentTime = 0; currentTime <= this.midiFile.durationSeconds; currentTime += 1 / this.options.fps) {
            const notes = await Note.readRange(currentTime - (this.beatsOnScreen / 2), currentTime + (this.beatsOnScreen / 2));

            this.imageMaker.addNotes(notes);
            this.imageMaker.removeNotes(currentTime);

            const image = await this.imageMaker.renderAsBuffer(currentTime);
            this.encoder.addImage(image);

            console.log('T/N/I', currentTime, notes.length, image);
        }

        this.log('Call Encoder.finalise');
        this.encoder.finalise();
        this.log('Called Encoder.finalise');
        return promiseResolvesWhenFileWritten;
    }

    async createImages() {

    }
}

