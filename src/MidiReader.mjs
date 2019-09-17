const MidiPlayer = require('midi-player-js');

module.exports = class {
    options = {};

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.log = options.verbose ? console.log : () => { };

        this.player = new MidiPlayer.Player();
        this.player.loadFile(options.filepath);

        this.player.on('fileLoaded', () => {
        });

        this.player.on('playing', (currentTick) => {
        });

        this.player.on('midiEvent', (event) => {
        });

        this.player.on('endOfFile', () => {
        });

        this.player.play();
    }

    process() {
        const midi = MidiParser.parse(fs.readFileSync(options.midi)); // , 'base64'
        const ppq = midi.timeDivision;
        const timeFactor = (60000 / (options.bpm * ppq) / 1000);

        this.log('BPM:%d, PPQ: %d', options.bpm, ppq);
        this.log('MIDI.timeDivision:', midi.timeDivision);
        this.log('timeFactor:', timeFactor);

        let noteDur = 0;
        let totalMidiDurationInSeconds = 0; // public for tests only

        // Just the track 1 note on events for any channel
        this.chunkSeconds = midi.track[0].event
            .filter(v => {
                if (v.type === NOTE_ON) {
                    noteDur = v.deltaTime;
                    this.log('on', noteDur, v);
                }
                else if (v.type === NOTE_OFF) {
                    noteDur += v.deltaTime;
                    v.noteDur = noteDur;
                    this.log('off', noteDur, v);
                }
                return v.type === NOTE_OFF;
            })
            .map(v => {
                const t = v.noteDur * timeFactor;
                totalMidiDurationInSeconds += t;
                this.log(v.noteDur, ':', t);
                return t;
            });

        return totalMidiDurationInSeconds;
    }
}
