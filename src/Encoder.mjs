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
        fps: undefined,
        width: undefined,
        height: undefined,
        audioFilepath: undefined,
        outputpath: path.resolve('./output.mp4'),
        verbose: true,
    };
    totalImagesAdded = 0;
    stderr = '';
    stdout = '';
    encoded = {};
    fps = undefined;

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.log = this.options.verbose ? console.log : () => { };
        this.log('New Encoder', this.options);

        assertOptions(this.options, {
            fps: 'integer',
            width: 'integer',
            height: 'integer'
        });
    }

    init() {
        this.log('Enter Encoder.create');
        return new Promise((resolve, reject) => {
            const videosize = [this.options.width, this.options.height].join('x');

            this.log('pre-spawn ffmpeg');
            const args = [
                '-y', '-f', 'image2pipe',
                '-s', videosize,
                '-framerate', this.options.fps,
                '-pix_fmt', 'yuv420p',
                '-i', '-'];
            if (this.options.audioFilepath) {
                args.push('-i', this.options.audioFilepath);
            }
            args.push(
                '-vcodec', 'mpeg4',
                '-shortest',
                this.options.outputpath
            );
            const childProcess = spawn(ffmpegPath, args);
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
                this.log(`Done: (${code})`);
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
            this.log('='.repeat(100));
            this.log(this.stderr);
            this.log('^'.repeat(100));
            throw err;
        }

    }

    addImage(buffer) {
        if (!(buffer instanceof Buffer)) {
            throw new TypeError('addImage requires a Buffer, received ' + buffer);
        }
        this.imagesStream.write(buffer, 'utf8');
        this.totalImagesAdded++;
    }

    finalise() {
        this.imagesStream.end();
        this.log('Done Encoder.finalise');
    }
}

