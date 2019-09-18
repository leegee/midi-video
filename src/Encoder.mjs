const path = require('path');
const spawn = require('child_process').spawn;
const stream = require('stream');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

const assertOptions = require('./assertOptions.mjs');

// thx https://dzone.com/articles/creating-video-on-the-server-in-nodejs
// https://stackoverflow.com/questions/37957994/how-to-create-a-video-from-image-buffers-using-fluent-ffmpeg

module.exports = class Encoder {
    imagesStream = new stream.PassThrough();
    options = {
        secsPerImage: null,
        width: null,
        height: null,
        outputpath: path.resolve('./output.mp4'),
        verbose: true,
    };
    totalImagesAdded = 0;

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.log = this.options.verbose ? console.log : () => { };
        this.log('New Encoder', this.options);

        assertOptions(this.options, {
            secsPerImage: '"secsPerImage" as a number',
            // filepath: '"filepath" should be the path to the MIDI file to parse'
        });
    }

    init() {
        this.log('Enter Encoder.create');
        return new Promise((resolve, reject) => {
            const framerate = '1/' + this.options.secsPerImage;
            const videosize = `${this.options.width}x${this.options.height}`;
            // var audiotrack = path.join(AUDIO_ROOT, options.audio.track);

            this.log('pre-spawn ffmpeg');
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
                    this.options.outputpath
                ]
            );
            this.log('post-spawn ffmpeg');

            childProcess.stdout.on('data', data => this.log(data.toString()));
            childProcess.stderr.on('data', data => this.log(data.toString()));
            childProcess.on('close', code => {
                this.log(`Done: (${code})`);
                resolve();
            });

            this.imagesStream.pipe(childProcess.stdin);
            this.log('pipe connected');
        });
    }


    addImage(buffer) {
        this.imagesStream.write(buffer, 'utf8');
        this.totalImagesAdded ++;
        this.log('Done Encoder.addImage', this.totalImagesAdded);
    }

    finalise() {
        this.imagesStream.end();
        this.log('Done Encoder.finalise');
    }
}

