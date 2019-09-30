const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const stream = require('stream');

const FFMPEG_PATH = require('@ffmpeg-installer/ffmpeg').path;

const assertOptions = require('./assertOptions.mjs');

// thx https://dzone.com/articles/creating-video-on-the-server-in-nodejs

module.exports = class Encoder {
    static log = () => { }
    static debug = () => { }
    static doLog = false;

    static logging() {
        Note.doLog = true;
        Note.log = console.log;
        Note.debug = console.debug;
        return Note;
    }

    imagesStream = undefined;
    options = {
        createTitle: false,
        fps: undefined,
        width: undefined,
        height: undefined,
        audiopath: undefined,
        outputpath: path.resolve('./output.mp4'),
        logging: false,
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
        this.log = this.options.logging ? console.log : () => { };
        this.debug = this.options.debug ? console.debug : () => { };
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
                '-pix_fmt', this.options.pixFmt,
                '-i', '-'
            ];
            if (this.options.audiopath) {
                if (this.options.createTitle) {
                    const t = new Date();
                    t.setHours(0);
                    t.setMinutes(0);
                    t.setSeconds(this.options.titleDuration);
                    const audiooffset = t.toLocaleTimeString('en-GB', { hour12: false });
                    console.log('Audio offset, after titles: [%s]', audiooffset);
                    args.push('-itsoffset', audiooffset);
                }
                args.push('-i', this.options.audiopath);
            }
            args.push(
                '-vcodec', 'mpeg4',
                '-shortest',
                this.options.outputpath
            );

            this.log('pre-spawn ffmpeg', args);
            const childProcess = child_process.spawn(FFMPEG_PATH, args);
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

            childProcess.on('error', data => {
                const str = data.toString();
                console.error('ERROR', str);
                this.stderr += str + '\n';
                reject(str);
            });

            childProcess.on('exit', code => {
                console.info('Child proc closed');
            });

            childProcess.on('close', code => {
                this.pipeOpen = false;
                console.info(
                    'Encoder: closed pipe after %d images, ffmpeg exit status %d',
                    this.totalImagesAdded, code
                );
                this.parseOutput();
                resolve(code);
            });

            this.pipeOpen = true;
            this.imagesStream = new stream.PassThrough();
            this.imagesStream.on('error', () => {
                console.error('imageStream error: ', error);
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

    async finalise() {
        this.log('Encoder.finalise closing imageStream');
        this.imagesStream.end();
        this.log('Encoder.finalise done');
    }

}