const Jimp = require('jimp');

module.exports = class Image {
    jimp = null;
    options = {};

    async create(options) {
        this.options = Object.assign({}, this.options, options);
        this.log = options.verbose ? console.log : () => { };

        return new Promise((resolve, reject) => {
            new Jimp(options.width, options.height, (err, image) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                this.jimp = image;
                resolve(this);
            });
        });
    }

    async getBuffer() {
        return await this.jimp.getBufferAsync(Jimp.MIME_PNG);
    }

}