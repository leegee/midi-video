const MidiParser = require('midi-parser-js');
const fs = require('fs');
const Note = require('./Note.mjs');

module.exports = class MidiFile {
    static logging = false;
    static NOTE_ON = 9;
    static NOTE_OFF = 8;
    static META = 255;

    options = {
        logging: false,
        bpm: null,
        midiFilepath: null
    };
    tracks = [];
    durationSeconds = null;
    lowestPitch = 127;
    highestPitch = 0;
    bpm = undefined;

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.debug = this.options.debug ? console.debug : MidiFile.logging ? console.debug : () => { };
        this.log = this.options.logging || MidiFile.logging || this.options.debug ? console.log : () => { };

        if (!this.options.bpm) {
            throw new TypeError('Expected supplied option bpm');
        }
        if (!this.options.midiFilepath) {
            throw new TypeError('Expected supplied option midiFilepath');
        }

        this.bpm = this.options.bpm;
        this.log('logging logging...');
        this.debug('Debugging...');
    }

    ticksToSeconds(delta) {
        return delta * this.timeFactor;
    }

    setTimeFactor(timeDivision) {
        this.debug('Set timeFactor with timeDivision', timeDivision);
        this.timeFactor = 60000 / (this.bpm * timeDivision); // / 1000;
        return this.timeFactor;
    }

    async parse() {
        await Note.init();
        let longestTrackDurationSeconds = 0;

        const midi = MidiParser.parse(fs.readFileSync(this.options.midiFilepath));

        this.setTimeFactor(midi.timeDivision * 1000);

        this.log('MIDI.timeDivision: %d, timeFactor: %d, BPM: %d',
            midi.timeDivision, this.timeFactor, this.bpm
        );

        for (let trackNumber = 0; trackNumber < midi.tracks; trackNumber++) {
            let durationSeconds = 0;
            let currentTick = 0;
            let playingNotes = {};

            this.tracks.push({
                notes: [],
                name: null,
            });

            midi.track[trackNumber].event.forEach(event => {

                this.debug('EVENT', event);

                currentTick += event.deltaTime;

                if (event.type === MidiFile.META) {
                    if (event.metaType === 81) {
                        durationSeconds += this.ticksToSeconds(currentTick);
                        this.debug('Tempo change @ ', event.deltaTime, 'to', event.data);
                        this.setTimeFactor(event.data);
                    }

                    else if (event.metaType === 3) {
                        this.tracks[this.tracks.length - 1].name = event.data;
                        this.debug('Parsing track number %d named %s', trackNumber, event.data);
                    }
                }

                else {
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
                        note.save();
                        this.tracks[trackNumber].notes.push(note);
                        delete playingNotes[event.data[0]];
                    }
                }
            });

            durationSeconds += this.ticksToSeconds(currentTick);

            if (durationSeconds > longestTrackDurationSeconds) {
                longestTrackDurationSeconds = durationSeconds;
            }

            this.log('Track %d completed with %d notes, %d ticks = %d seconds',
                midi.track[trackNumber].event.length, trackNumber, currentTick, durationSeconds);
            this.log('Time factor %d, bpm %d', this.timeFactor, this.bpm);
        }

        this.tracks = this.tracks.filter(track => track.notes.length > 0);
        this.durationSeconds = longestTrackDurationSeconds;

        this.log('MidiFile.parse created %d tracks, leaving.', this.tracks.length);
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

    fitNotesToScreen() {
        this.tracks.forEach(track => {
            track.notes.forEach(note => {
                note.pitch -= this.lowestPitch + 1;
            })
        })
        return this.highestPitch - this.lowestPitch;
    }
}

