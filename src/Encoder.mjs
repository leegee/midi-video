const path = require('path');
const spawn = require('child_process').spawn;
const stream = require('stream');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

// thx https://dzone.com/articles/creating-video-on-the-server-in-nodejs
// https://stackoverflow.com/questions/37957994/how-to-create-a-video-from-image-buffers-using-fluent-ffmpeg

module.exports = class Encoder {
    secsPerImage = 0.25;
    width = 1920;
    height = 1080;

    constructor() {
        this.imagesStream = new stream.PassThrough();
        this.outputFilename = path.resolve('./output.mp4');
    }

    init() {
        return new Promise((resolve, reject) => {
            const framerate = '1/' + this.secsPerImage;
            const videosize = `${this.width}x${this.height}`;
            // var audiotrack = path.join(AUDIO_ROOT, options.audio.track);

            var childProcess = spawn(ffmpegPath,
                [
                    '-y', '-f', 'image2pipe',
                    '-s', videosize,
                    '-framerate', framerate,
                    '-pix_fmt', 'yuv420p',
                    '-i', '-',
                    // '-i', audiotrack,
                    '-vcodec', 'mpeg4',
                    '-shortest',
                    this.outputFilename
                ]
            );

            childProcess.stdout.on('data', data => console.log(data.toString()));
            childProcess.stderr.on('data', data => console.log(data.toString()));
            childProcess.on('close', code => {
                console.log(`Done: (${code})`);
                resolve();
            });

            this.imagesStream.pipe(childProcess.stdin);
        });
    }


    addImage(buffer) {
        this.imagesStream.write(buffer, 'utf8');
    }

    finally() {
        this.imagesStream.end();
    }
}

