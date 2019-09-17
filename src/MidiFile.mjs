const MidiParser = require('midi-parser-js/src/midi-parser');
const fs = require('fs');

module.exports = class MidiFile {
    static NOTE_ON = 9;
    static NOTE_OFF = 8;

    options = {
        verbose: false,
        bpm: null,
        filepath: null
    };
    music = null;
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

        const midi = MidiParser.parse(fs.readFileSync(options.filepath));
        const ppq = midi.timeDivision;
        const timeFactor = (60000 / (options.bpm * ppq) / 1000);

        this.log('MIDI.timeDivision: %d, timeFactor: %d, PPQ: %d, BPM: %d',
            midi.timeDivision, timeFactor, ppq, options.bpm
        );

        let noteDur = 0;

        this.log('Total tracks: ', midi.track.length);

        midi.track.forEach(midiTrack => {
            let totalMidiDurationInSeconds = 0;
            midiTrack.event
                .filter(v => {
                    if (v.type === MidiFile.NOTE_ON) {
                        noteDur = v.deltaTime;
                        if (v.velocity === 0) {
                            v.type = MidiFile.NOTE_OFF;
                        } else {
                            this.log('on', noteDur, v);
                            // this.music
                        }
                    }
                    if (v.type === MidiFile.NOTE_OFF) {
                        noteDur += v.deltaTime;
                        v.noteDur = noteDur;
                        this.log('off', noteDur, v);
                    }
                    return v.type === MidiFile.NOTE_OFF;
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
