const fs = require('fs');
const MidiParser = require('midi-parser-js');
const Decimal = require('decimal.js');

const Note = require('./Note.mjs');
const assertOptions = require('./assertOptions.mjs');

module.exports = class MidiFile {
    static logging = false;
    static NOTE_ON = 9;
    static NOTE_OFF = 8;
    static META = 255;
    static MS_PER_BEAT = 81;
    static SIXTY_MILLION = new Decimal(60000000);
    static SIXTY = new Decimal(60);
    static INIT_RANGES = {
        pitch: {
            hi: 0,
            lo: 127
        },
        velocity: {
            hi: 0,
            lo: 127
        }
    };

    options = {
        logging: false,
        midipath: null,
        quantizePitchBucketSize: false, // Or int
    };
    tracks = [];
    durationSeconds = null;
    ranges = MidiFile.INIT_RANGES;

    constructor(options = {}) {
        if (typeof options === 'string') {
            options = {
                midipath: options
            };
        }
        this.options = Object.assign({}, this.options, options);
        this.setLogging();

        assertOptions(this.options, {
            midipath: 'string for input path',
            quantizePitchBucketSize: 'integer bucket size for quantizing pitch',
        });

        this.log('Logging...');
        this.debug('Debugging...');
    }

    verbose() {
        this.options.debug = this.options.log = true;
        this.setLogging();
    }

    setLogging() {
        this.debug = this.options.debug ? console.debug : MidiFile.logging ? console.debug : () => { };
        this.log = this.options.logging || MidiFile.logging || this.options.debug ? console.log : () => { };
        this.info = console.info;
    }

    ticksToSeconds(delta) {
        return delta * this.timeFactor;
    }

    async parse() {
        this.info('MidiFile.parse Beginning');
        await Note.init();
        this.ranges = MidiFile.INIT_RANGES;
        let longestTrackDurationSeconds = 0;

        const midi = MidiParser.parse(fs.readFileSync(this.options.midipath));
        const midiTimeDivision = new Decimal(midi.timeDivision);

        this.debug('MIDI.timeDivision: %d', midiTimeDivision);

        for (let trackNumber = 0; trackNumber < midi.tracks; trackNumber++) {
            let durationSeconds = 0;
            let currentTick = 0;
            let playingNotes = {};
            let totalNotesOn = 0;
            let totalNotesOff = 0;

            this.tracks.push({
                notes: [],
                name: 'Track ' + trackNumber,
                number: trackNumber
            });

            midi.track[trackNumber].event.forEach(event => {
                // this.debug(trackNumber, 'EVENT', event);
                currentTick += event.deltaTime;

                if (event.type === MidiFile.META) {
                    if (event.metaType === MidiFile.MS_PER_BEAT) {
                        const eventData = new Decimal(event.data)
                        this.bpm = MidiFile.SIXTY_MILLION.dividedBy(eventData);
                        this.timeFactor = MidiFile.SIXTY.dividedBy(this.bpm.times(midiTimeDivision));
                        this.log('TEMPO CHANGE %d BPM %d timeFactor', event.data, this.bpm, this.timeFactor);
                    } else if (event.metaType === 3) {
                        this.tracks[this.tracks.length - 1].name = event.data;
                        this.debug('Parsing track number %d named %s', trackNumber, event.data);
                    }
                }

                else {
                    if (event.type === MidiFile.NOTE_ON) {
                        if (event.data[1] === 0) { // No velocity === silence note
                            event.type = MidiFile.NOTE_OFF;
                            this.debug('ZERO VELOCITY NOTE ON === NOTE OFF');
                        } else {
                            totalNotesOn++;
                            playingNotes[event.data[0]] = {
                                startTick: currentTick,
                                velocity: event.data[1]
                            };
                            if (event.data[0] > this.ranges.pitch.hi) {
                                this.ranges.pitch.hi = event.data[0];
                            } else if (event.data[0] < this.ranges.pitch.lo) {
                                this.ranges.pitch.lo = event.data[0];
                            }
                            if (event.data[1] > this.ranges.velocity.hi) {
                                this.ranges.velocity.hi = event.data[1];
                            } else if (event.data[1] < this.ranges.velocity.lo) {
                                this.ranges.velocity.lo = event.data[1];
                            }
                        }
                    }

                    if (event.type === MidiFile.NOTE_OFF) {
                        totalNotesOff++;
                        let note;
                        try {
                            note = new Note({
                                channel: event.channel,
                                track: trackNumber,
                                pitch: event.data[0],
                                velocity: playingNotes[event.data[0]].velocity,
                                startTick: playingNotes[event.data[0]].startTick,
                                endTick: currentTick,
                                startSeconds: this.ticksToSeconds(playingNotes[event.data[0]].startTick),
                                endSeconds: this.ticksToSeconds(currentTick)
                            });
                            this.tracks[trackNumber].notes.push(note);
                            delete playingNotes[event.data[0]];
                        }
                        catch (e) {
                            console.error('Error. playingNotes: ', playingNotes);
                            console.error('info', {
                                endTick: currentTick,
                                endSeconds: this.ticksToSeconds(currentTick),
                                channel: event.channel,
                                track: trackNumber,
                                pitch: event.data[0]
                            });
                        }
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
            this.log('Total notes on: ', totalNotesOn);
            this.log('Total notes off: ', totalNotesOff);
        }

        this.tracks = this.tracks.filter(track => track.notes.length > 0);
        this.durationSeconds = longestTrackDurationSeconds;

        this.info('MidiFile.parse populated %d tracks, leaving.', this.tracks.length);
        this.info('MidiFile.parse found ranges: ', this.ranges);

        this.tracks.forEach(track => {
            track.notes.forEach(note => {
                if (this.options.fitNotesToScreen) {
                    note.pitch = note.pitch - this.ranges.pitch.lo;
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
            this.options.midiNoteRange = this.ranges.pitch.hi - this.ranges.pitch.lo;
            this.log('MidiFile.fitNotesToScreen: new MIDI new range: %d (ie %d - %d)',
                this.options.midiNoteRange, this.ranges.pitch.hi, this.ranges.pitch.lo
            );
        }

        return this.options.midiNoteRange;
    }

    mapTrackNames2Hues(trackHues, defaultHue) {
        const mapped = [];

        this.tracks.forEach(track => {
            if (trackHues[track.name]) {
                mapped.push(trackHues[track.name]);
                this.log('Made trackHues for track %d, named "%s": ', track.number, track.name, trackHues[track.name])
            } else {
                console.warn('Missing trackHues for track %d, named "%s"!', track.number, track.name)
                mapped.push(defaultHue);
            }
        });

        return mapped;
    }

    quantizePitch(pitch) {
        let bucketNumber = Math.ceil(pitch / this.options.quantizePitchBucketSize);
        // let rv = pitch % this.options.quantizePitchBucketSize;
        // if (rv == 0) {
        //     rv = this.options.quantizePitchBucketSize;
        // }
        return bucketNumber;
    }
}