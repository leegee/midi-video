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
        beatsOnScreen: 8,
        height: 1080
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
            beatsOnScreen: '"beatsOnScreen" a number representing the number of measure on the screen at once',
            filepath: '"filepath" should be the path to the MIDI file to parse'
        });
    }

    async init() {
        this.log('Integrater.new create MidiFIle');
        
        await Note.init();
        
        this.midiFile = new MidiFile({
            bpm: this.options.bpm,
            filepath: this.options.filepath,
            verbose: this.options.verbose
        });

        await this.midiFile.parse();

        this.secsPerImage = this.options.bpm / 60 / this.midiFile.timeSignature;
        this.beatsOnScreen = this.midiFile.timeSignature * 3;

        this.log('Integrater.new create Encoder');
        this.log('Time signature: ', this.midiFile.timeSignature);
        this.log('BPM: ', this.options.bpm);
        this.log('secsPerImage:', this.secsPerImage);

        this.encoder = new Encoder({
            secsPerImage: this.secsPerImage,
            ...this.options
        });

        this.log('Integrater.new done');
    }

    async integrate() {
        this.log('Enter Integrater.integrate');
        const promiseResolvesWhenFileWritten = this.encoder.init();

        await this.createImages();

        this.log('Call Encoder.finalise');
        this.encoder.finalise();
        this.log('Called Encoder.finalise');
        return promiseResolvesWhenFileWritten;
    }

    async createImages() {
        let lastTime = 0;
        let currentTime = 0;
        const noteHeight = Math.floor(this.options.height / 88);
        const noteWidth = Math.floor(this.options.width / this.options.beatsOnScreen);
        let addedImage = 0;

        console.log('='.repeat(50));
        console.log('Begin adding images');
        console.log('='.repeat(50));

        for (let t = 0; t <= this.midiFile.durationSeconds; t += this.encoder.encoded.fps ) {
            const notes = await Note.readRange(currentTime - (this.beatsOnScreen / 2), currentTime + (this.beatsOnScreen / 2));

            await this.imageMaker.create();

            const image = await this.imageMaker.getBuffer();
            this.encoder.addImage(image);

            console.log('T/N/I', currentTime, notes, image);

            lastTime = currentTime;
            currentTime += this.secsPerImage;
        }

    }
}

