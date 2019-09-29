const Canvas = require('canvas')

const Note = require("./Note.mjs"); // .logging();
const assertOptions = require('./assertOptions.mjs');

module.exports = class ImageMaker {
    static Blank = null;
    static BlankImageBuffer = null;

    options = {
        logging: false,
        secondWidth: undefined,
        width: undefined, // 1920,
        height: undefined, // 1080,
        midiNoteRange: 127,
        trackHues: undefined,
        bg: 'black',
        globalCompositeOperation: 'screen',
        globalAlpha: 1,
        defaultHue: 240,
        beatsOnScreen: undefined,
        highlightCurrent: {
            alpha: 0.9,
            strokeStyle: 'white',
            shadowColor: 'white',
            shadowBlur: 6,
            lineWidth: 2 // TODO check for conflicts with note height
        },
        colour: {
            minSaturationPc: 77,
            minLuminosityPc: 20,
            maxLuminosityPc: 100
        }
    };

    endSeconds2notesPlaying = {};
    uniqueNotesPlaying = {};

    static createColourList(length) {
        return new Array(length).fill('x').map(
            (value, index) => Math.floor((360 / length + 1) * index)
        );
    }

    constructor(options) {
        this.options = Object.assign({}, this.options, options);

        this.log = this.options.logging ? console.log : () => { };
        this.debug = this.options.debug ? console.debug : () => { };

        assertOptions(this.options, {
            secondWidth: 'integer, being the number of pixels representing a second of time',
            width: 'integer, being the video display  width',
            height: 'integer, being the video display  height',
            defaultHue: 'a CSS HSL hue number (0-360) for the notes',
            bg: 'a CSS colour value for the background',
            highlightCurrent: 'undefined or object (shadowColor, shadowBLur, strokeStyle, lineWidth): highlight the currently sounding notes.',
            beatsOnScreen: 'integer representing the number of whole measures to display at one time',
        });

        ['midiNoteRange', 'width', 'height', 'secondWidth'].forEach(_ => this.options[_] = Math.floor(this.options[_]));

        this.noteHeight = Math.floor(
            (this.options.height + 1) / (this.options.midiNoteRange + 1)
        );

        this.log('Note height: %d, Canvas height: %d, note range: %d',
            this.noteHeight, this.options.height / this.noteHeight, this.options.midiNoteRange
        );

        this.createBlankImage();

        this.log('Logging');
        this.debug('Debugging', this.options);
    }

    async init() {
        await Note.init();
    }

    createBlankImage() {
        this.canvas = Canvas.createCanvas(this.options.width, this.options.height);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.fillStyle = this.options.bg;
        this.ctx.fillRect(0, 0, this.options.width, this.options.height);

        if (this.options.debug) {
            this.ctx.strokeStyle = 'white';
            this.ctx.moveTo(this.options.width / 2, 0);
            this.ctx.lineTo(this.options.width / 2, this.options.height);
            this.ctx.moveTo(0, this.options.height / 2);
            this.ctx.lineTo(this.options.width, this.options.height / 2);
            this.ctx.stroke();
        }

        this.ctx.globalAlpha = this.options.globalAlpha;
        this.ctx.globalCompositeOperation = this.options.globalCompositeOperation;

        ImageMaker.BlankImageBuffer = ImageMaker.BlankImageBuffer || this.canvas.toBuffer('image/png');
    }

    async getFrame(currentTime) {
        this.debug('ImageMkaer.getFrame enter at %d for %d beats on screen', currentTime, this.options.beatsOnScreen);

        if (typeof currentTime === 'undefined') {
            throw new TypeError('ImageMaker.getFrame requires the current time');
        }

        let rvImageBuffer;

        const notes = await Note.readRange(currentTime - (this.options.beatsOnScreen / 2), currentTime + (this.options.beatsOnScreen / 2));

        if (notes.length === 0) {
            this.debug('No notes to add');
            rvImageBuffer = ImageMaker.BlankImageBuffer;
        } else {
            this.debug('Processing %d notes from DB at %d', notes.length, currentTime);
            this._addNotes(notes);
            this._pruneCompletedNotes(currentTime - (this.options.beatsOnScreen / 2));
            this._positionPlayingNotes(currentTime);
            this._markOverlaidPlayingNotes();
            rvImageBuffer = this.renderToBuffer(currentTime);
        }

        return rvImageBuffer;
    }

    _markOverlaidPlayingNotes() {
        this.debug('ImageMaker._markOverlaidPlayingNotes enter uniqueNotesPlaying: ', this.uniqueNotesPlaying);

        const playing = Object.values(this.endSeconds2notesPlaying)[0];
        const checkedMd5s = {};
        const unisons = [];
        this.unisons = [];

        playing.forEach(noteToMatch => {
            if (!checkedMd5s[noteToMatch.md5]) {
                checkedMd5s[noteToMatch.md5] = true;
                playing.filter(
                    noteUnderTest => noteUnderTest.md5 !== noteToMatch.md5 &&
                        noteUnderTest.pitch === noteToMatch.pitch &&
                        !checkedMd5s[noteUnderTest.md5]
                ).forEach(matchingNote => {
                    checkedMd5s[matchingNote.md5] = true;
                    unisons[matchingNote.md5] = unisons[matchingNote.md5] ? unisons[matchingNote.md5].push(matchingNote) : [noteToMatch, matchingNote]
                });
            }
        });

        for (let md5 in unisons) {
            let offset = 0;
            let borderSize = this.noteHeight / Object.keys(unisons[md5]).length;
            this.debug('Set borderSize to ', borderSize);

            unisons[md5].sort((a, b) => a.velocity > b.velocity).forEach(note => {
                if (offset > 0) {
                    note.y += offset;
                    note.height -= Math.floor(2 * offset);
                    note.x += offset;
                    note.width -= Math.floor(2 * offset);
                }
                // offset++;
                offset += borderSize / 2;

                if (note.height <= 0) {
                    throw new Error(
                        'Too many simultaneous notes for noteHeight of ' + this.noteHeight +
                        ' - note.height = ' + note.height
                    );
                }
                this.unisons[note.md5] = note;
            });
        }
    }

    _addNotes(notes) {
        this.debug('ImageMaker.addNotes %d notes', notes.length);
        notes.forEach(note => {
            if (!note.md5) {
                console.error('Note: ', note);
                throw new Error('Note has no md5!');
            }
            if (!this.uniqueNotesPlaying[note.md5]) {
                this.uniqueNotesPlaying[note.md5] = true;
                this.endSeconds2notesPlaying[note.endSeconds] = this.endSeconds2notesPlaying[note.endSeconds] || [];
                this.endSeconds2notesPlaying[note.endSeconds].push(note);
                this.debug('Added a note, unique playing notes now %d long ', Object.keys(this.uniqueNotesPlaying).length);
            } else {
                // console.error('note.md5 %s already playing', note.md5);
                // console.error('Unique playing notes: ', this.uniqueNotesPlaying);
                // console.error('Tried to add notes: ', notes);
            }
        });
    }

    _pruneCompletedNotes(maxTime) {
        Object.keys(this.endSeconds2notesPlaying)
            .sort()
            .filter(t => t < maxTime)
            .forEach(t => {
                this.debug('DELETE at ', maxTime, this.endSeconds2notesPlaying[t]);
                this.uniqueNotesPlaying[this.endSeconds2notesPlaying[t].md5] = false;
                delete this.endSeconds2notesPlaying[t];
            });
    }

    renderToBuffer(currentTime) {
        this.createBlankImage();
        this._drawPlayingNotes(currentTime);
        // cf https://github.com/Automattic/node-canvas#canvastobuffer
        return this.canvas.toBuffer('image/png');
    }


    _drawPlayingNotes(currentTime) {
        this.debug('ImageMaker._drawPlayingNotes ', this.endSeconds2notesPlaying);
        for (let endSeconds in this.endSeconds2notesPlaying) {
            this.endSeconds2notesPlaying[endSeconds].forEach(note => {
                this._drawNote(currentTime, note);
            });
        }
    }

    _positionPlayingNotes(currentTime) {
        this.debug('ImageMaker.positionPlayingNotes ', currentTime);
        if (typeof currentTime === 'undefined') {
            throw new TypeError('ImageMaker.positionPlayingNotes requires the current time');
        }

        for (let endSeconds in this.endSeconds2notesPlaying) {
            this.endSeconds2notesPlaying[endSeconds].forEach(note => {
                this._positionNote(currentTime, note);
            });
        }
    }

    _positionNote(currentTime, note) {
        if (typeof currentTime === 'undefined') {
            throw new TypeError('ImageMaker._positionNote requires the current time');
        }

        note.x = ((note.startSeconds - currentTime) * this.options.secondWidth) +
            (this.options.width / 2);

        note.width = (note.endSeconds - note.startSeconds) * this.options.secondWidth;

        if (note.width < 0) {
            console.error(currentTime, note);
            throw new Error('zero width note?');
        }

        // Left bounds
        if (note.x < 0) {
            note.width += note.x;
            note.x = 0;
        }

        // Right bounds
        if (note.x + note.width > this.options.width) {
            note.width = this.options.width - note.x;
        }

        if (note.width <= 0) {
            return;
        }

        note.y = this.options.height - ((note.pitch + 1) * this.noteHeight);

        const hue = this.options.trackHues && this.options.trackHues[note.track] ?
            this.options.trackHues[note.track] : this.options.defaultHue;

        const saturation = this.options.colour.minSaturationPc;

        // Normalise velocity for lum - todo check MidiFile.ranges.velocity.lo and .hi
        const luminosity = ((
            (this.options.colour.minLuminosityPc - this.options.colour.minLuminosityPc)
            * note.velocity
        ) / 127) + this.options.colour.minLuminosityPc;

        note.colour = 'hsl(' + hue + ', ' + saturation + '%, ' + luminosity + '%)';

        note.height = this.noteHeight;

        note.updateForDisplay();

        return note;
    }

    _drawNote(currentTime, note) {
        if (note === null) {
            this.debug('Ignore null note');
            return;
        }
        this.debug('DRAWING track %d channel %d pitch %d at x %d y %d w %d h %d, from %ds to %ds',
            note.track, note.channel, note.pitch, note.x, note.y, note.width, this.noteHeight, note.startSeconds, note.endSeconds,
            note.colour
        );

        if (this.unisons && this.unisons[note.md5]) {
            note.y = this.unisons[note.md5].y;
            note.height = this.unisons[note.md5].height;
        }

        try {
            this.ctx.fillStyle = note.colour;
            this.ctx.fillRect(
                Math.floor(note.x),
                Math.floor(note.y),
                Math.floor(note.width),
                note.height
            );
            if (this.options.highlightCurrent && note.startSeconds <= currentTime && note.endSeconds > currentTime) {
                this.ctx.save();
                this.ctx.globalAlpha = this.options.highlightCurrent.alpha;
                this.ctx.strokeStyle = this.options.highlightCurrent.strokeStyle;
                this.ctx.shadowColor = this.options.highlightCurrent.shadowColor;
                this.ctx.shadowBlur = this.options.highlightCurrent.shadowBlur;
                this.ctx.lineWidth = this.options.highlightCurrent.lineWidth;
                this.ctx.strokeRect(
                    Math.floor(note.x),
                    Math.floor(note.y),
                    Math.floor(note.width),
                    note.height
                );
                this.ctx.restore();
            }
        } catch (e) {
            console.error('Note:', note);
            console.error('Range:', this.options.midiNoteRange);
            console.error('Canvas %d x %d:', this.options.width, this.options.height);
            throw e;
        }
    }
};