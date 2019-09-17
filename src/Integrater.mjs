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
        this.log = options.verbose ? console.log : () => { };

        this.assertOptions();


        this.midiFile = new MidiFile({
            bpm: this.options.bpm,
            filepath: this.options.filepath,
            verbose: this.options.verbose
        })
        this.encoder = new Encoder({
            outputpath: this.options.outputpath
        });
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

    async integrate() {
        const promiseResolvesWhenFileWritten = encoder.init();

        this.encoder.finalise();
        return promiseResolvesWhenFileWritten;
    }
}
