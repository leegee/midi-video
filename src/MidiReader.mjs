const MidiParser = require('midi-parser-js/src/midi-parser');
const fs = require('fs');

const NOTE_ON = 9;
const NOTE_OFF = 8;

module.exports = class {
    options = {
        verbose: false
    };
    midi = null;
    totalMidiDurationInSeconds = 0;

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.log = options.verbose ? console.log : () => { };

        if (!options.bpm) {
            throw new TypeError('Expected supplied option bpm');
        }
        if (!options.filepath) {
            throw new TypeError('Expected supplied option filepath');
        }

        this.midi = MidiParser.parse(fs.readFileSync(options.filepath));
        const ppq = this.midi.timeDivision;
        const timeFactor = (60000 / (options.bpm * ppq) / 1000);

        this.log('MIDI.timeDivision: %d, timeFactor: %d, PPQ: %d, BPM: %d',
            this.midi.timeDivision, timeFactor, options.bpm, ppq
        );

        let noteDur = 0;

        this.log('Total tracks: ', this.midi.track.length);

        this.midi.track.forEach(midiTrack => {
            let totalMidiDurationInSeconds = 0;
            midiTrack.event
                .filter(v => {
                    if (v.type === NOTE_ON) {
                        noteDur = v.deltaTime;
                        // this.log('on', noteDur, v);
                        if (v.velocity === 0) {
                            v.type = NOTE_OFF;
                        }
                    }
                    if (v.type === NOTE_OFF) {
                        noteDur += v.deltaTime;
                        v.noteDur = noteDur;
                        // this.log('off', noteDur, v);
                    }
                    return v.type === NOTE_OFF;
                })
                .map(v => {
                    const t = v.noteDur * timeFactor;
                    totalMidiDurationInSeconds += t;
                    // this.log(v.noteDur, ':', t);
                    return t;
                });

            this.totalMidiDurationInSeconds = totalMidiDurationInSeconds > this.totalMidiDurationInSeconds ? totalMidiDurationInSeconds : this.totalMidiDurationInSeconds;
        });
    }
}
