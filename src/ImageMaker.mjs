const Jimp = require('jimp');

module.exports = class ImageMaker {
    static Blank = null;

    options = {
        width: 1920,
        height: 1080
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
                ImageMaker.Blank = image;
                resolve(this);
            });
        });
    }

    addNotes(notes) {
        notes.forEach(note => {
            this.seconds2notesPlaying[note.startSeconds] = this.seconds2notesPlaying[note.startSeconds] || [];
            this.seconds2notesPlaying[note.startSeconds].push(note);
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
                this.debug('PLAYING ', note);
            });
        }
    }

    _makeIteratorThatFillsWithColor(color) {
        return (x, y, offset) => {
            this.bitmap.data.writeUInt32BE(color, offset, true);
        }
    }

    _drawNote(x, y) {
        // x, y, w, h, f
        this.image.scan(x, y, width, height, _makeIteratorThatFillsWithColor(0x00000040));
    }
};

