const MidiFile = require('./MidiFile.mjs');
const Encoder = require('./Encoder.mjs');
const Image = require('./Image.mjs');

const REQ_ARGS = {
    bpm: '"bpm" as a number representing the MIDI bpm',
    filepath: '"filepath" should be the path to the MIDI file to parse'
};

module.exports = class Integrater {
    options = {
        verbose: false,
        bpm: null,
        filepath: null,
        outputpath: 'output.mp4'
    };
    totalImagesAdded = 0;

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.log = options.verbose ? console.log : () => { };

        this.assertOptions();
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
        const midiFile = new MidiFile({
            bpm: this.options.bpm,
            filepath: this.options.filepath
        })
        const encoder = new Encoder({
            outputpath: this.options.outputpath
        });
        const finished = encoder.init();

        midiFile.midi.track.forEach(midiTrack => {
            let totalMidiDurationInSeconds = 0;
            midiTrack.event
                .filter(v => {
                    console.log(v);
                    if (v.type === midiFile.NOTE_ON) {
                        noteDur = v.deltaTime;
                        // this.log('on', noteDur, v);
                        if (v.velocity === 0) {
                            v.type = midiFile.NOTE_OFF;
                        }
                    }
                    if (v.type === midiFile.NOTE_OFF) {
                        noteDur += v.deltaTime;
                        v.noteDur = noteDur;
                        // this.log('off', noteDur, v);
                    }
                    return v.type === midiFile.NOTE_OFF;
                })
                .map(v => {
                    const t = v.noteDur * timeFactor;
                    totalMidiDurationInSeconds += t;
                    // this.log(v.noteDur, ':', t);
                    return t;
                });

            this.totalMidiDurationInSeconds = totalMidiDurationInSeconds > this.totalMidiDurationInSeconds ? totalMidiDurationInSeconds : this.totalMidiDurationInSeconds;
        });

        //     encoder.addImage(new Image().getBuffer());

        encoder.finalise();
        finished.then(() => {
            this.log('Done ', this.options.outputpath);
        });
    }
}
