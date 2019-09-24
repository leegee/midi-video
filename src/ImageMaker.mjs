const Jimp = require('jimp');

const Note = require("./Note.mjs"); // .verbose();
const assertOptions = require('./assertOptions.mjs');

module.exports = class ImageMaker {
    static Blank = null;
    static BlankImageBuffer = null;

    options = {
        verbose: false,
        secondWidth: undefined,
        width: undefined, // 1920,
        height: undefined, // 1080,
        noteHeight: undefined,
        trackColours: undefined,
        bg: 'black',
        defaultColour: 'yellow',
        beatsOnScreen: undefined
    };

    seconds2notesPlaying = {};
    uniqueNotesPlaying = {};

    constructor(options) {
        this.options = Object.assign({}, this.options, options);

        this.options.defaultColour = Jimp.cssColorToHex(this.options.defaultColour);
        this.options.bg = Jimp.cssColorToHex(this.options.bg);

        if (this.options.trackColours) {
            this.options.trackColours = this.options.trackColours.map(
                key => Jimp.cssColorToHex(key)
            );
        }

        assertOptions(this.options, {
            noteHeight: 'integer, the pixel height of a single note',
            secondWidth: 'integer, being the number of pixels representing a second of time',
            width: 'integer, being the video display  width',
            height: 'integer, being the video display  height',
            defaultColour: 'a CSS colour value for the notes',
            bg: 'a CSS colour value for the background',
            beatsOnScreen: 'integer representing the number of whole measures to display at one time',
        });

        ['width', 'height', 'secondWidth'].forEach(_ => this.options[_] = Math.floor(this.options[_]));

        this.log = this.options.verbose ? console.log : () => { };
        this.debug = this.options.verbose ? console.debug : console.debug; // () => { };
    }

    async init() {
        await Promise.all([
            Note.init(),
            this.createBlankImage()
        ]);
    }

    createBlankImage() {
        return new Promise((resolve, reject) => {
            new Jimp(this.options.width, this.options.height, (err, image) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                image.background(this.options.bg);
                ImageMaker.Blank = image;
                ImageMaker.BlankImageBuffer = image.getBufferAsync(Jimp.MIME_PNG);;
                resolve(this);
            });
        });
    }

    async getFrame(currentTime) {
        this.debug('ImageMkaer.getFrame enter for ', currentTime, this.options.beatsOnScreen);
        const notes = await Note.readRange(currentTime - (this.options.beatsOnScreen / 2), currentTime + (this.options.beatsOnScreen / 2));

        if (notes.length === 0) {
            this.debug('No notes to add');
            return ImageMaker.BlankImageBuffer;
        } else {
            this.debug('Adding %d notes now', notes.length);
            this.addNotes(notes);
            this.removeNotes(currentTime - (this.options.beatsOnScreen / 2));

            // this.markOverlaidPlayingNotes();

            return await this.renderAsBuffer(currentTime);
        }
    }

    addNotes(notes) {
        console.log('ImageMaker.addNotes %d notes', notes.length);
        notes.forEach(note => {
            if (!this.uniqueNotesPlaying[note.md5]) {
                this.uniqueNotesPlaying[note.md5] = true;
                this.seconds2notesPlaying[note.endSeconds] = this.seconds2notesPlaying[note.endSeconds] || [];
                this.seconds2notesPlaying[note.endSeconds].push(note);
            }
        });
    }

    removeNotes(maxTime) {
        Object.keys(this.seconds2notesPlaying)
            .sort()
            .filter(t => t < maxTime)
            .forEach(t => {
                // this.debug('DELETE at ', maxTime, this.seconds2notesPlaying[t]);
                this.uniqueNotesPlaying[this.seconds2notesPlaying[t].md5] = false;
                delete this.seconds2notesPlaying[t];
            });
    }

    async renderAsBuffer(currentTime) {
        if (ImageMaker.Blank === null) {
            await this.createBlankImage();
        }
        this.image = ImageMaker.Blank.clone();

        this._render(currentTime);

        return this.image.getBufferAsync(Jimp.MIME_PNG);
    }

    _render(currentTime) {
        console.log('Render ', this.seconds2notesPlaying);
        for (let endSeconds in this.seconds2notesPlaying) {
            this.seconds2notesPlaying[endSeconds].forEach(note => {
                const updatedNoteOrNull = this._positionNote(currentTime, note);
                this._drawNote(updatedNoteOrNull);
            });
        }
    }

    _positionNote(currentTime, note) {
        note.x = ((note.startSeconds - currentTime) * this.options.secondWidth)
            + (this.options.width / 2);

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

        note.y = ((note.pitch - 1) * this.options.noteHeight) - 1;

        note.y = this.options.height - note.y;

        note.colour = this.options.trackColours && this.options.trackColours[note.track] ?
            this.options.trackColours[note.track] : this.options.defaultColour;

        note.height = this.options.noteHeight;

        note.update();

        return note;
    }

    _drawNote(note) {
        if (note === null) {
            console.debug('Ignore null note');
            return;
        }
        console.debug('DRAWING track %d channel %d pitch %d at x %d y %d w %d h %d, from %ds to %ds',
            note.track, note.channel, note.pitch, note.x, note.y, note.width, this.options.noteHeight, note.startSeconds, note.endSeconds
        );

        this.image.scan(
            Math.floor(note.x),
            Math.floor(note.y),
            Math.floor(note.width),
            note.height,
            function (x, y, offset) {
                this.bitmap.data.writeUInt32BE(note.colour, offset, true);
            }
        );
    }
};

