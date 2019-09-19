const MidiFile = require('./MidiFile.mjs');
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
        beatsOnScreen: 8,
        height: 1080
    };
    totalImagesAdded = 0;

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.log = this.options.verbose ? console.log : () => { };

        this.log('Create new  Integrater');

        assertOptions(this.options, {
            bpm: '"bpm" as a number representing the MIDI bpm',
            beatsOnScreen: '"beatsOnScreen" a number representing the number of measure on the screen at once',
            filepath: '"filepath" should be the path to the MIDI file to parse'
        });

        this.log('Integrater.new create MidiFIle');
        this.midiFile = new MidiFile({
            bpm: this.options.bpm,
            filepath: this.options.filepath,
            verbose: this.options.verbose
        });

        this.log('Integrater.new create Encoder');
        this.log('Time signature: ', this.midiFile.timeSignature);
        this.log('BPM: ', this.options.bpm);

        this.secsPerImage = this.options.bpm / 60 / this.midiFile.timeSignature;

        this.log('Integrater.new Set secsPerImage:', this.secsPerImage);

        this.encoder = new Encoder({
            secsPerImage: this.secsPerImage,
            ...this.options
        });

        this.log('Integrater.new done');
    }

    integrate() {
        this.log('Enter Integrater.integrate');
        const promiseResolvesWhenFileWritten = this.encoder.init();

        this.createImages();

        this.log('Call Encoder.finalise');
        this.encoder.finalise();
        this.log('Called Encoder.finalise');
        return promiseResolvesWhenFileWritten;
    }

    createImages() {
        let currentTime = 0;
        const noteHeight = Math.floor(this.options.height / 88);
        const noteWidth = Math.floor(this.options.width / this.options.beatsOnScreen);

        let addedImage = 0;
        for (let i = 0; i < 5; i++) {
            const image = new ImageMaker();
            this.encoder.addImage(image);
            addedImage++;
            currentTime += this.encoder.encoded.fps;
        }

        // console.log( this.midiFile );

    }
}

