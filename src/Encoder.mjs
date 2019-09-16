const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath);

// thx https://dzone.com/articles/creating-video-on-the-server-in-nodejs

module.exports = class Encoder {
    static command = ffmpeg();

    encode() {
        this.timemark = null;
        // 6 consecutive 1920x1080 frames, held 6 seconds each, 30fps, with m4a audio, watermarked
        Encoder.command
            .on('end', this.onEnd.bind(this))
            .on('progress', this.onProgress(this))
            .on('error', this.onError(this))
            .input('assets/demo2/folds-of-spacetime_%03d.png')
            .inputFPS(1 / 6)
            .videoFilter(["movie=assets/demo2/soa-watermark.png [watermark]; [in][watermark] overlay=10:main_h-overlay_h-10 [out]"])
            .input('assets/demo2/folds-of-spacetime.m4a')
            .output('assets/demo2/folds-of-spacetime.mp4')
            .outputFPS(30)
            .run();
    }

    onProgress(progress) {
        if (progress.timemark != this.timemark) {
            this.timemark = progress.timemark;
            console.log('Time mark: ' + this.timemark + "...");
        }
    }
    onError(err, stdout, stderr) {
        console.log('Cannot process video: ' + err.message);
    }
    onEnd() {
        console.log('Finished processing');
    }
}

