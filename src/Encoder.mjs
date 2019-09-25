const path = require('path');
const child_process = require('child_process');
const stream = require('stream');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

const assertOptions = require('./assertOptions.mjs');

// thx https://dzone.com/articles/creating-video-on-the-server-in-nodejs

module.exports = class Encoder {
    imagesStream = new stream.PassThrough();
    options = {
        fps: undefined,
        width: undefined,
        height: undefined,
        audioFilepath: undefined,
        outputpath: path.resolve('./output.mp4'),
        logging: false,
    };
    totalImagesAdded = 0;
    stderr = '';
    stdout = '';
    encoded = {};
    fps = undefined;

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.log = this.options.logging ? console.log : () => {};
        this.log('Encoder.new from ', this.options);

        assertOptions(this.options, {
            fps: 'integer',
            width: 'integer',
            height: 'integer',
            outputpath: 'string'
        });
    }

    init() {
        this.log('Encoder.init');
        return new Promise((resolve, reject) => {
            const args = [
                '-y', '-f', 'image2pipe',
                '-s', [this.options.width, this.options.height].join('x'),
                '-framerate', this.options.fps,
                '-pix_fmt', 'yuv420p',
                '-i', '-'
            ];
            if (this.options.audioFilepath) {
                args.push('-i', this.options.audioFilepath);
            }
            args.push(
                '-vcodec', 'mpeg4',
                '-shortest',
                this.options.outputpath
            );

            this.log('pre-spawn ffmpeg', args);
            const childProcess = child_process.spawn(ffmpegPath, args);
            this.log('post-spawn ffmpeg');

            childProcess.stdout.on('data', data => {
                const str = data.toString();
                this.log(str);
                this.stdout += str + '\n';
            });
            childProcess.stderr.on('data', data => {
                const str = data.toString();
                this.log(str);
                this.stderr += str + '\n';
            });
            childProcess.on('close', code => {
                this.log(
                    'Encoder: close pipe after %d image, ffmpeg exit status %d',
                    this.totalImagesAdded, code
                );
                this.parseOutput();
                resolve(code);
            });

            this.imagesStream.pipe(childProcess.stdin);
            this.log('pipe connected');
        });
    }

    parseOutput() {
        try {
            this.encoded.frame = Number(this.stderr.match(/frame=\s*(\d+)/s)[1]);
            this.encoded.fps = this.stderr.match(/\s+fps=(\S+)/s)[1];
            this.encoded.time = this.stderr.match(/\s+time=(\d{2}:\d{2}:\d{2}.\d+)/s)[1];
        } catch (err) {
            console.error('='.repeat(100));
            console.error(this.stderr);
            console.error('^'.repeat(100));
            throw err;
        }

    }

    addImage(buffer) {
        if (!(buffer instanceof Buffer)) {
            throw new TypeError('addImage requires a Buffer, received ' + buffer);
        }
        this.debug('Encoder.addImage adding image');
        this.imagesStream.write(buffer, 'utf8');
        this.totalImagesAdded++;
        this.debug('Encoder.addImage added image', this.totalImagesAdded);
    }

    finalise() {
        this.log('Encoder.finalise closing imageStream');
        this.imagesStream.end();
        this.log('Encoder.finalise done');
    }
}