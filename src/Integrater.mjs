const MidiFile = require('./MidiFile.mjs');
const Note = require("./Note.mjs").verbose();
const Encoder = require('./Encoder.mjs');
const ImageMaker = require('./ImageMaker.mjs');
const assertOptions = require('./assertOptions.mjs');

module.exports = class Integrater {
    options = {
        verbose: true,
        bpm: null,
        midiFilepath: null,
        outputpath: 'output.mp4',
        width: 1920,
        height: 1080,
        fps: 30,
        midiNoteRange: 127
    };
    totalImagesAdded = 0;
    beatsOnScreen = undefined;
    imageMaker = undefined;

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.log = this.options.verbose ? console.log : () => { };

        this.log('Create new  Integrater');

        assertOptions(this.options, {
            bpm: '"bpm" as a number representing the MIDI bpm',
            midiFilepath: '"midiFilepath" should be the path to the MIDI file to parse'
        });
    }

    async init() {
        this.log('Integrater.new create MidiFIle');

        await Note.init();

        this.midiFile = new MidiFile(this.options);

        await this.midiFile.parse();

        this.beatsOnScreen = this.midiFile.timeSignature * 3;

        this.imageMaker = new ImageMaker({
            noteHeight: Math.floor(this.options.height / this.options.midiNoteRange),
            secondWidth: Math.floor(this.options.width / this.beatsOnScreen)
        });

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

        const timeFrame = 1 / this.options.fps;
        for (
            let currentTime = 0; 
            currentTime <= this.midiFile.durationSeconds + (this.beatsOnScreen * 2); 
            currentTime += timeFrame
        ) {
            // const notes = await Note.readRange(currentTime - timeFrame, currentTime + timeFrame);
            const notes = await Note.readRange(currentTime - (this.beatsOnScreen / 2), currentTime + (this.beatsOnScreen / 2));
            // const notes = await Note.readRange(currentTime - this.beatsOnScreen, currentTime + this.beatsOnScreen );

            this.imageMaker.addNotes(notes);
            this.imageMaker.removeNotes(currentTime - (this.beatsOnScreen / 2));

            const image = await this.imageMaker.renderAsBuffer(currentTime);
            this.encoder.addImage(image);
        }

        this.log('Call Encoder.finalise');
        this.encoder.finalise();
        this.log('Called Encoder.finalise');
        return promiseResolvesWhenFileWritten;
    }

}

