const Jimp = require('jimp');

module.exports = class ImageMaker {
    static Blank = null;

    options = {
        width: 1920,
        height: 1080,
        bg: Jimp.cssColorToHex('#ffffff')
    };

    seconds2notesPlaying = {};

    constructor(options) {
        this.options = Object.assign({}, this.options, options);
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
            this.seconds2notesPlaying[note.endSeconds] = this.seconds2notesPlaying[note.startSeconds] || [];
            this.seconds2notesPlaying[note.endSeconds].push(note);
        });
    }

    removeNotes(maxTime) {
        Object.keys(this.seconds2notesPlaying)
            .sort()
            .filter(t => t < maxTime)
            .forEach(t => delete this.seconds2notesPlaying[t]);
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
        // console.log('Enter draw: %d %d %d %d',
        //     currentTime, note.startSeconds, this.options.secondWidth,
        //     (currentTime - note.startSeconds) * this.options.secondWidth
        // );
        let x = // (this.options.width/2) + 
            (note.startSeconds - currentTime) * this.options.secondWidth
            ;

        let noteWidth = (note.endSeconds - note.startSeconds) * this.options.secondWidth;

        if (noteWidth < 0) {
            console.error(currentTime, note);
            throw new Error('zero width note?');
        }
        if (x < 1) { // 0?
            x = 1;  // 0?
        }
        if (x + noteWidth > this.options.width) {
            noteWidth = this.options.width - x;
        }

        const y = note.pitch * this.options.noteHeight;

        const colour = Jimp.cssColorToHex("yellow"); // from track/channel

        // this.debug('DRAWING pitch %d at x %d y %d w %d start %d end %d', note.pitch, x, y, noteWidth, note.startSeconds, note.endSeconds);

        this.image.scan(
            x,
            y,
            noteWidth,
            this.options.noteHeight,
            function (x, y, offset) {
                // console.log('F: ', x, y, this.bitmap.width, this.bitmap.height);
                this.bitmap.data.writeUInt32BE(colour, offset, true);
            }
        );
    }
};

