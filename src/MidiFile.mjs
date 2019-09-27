const MidiParser = require('midi-parser-js');
const fs = require('fs');
const Note = require('./Note.mjs');

module.exports = class MidiFile {
    static logging = false;
    static NOTE_ON = 9;
    static NOTE_OFF = 8;
    static META = 255;
    static MS_PER_BEAT = 81;

    options = {
        logging: false,
        midiFilepath: null,
        quantizePitchBucketSize: false, // Or int
    };
    tracks = [];
    durationSeconds = null;
    lowestPitch = 127;
    highestPitch = 0;

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.debug = this.options.debug ? console.debug : MidiFile.logging ? console.debug : () => { };
        this.log = this.options.logging || MidiFile.logging || this.options.debug ? console.log : () => { };
        this.info = console.info;

        if (!this.options.midiFilepath) {
            throw new TypeError('Expected supplied option midiFilepath');
        }

        this.log('Logging...');
        this.debug('Debugging...');
    }

    ticksToSeconds(delta) {
        return delta * this.timeFactor;
    }

    async parse() {
        await Note.init();
        let longestTrackDurationSeconds = 0;

        const midi = MidiParser.parse(fs.readFileSync(this.options.midiFilepath));

        this.info('MIDI.timeDivision: %d, timeFactor: %d',
            midi.timeDivision, this.timeFactor
        );

        for (let trackNumber = 0; trackNumber < midi.tracks; trackNumber++) {
            let durationSeconds = 0;
            let currentTick = 0;
            let playingNotes = {};

            this.tracks.push({
                notes: [],
                name: 'Track ' + trackNumber,
                number: trackNumber
            });

            midi.track[trackNumber].event.forEach(event => {

                this.debug(trackNumber, 'EVENT', event);

                currentTick += event.deltaTime;

                if (event.type === MidiFile.META) {
                    if (event.metaType === MidiFile.MS_PER_BEAT) {
                        this.bpm = 60000000 / event.data;
                        this.timeFactor = 60 / (this.bpm * midi.timeDivision);
                        this.log('TEMPO CHANGE %d BPM %d timeFactor', event.data, this.bpm, this.timeFactor);
                    } else if (event.metaType === 3) {
                        this.tracks[this.tracks.length - 1].name = event.data;
                        this.debug('Parsing track number %d named %s', trackNumber, event.data);
                    }
                } else {
                    if (event.type === MidiFile.NOTE_ON) {
                        if (event.data[1] === 0) { // No velocity === silence note
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
                        // note.save();
                        this.tracks[trackNumber].notes.push(note);
                        delete playingNotes[event.data[0]];
                    }
                }
            });

            durationSeconds += this.ticksToSeconds(currentTick);

            if (durationSeconds > longestTrackDurationSeconds) {
                longestTrackDurationSeconds = durationSeconds;
            }

            this.log('Track %d %s completed with %d notes, %d ticks = %d seconds',
                trackNumber, this.tracks[trackNumber].name, this.tracks[trackNumber].notes.length,
                currentTick, durationSeconds
            );
            this.log('Time factor %d, bpm %d', this.timeFactor, this.bpm);
        }

        this.tracks = this.tracks.filter(track => track.notes.length > 0);
        this.durationSeconds = longestTrackDurationSeconds;

        this.info('MidiFile.parse populated %d tracks, leaving.', this.tracks.length);

        this.tracks.forEach(track => {
            track.notes.forEach(note => {
                if (this.options.fitNotesToScreen) {
                    note.pitch = note.pitch - this.lowestPitch;
                }
                // Make pitch index 1-based to ease drawing:
                note.pitch++;

                if (this.options.quantizePitchBucketSize) {
                    note.pitch = this.quantizePitch(note.pitch);
                }

                note.save();
            });
        });

        if (this.options.fitNotesToScreen) {
            this.options.midiNoteRange = this.highestPitch - this.lowestPitch;
            this.log('MidiFile.fitNotesToScreen: new MIDI new range: %d (ie %d - %d)',
                this.options.midiNoteRange, this.highestPitch, this.lowestPitch
            );
        }

        return this.options.midiNoteRange;
    }

    mapTrackNames2Hues(trackColours) {
        const mapped = [];

        this.tracks.forEach(track => {
            if (trackColours[track.name]) {
                mapped.push(
                    trackColours[track.name]
                );
                this.log('Made trackColours for track %d, named "%s": ', track.number, track.name, trackColours[track.name])
            } else {
                console.warn('Missing trackColours for track %d, named "%s"!', track.number, track.name)
            }
        });

        return mapped;
    }

    quantizePitch(note){
        let bucketNumber = Math.ceil(pitch / this.options.quantizePitchBucketSize);
        // let rv = pitch % this.options.quantizePitchBucketSize;
        // if (rv == 0) {
        //     rv = this.options.quantizePitchBucketSize;
        // }
        return bucketNumber;
    }
}