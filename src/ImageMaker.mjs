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

    async render() {
        if (ImageMaker.Blank === null) {
            await this.createBlankImage();
        }
        this.image = ImageMaker.Blank.clone();

        this._render();

        return this.image.getBufferAsync(Jimp.MIME_PNG);
    }

    _render() {
        for (let startSeconds in this.seconds2notesPlaying) {
            this.seconds2notesPlaying[startSeconds].forEach(note => {
                this.log('PLAYING ', note);
            });
        }
    }

}