const Jimp = require('jimp');

module.exports = class ImageMaker {
    static Blank = null;

    options = {
        width: 1920,
        height: 1080
    };

    constructor(options) {
        this.options = Object.assign({}, this.options, options);
        this.log = this.options.verbose ? console.log : () => { };
    }

    async createBlankImage() {
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

    async create() {
        if (ImageMaker.Blank === null){
            await this.createBlankImage();
        }
        this.image = ImageMaker.Blank.clone();
    }

    async getBuffer() {
        return await this.image.getBufferAsync(Jimp.MIME_PNG);
    }

}