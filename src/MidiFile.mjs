const MidiParser = require('midi-parser-js');
const fs = require('fs');
const Note = require('./Note.mjs');

module.exports = class MidiFile {
    static NOTE_ON = 9;
    static NOTE_OFF = 8;
    static META = 255;

    options = {
        verbose: true,
        bpm: null,
        filepath: null
    };
    tracks = [];
    totalMidiDurationInSeconds = null;
    timeSignature = null;

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.log = this.options.verbose ? console.log : () => { };

        if (!this.options.bpm) {
            throw new TypeError('Expected supplied option bpm');
        }
        if (!this.options.filepath) {
            throw new TypeError('Expected supplied option filepath');
        }
    }

    async parse() {
        await Note.init();

        const midi = MidiParser.parse(fs.readFileSync(this.options.filepath));

        this.timeFactor = 60000 / (this.options.bpm * midi.timeDivision) / 1000;

        this.log('MIDI.timeDivision: %d, timeFactor: %d, BPM: %d, total tracks: %d',
            midi.timeDivision, this.timeFactor, this.options.bpm, midi.tracks
        );

        for (let trackNumber = 0; trackNumber < midi.tracks; trackNumber++) {
            let currentTick = 0;
            let playingNotes = {};

            this.tracks.push({
                notes: [],
                name: null,
            });

            midi.track[trackNumber].event.forEach(event => {

                this.log('EVENT', event);

                currentTick += event.deltaTime;

                if (event.type === MidiFile.META) {
                    if (event.metaType === 3) {
                        this.tracks[this.tracks.length - 1].name = event.data;
                    } else if (event.metaType === 88) {
                        if (this.timeSignature !== null) {
                            throw new Error("Multiple timesignatures not yet supported");
                        }
                        this.timeSignature = event.data[0];
                    }
                }

                if (event.type === MidiFile.NOTE_ON) {
                    if (event.data[1] === 0) {
                        event.type = MidiFile.NOTE_OFF;
                    } else {
                        playingNotes[event.data[0]] = {
                            startTick: currentTick
                        }
                    }
                }

                if (event.type === MidiFile.NOTE_OFF) {
                    const note = new Note({
                        channel: event.channel,
                        pitch: event.data[0],
                        startTick: playingNotes[event.data[0]].startTick,
                        endTick: currentTick,
                        startSeconds: this.ticksToSeconds(playingNotes[event.data[0]].startTick),
                        endSeconds: this.ticksToSeconds(currentTick)
                    });
                    note.save();
                    this.tracks[trackNumber].notes.push(note);
                    delete playingNotes[event.data[0]];
                }
            });

            const trackDurationTicks = currentTick;
            const trackDurationSecs = this.ticksToSeconds(trackDurationTicks);
            this.totalMidiDurationInSeconds = trackDurationSecs > this.totalMidiDurationInSeconds ? trackDurationSecs : this.totalMidiDurationInSeconds;

            this.log('Track %d ticks: %d, seconds: %d: ',
                trackNumber, trackDurationTicks, trackDurationSecs
            );
        }
        this.log(this.tracks);
        this.log('Time Signature', this.timeSignature);
    }

    ticksToSeconds(delta) {
        return delta * this.timeFactor;
    }

}






// db.serialize(function() {


//   db.each("SELECT rowid AS id, info FROM lorem", function(err, row) {
//       console.log(row.id + ": " + row.info);
//   });

//  stmt.finalize();
// db.close();