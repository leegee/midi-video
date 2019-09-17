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
                    if (v.type === MidiFile.NOTE_ON) {
                        noteDur = v.deltaTime;
                        // this.log('on', noteDur, v);
                        if (v.velocity === 0) {
                            v.type = MidiFile.NOTE_OFF;
                        }
                    }
                    if (v.type === MidiFile.NOTE_OFF) {
                        noteDur += v.deltaTime;
                        v.noteDur = noteDur;
                        // this.log('off', noteDur, v);
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
