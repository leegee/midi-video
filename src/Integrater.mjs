const MidiFile = require('./MidiFile.mjs');
const Encoder = require('./Encoder.mjs');
const Image = require('./Image.mjs');

const REQ_ARGS = {
    bpm: '"bpm" as a number representing the MIDI bpm',
    filepath: '"filepath" should be the path to the MIDI file to parse'
};

module.exports = class Integrater {
    options = {
        verbose: true,
        bpm: null,
        filepath: null,
        outputpath: 'output.mp4',
        width: 1920,
        height: 1080,
        secsPerImage: Math.floor(1 / 30)
    };
    totalImagesAdded = 0;

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.log = this.options.verbose ? console.log : () => { };
        
        this.log('Create new  Integrater');

        this.assertOptions();

        this.log('Integrater.new create MidiFIle');
        this.midiFile = new MidiFile({
            bpm: this.options.bpm,
            filepath: this.options.filepath,
            verbose: this.options.verbose
        })
        this.log('Integrater.new create Encoder');
        this.encoder = new Encoder({
            outputpath: this.options.outputpath
        });
        this.log('Integrater.new done');
    }

    assertOptions() {
        let errMsgs = [];
        Object.keys(REQ_ARGS).forEach(key => {
            if (!this.options[key]) {
                errMsgs.push(REQ_ARGS[key]);
            }
        });
        if (errMsgs.length) {
            throw new TypeError('Missing argument' + (errMsgs.length > 1 ? 's' : '') + ':\n' + errMsgs.join('\n\t'));
        }
    }

    integrate() {
        this.log('Enter Integrater.integrate');
        const promiseResolvesWhenFileWritten = this.encoder.init();
        this.log('Call Encoder.finalise');
        this.encoder.finalise();
        this.log('Called Encoder.finalise');
        return promiseResolvesWhenFileWritten;
    }
}
