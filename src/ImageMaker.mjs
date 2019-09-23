const Jimp = require('jimp');

const assertOptions = require('./assertOptions.mjs');

module.exports = class ImageMaker {
    static Blank = null;

    options = {
        verbose: false,
        secondWidth: undefined,
        width: undefined, // 1920,
        height: undefined, // 1080,
        noteHeight: undefined,
        trackColours: undefined,
        bg: 'black',
        defaultColour: 'yellow'
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
            bg: 'a CSS colour value for the background'
        });

        ['width', 'height', 'secondWidth'].forEach(_ => this.options[_] = Math.floor(this.options[_]));
        
        this.log = this.options.verbose ? console.log : () => { };
        this.debug = this.options.verbose ? console.debug : console.debug; // () => { };
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
                resolve(this);
            });
        });
    }

    addNotes(notes) {
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
            // .forEach(t => delete this.seconds2notesPlaying[t]);
            .forEach(t => {
                console.log('DELETE at ', maxTime, this.seconds2notesPlaying[t]);
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
        for (let startSeconds in this.seconds2notesPlaying) {
            this.seconds2notesPlaying[startSeconds].forEach(note => {
                this._drawNote(currentTime, note);
            });
        }
    }

    // todo midi startSeconds is 1 based, prefer 0?
    _drawNote(currentTime, note) {
        let x = ((note.startSeconds - currentTime) * this.options.secondWidth)
            + (this.options.width / 2);

        let noteWidth = (note.endSeconds - note.startSeconds) * this.options.secondWidth;

        if (noteWidth < 0) {
            console.error(currentTime, note);
            throw new Error('zero width note?');
        }

        // Left bounds
        if (x < 0) {
            noteWidth += x;
            x = 0;
        }

        // Right bounds
        if (x + noteWidth > this.options.width) {
            noteWidth = this.options.width - x;
        }

        if (noteWidth <= 0) {
            return;
        }

        let y = ((note.pitch - 1) * this.options.noteHeight) - 1;

        y = this.options.height - y;

        console.log('y2 = ', y);

        const colour = this.options.trackColours && this.options.trackColours[note.track] ?
            this.options.trackColours[note.track] : this.options.defaultColour;

        this.debug('DRAWING track %d channel %d pitch %d at x %d y %d w %d h %d, from %ds to %ds',
            note.track, note.channel, note.pitch, x, y, noteWidth, this.options.noteHeight, note.startSeconds, note.endSeconds
        );

        this.image.scan(
            Math.floor(x),
            Math.floor(y),
            Math.floor(noteWidth),
            this.options.noteHeight,
            function (x, y, offset) {
                this.bitmap.data.writeUInt32BE(colour, offset, true);
            }
        );
    }
};

