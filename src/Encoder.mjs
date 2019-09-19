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
        secsPerImage: undefined,
        width: undefined,
        height: undefined,
        outputpath: path.resolve('./output.mp4'),
        verbose: true,
    };
    totalImagesAdded = 0;
    stderr = '';
    stdout = '';
    encoded = {};

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.log = this.options.verbose ? console.log : () => { };
        this.log('New Encoder', this.options);

        assertOptions(this.options, {
            secsPerImage: '"secsPerImage" as a number',
            width: 'number',
            height: 'number'
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

            childProcess.stdout.on('data', data => {
                const str = data.toString();
                // this.log(str);
                this.stdout += str + '\n';
            });
            childProcess.stderr.on('data', data => {
                const str = data.toString();
                this.log(str);
                this.stderr += str + '\n';
            });
            childProcess.on('close', code => {
                this.log(`Done: (${code})`);
                this.parseOutput();
                resolve(code);
            });

            this.imagesStream.pipe(childProcess.stdin);
            this.log('pipe connected');
        });
    }

    parseOutput() {
        // this.log('='.repeat(100));
        // this.log(this.stderr);
        // this.log('^'.repeat(100));

        // frame=    5 fps=0.0 q=2.0 Lsize=       4kB time=00:00:01.78 bitrate=  16.6kbits/s speed= 255x
        this.encoded.frame = Number( this.stderr.match(/frame=\s*(\d+)/s)[1] );
        this.encoded.fps = this.stderr.match(/\s+fps=(\S+)/s)[1];
        this.encoded.time = this.stderr.match(/\s+time=(\d{2}:\d{2}:\d{2}.\d+)/s)[1];

    }

    addImage(buffer) {
        if (!(buffer instanceof Buffer)) {
            throw new TypeError('addImage requires a Buffer, received ' + buffer);
        }
        this.imagesStream.write(buffer, 'utf8');
        this.totalImagesAdded++;
        // this.log('Done Encoder.addImage', this.totalImagesAdded);
    }

    finalise() {
        this.imagesStream.end();
        this.log('Done Encoder.finalise');
    }
}

