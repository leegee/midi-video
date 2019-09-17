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
    channels = null;
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
            let noteDur;
            let currentTime = 0;

            let totalMidiDurationInSeconds = 0;
            midiTrack.event
                .filter(event => {
                    let useThisEvent = false;
                    if (event.type === MidiFile.NOTE_ON) {
                        useThisEvent = true;
                        if (event.velocity === 0) {
                            event.type = MidiFile.NOTE_OFF;
                        } else {
                            noteDur = v.deltaTime;
                            this.log('on', noteDur, event);
                        }
                    }
                    if (event.type === MidiFile.NOTE_OFF) {
                        v.noteDur = noteDur + v.deltaTime;
                        useThisEvent = true;
                        this.log('off', noteDur, event);
                    }

                    if (useThisEvent) {
                        currentTime += event.deltaTime;
                        const t = v.noteDur * timeFactor;
                        totalMidiDurationInSeconds += t;
                        this.log('At ', t, ' duration ', v.noteDur);

                        // this.channels[event.channel] ...
                    }
                });

            this.log('This track totalMidiDurationInSeconds = ', totalMidiDurationInSeconds);
            this.totalMidiDurationInSeconds = totalMidiDurationInSeconds > this.totalMidiDurationInSeconds ? totalMidiDurationInSeconds : this.totalMidiDurationInSeconds;
        });
    }
}
