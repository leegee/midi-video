const Jimp = require('jimp');

module.exports = class Image {
    jimp = null;

    async create(args) {
        return new Promise((resolve, reject) => {
            new Jimp(args.width, args.height, (err, image) => {
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