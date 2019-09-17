const path = require('path');
const spawn = require('child_process').spawn;
const stream = require('stream');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

// thx https://dzone.com/articles/creating-video-on-the-server-in-nodejs
// https://stackoverflow.com/questions/37957994/how-to-create-a-video-from-image-buffers-using-fluent-ffmpeg

module.exports = class Encoder {
    imagesStream = new stream.PassThrough();
    options = {
        secsPerImage: 0.25,
        width: 1920,
        height: 1080,
        outputPath: path.resolve('./output.mp4')
    };

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        console.log('xxx', this.options);
    }

    init() {
        console.log('Enter Encoder.create');
        return new Promise((resolve, reject) => {
            const framerate = '1/' + this.options.secsPerImage;
            const videosize = `${this.options.width}x${this.options.height}`;
            // var audiotrack = path.join(AUDIO_ROOT, options.audio.track);

            console.log('pre-spawn');
            const childProcess = spawn(ffmpegPath,
                [
                    '-y', '-f', 'image2pipe',
                    '-s', videosize,
                    '-framerate', framerate,
                    '-pix_fmt', 'yuv420p',
                    '-i', '-',
                    // '-i', audiotrack,
                    '-vcodec', 'mpeg4',
                    '-shortest',
                    this.options.outputPath
                ]
            );

            console.log('post-spawn');

            childProcess.stdout.on('data', data => console.log(data.toString()));
            childProcess.stderr.on('data', data => console.log(data.toString()));
            childProcess.on('close', code => {
                console.log(`Done: (${code})`);
                resolve();
            });

            this.imagesStream.pipe(childProcess.stdin);
            console.log('pipe connected');
        });
    }


    addImage(buffer) {
        this.imagesStream.write(buffer, 'utf8');
        console.log('Done addImage');
    }

    finally() {
        this.imagesStream.end();
        console.log('Done finally');
    }
}

