const drawText = require('node-canvas-text');
const opentype = require('opentype.js');

const assertOptions = require('./assertOptions.mjs');

module.exports = class Titles {
    log = () => { };
    debug = () => { };
    creator = 'Video © ℗ Lee Goddard';
    options = {
        ctx: undefined,
        title: undefined,
        composer: undefined,
        performer: undefined
    };

    constructor(options) {
        this.options = Object.assign({}, this.options, options);

        this.log = this.options.logging ? console.log : () => { };
        this.debug = this.options.debug ? console.debug : () => { };

        assertOptions(this.options, {
            ctx: 'CanvasRenderingContext2d',
            title: 'string',
            composer: 'string',
            performer: 'string'
        });
    }
}


{/* <link href="https://fonts.googleapis.com/css?family=Playfair+Display&display=swap" rel="stylesheet"> */}
