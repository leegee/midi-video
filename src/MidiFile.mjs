const MidiParser = require('midi-parser-js');
const fs = require('fs');
const Note = require('./Note.mjs');

module.exports = class MidiFile {
    static NOTE_ON = 9;
    static NOTE_OFF = 8;
    static META = 255;

    options = {
        verbose: false,
        bpm: null,
        midiFilepath: null
    };
    tracks = [];
    durationSeconds = null;
    timeSignature = undefined;
    lowestPitch = 127;
    highestPitch = 0;
    bpm = undefined;

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.log = this.options.verbose ? console.log : () => { };
        this.debug = this.options.debug ? console.debug : () => { };

        if (!this.options.bpm) {
            throw new TypeError('Expected supplied option bpm');
        }
        if (!this.options.midiFilepath) {
            throw new TypeError('Expected supplied option midiFilepath');
        }

        this.bpm = this.options.bpm;
    }

    ticksToSeconds(delta) {
        return delta * this.timeFactor;
    }

    setTimeFactor(timeDivision) {
        this.timeFactor = 60000 / (this.bpm * timeDivision) / 1000;
    }

    async parse() {
        await Note.init();

        const midi = MidiParser.parse(fs.readFileSync(this.options.midiFilepath));

        this.setTimeFactor(midi.timeDivision);

        this.log('MIDI.timeDivision: %d, timeFactor: %d, BPM: %d',
            midi.timeDivision, this.timeFactor, this.bpm
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
                        this.debug('Parsing track number %d named %s', trackNumber, event.data);
                    } else if (event.metaType === 88) {
                        if (this.timeSignature !== undefined) {
                            console.warn("Multiple timesignatures not yet supported");
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
                        };
                        if (event.data[0] > this.highestPitch) {
                            this.highestPitch = event.data[0];
                        } else if (event.data[0] < this.lowestPitch) {
                            this.lowestPitch = event.data[0];
                        }
                    }
                }

                if (event.type === MidiFile.NOTE_OFF) {
                    const note = new Note({
                        channel: event.channel,
                        track: trackNumber,
                        pitch: event.data[0],
                        velocity: event.data[1],
                        startTick: playingNotes[event.data[0]].startTick,
                        endTick: currentTick,
                        startSeconds: this.ticksToSeconds(playingNotes[event.data[0]].startTick),
                        endSeconds: this.ticksToSeconds(currentTick)
                    });
                    // this.log(note);
                    note.save();
                    this.tracks[trackNumber].notes.push(note);
                    delete playingNotes[event.data[0]];
                }
            });

            const trackDurationTicks = currentTick;
            const trackDurationSecs = this.ticksToSeconds(trackDurationTicks);
            this.durationSeconds = trackDurationSecs > this.durationSeconds ? trackDurationSecs : this.durationSeconds;

            this.log('Track %d ticks: %d, seconds: %d: ', trackNumber, trackDurationTicks, trackDurationSecs);
        }

        this.tracks = this.tracks.filter(track => track.notes.length > 0);

        // this.debug(this.tracks);

        if (this.timeSignature === undefined) {
            throw new Error('Failed to parse time signature from MIDI file');
        } else {
            this.log('Time Signature', this.timeSignature);
        }

        this.log('MidiFile.parse - leave');
    }

    mapTrackNames2Colours(trackColours) {
        const mapped = [];

        this.tracks.forEach(track => {
            if (trackColours[track.name]) {
                mapped.push(
                    trackColours[track.name]
                )
            }
        });

        return mapped;
    }

    fitNotes() {
        this.tracks.forEach(track => {
            track.notes.forEach(note => {
                note.pitch -= this.lowestPitch + 1;
            })
        })
        return this.highestPitch - this.lowestPitch;
    }
}

