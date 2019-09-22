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
        midiNoteRange: 127,
        trackColours: undefined,
        defaultColour: 'blue',
        fitNotes: false
    };
    totalImagesAdded = 0;
    beatsOnScreen = undefined;
    imageMaker = undefined;

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.log = this.options.verbose ? console.log : () => { };

        this.log('Create new  Integrater');

        assertOptions(this.options, {
            bpm: 'a number representing the MIDI bpm',
            midiFilepath: 'path to the MIDI file to parse',
            fitNotes: 'scale the screen to fit the note-range used by the MIDI file'
        });
    }

    async init() {
        this.log('Integrater.new create MidiFIle');

        await Note.init();

        this.midiFile = new MidiFile(this.options);

        await this.midiFile.parse();

        if (this.options.fitNotes) {
            this.options.midiNoteRange = this.midiFile.fitNotes();
        }
        this.log('note range: ', this.options.midiNoteRange);

        this.beatsOnScreen = this.midiFile.timeSignature * 3;

        this.log('Integrater.new create ImageMaker');

        this.imageMaker = new ImageMaker({
            trackColours: this.midiFile.mapTrackNames2Colours(this.options.trackColours),
            defaultColour: this.options.defaultColour,
            width: this.options.width,
            height: this.options.height,
            noteHeight: Math.floor(this.options.height / this.options.midiNoteRange),
            secondWidth: Math.floor(this.options.width / this.beatsOnScreen)
        });

        this.log('noteHeight: ', this.imageMaker.options.noteHeight);

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
            const notes = await Note.readRange(currentTime - (this.beatsOnScreen / 2), currentTime + (this.beatsOnScreen / 2));

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

