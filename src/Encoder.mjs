const path = require('path');
const child_process = require('child_process');
const stream = require('stream');

const FFMPEG_PATH = require('@ffmpeg-installer/ffmpeg').path;

const appLogger = require('./appLogger.mjs');
const assertOptions = require('./assertOptions.mjs');

// thx https://dzone.com/articles/creating-video-on-the-server-in-nodejs

module.exports = class Encoder {

    imagesStream = undefined;
    options = {
        text: undefined,
        fps: undefined,
        width: undefined,
        height: undefined,
        audiopath: undefined,
        outputpath: path.resolve('./output.mp4'),
        pixFmt: 'yuv420p',
        titleDuration: undefined
    };
    totalImagesAdded = 0;
    stderr = '';
    stdout = '';
    encoded = {};
    fps = undefined;

    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.options.logger = appLogger;

        assertOptions(this.options, {
            fps: 'integer',
            width: 'integer',
            height: 'integer',
            outputpath: 'string'
        });
    }

    init() {
        this.options.logger.debug('Encoder.init');
        return new Promise((resolve, reject) => {
            const args = [
                '-y', '-f', 'image2pipe',
                '-s', [this.options.width, this.options.height].join('x'),
                '-framerate', this.options.fps,
                '-pix_fmt', this.options.pixFmt,
                '-i', '-'
            ];
            if (this.options.audiopath) {
                if (this.options.text) {
                    const t = new Date();
                    t.setHours(0);
                    t.setMinutes(0);
                    t.setSeconds(this.options.titleDuration);
                    const audiooffset = t.toLocaleTimeString('en-GB', {
                        hour12: false
                    });
                    this.options.logger.debug('Audio offset, after titles: [%s]', audiooffset);
                    args.push('-itsoffset', audiooffset);
                }
                args.push('-i', this.options.audiopath);
            }
            args.push(
                '-vcodec', 'mpeg4',
                '-shortest',
                this.options.outputpath
            );

            this.options.logger.debug('pre-spawn ffmpeg', args);
            const childProcess = child_process.spawn(FFMPEG_PATH, args);
            this.options.logger.debug('post-spawn ffmpeg');

            childProcess.stdout.on('data', data => {
                const str = data.toString();
                this.options.logger.debug(str);
                this.stdout += str + '\n';
            });

            childProcess.stderr.on('data', data => {
                const str = data.toString();
                this.options.logger.debug(str);
                this.stderr += str + '\n';
            });

            childProcess.on('error', data => {
                const str = data.toString();
                this.options.logger.error('ERROR', str);
                this.stderr += str + '\n';
                reject(str);
            });

            childProcess.on('exit', code => {
                this.options.logger.info('Encoder: child proc exit', code);
                this.pipeOpen = false;
            });

            childProcess.on('close', code => {
                this.options.logger.info(
                    'Encoder: child proc closed pipe after %d images, ffmpeg exit status %d',
                    this.totalImagesAdded, code
                );
                this.parseOutput();
                resolve(code);
            });

            this.imagesStream = new stream.PassThrough();
            this.imagesStream.on('error', () => {
                this.options.logger.error('imageStream error: ', error);
                this.pipeOpen = true;
            });
            this.imagesStream.pipe(childProcess.stdin);
            this.options.logger.debug('Encoder pipe connected');
        });
    }

    parseOutput() {
        try {
            this.encoded.frame = Number(this.stderr.match(/frame=\s*(\d+)/s)[1]);
            this.encoded.fps = this.stderr.match(/\s+fps=(\S+)/s)[1];
            this.encoded.time = this.stderr.match(/\s+time=(\d{2}:\d{2}:\d{2}.\d+)/s)[1];
        } catch (err) {
            this.options.logger.error('='.repeat(100));
            this.options.logger.error(this.stderr);
            this.options.logger.error('^'.repeat(100));
            throw err;
        }
    }

    addImage(buffer) {
        if (!(buffer instanceof Buffer)) {
            throw new TypeError('addImage requires a Buffer, received ' + buffer);
        }
        this.options.logger.silly('Encoder.addImage adding image');
        this.imagesStream.write(buffer, 'utf8');
        this.totalImagesAdded++;
        this.options.logger.silly('Encoder.addImage added image', this.totalImagesAdded);
    }

    async finalise() {
        this.options.logger.debug('Encoder.finalise closing imageStream');
        this.imagesStream.end();
        this.options.logger.debug('Encoder.finalise done');
    }

}