import path from 'path';

import * as Canvas from 'canvas';
import drawText from 'node-canvas-text';
import opentype from 'opentype.js';
import smartquotes from 'smartquotes';

import appLogger from './appLogger.js';
import assertOptions from './assertOptions.js';

export default class Titles {
    creator = 'Video © ℗ Lee Goddard';
    defaultFont = path.resolve( 'fonts/Playfair_Display/PlayfairDisplay-Regular.ttf' );
    completeCanvasImageData = undefined;
    options = {
        width: undefined,
        height: undefined,
        border: 40,
        fg: 'white',
        bg: 'black',
        areas: {
            header: {
                x: undefined,
                y: undefined,
                width: undefined,
                height: undefined
            },
            center: {
                x: undefined,
                y: undefined,
                width: undefined,
                height: undefined
            },
            footer: {
                x: undefined,
                y: undefined,
                width: undefined,
                height: undefined
            },
            copyright: {
                x: undefined,
                y: undefined,
                width: undefined,
                height: undefined
            },
        },
        title: {
            text: undefined,
            font: path.resolve( 'fonts/Playfair_Display/PlayfairDisplay-Italic.ttf' ),
            color: 'white',
            // maxSize: 100,
            // minSize: 8,
        },
        composer: {
            text: undefined,
            font: path.resolve( 'fonts/Playfair_Display/PlayfairDisplay-Italic.ttf' ),
            color: 'rgba(255, 255, 255, 0.7)',
            // maxSize: 30,
            // minSize: 8,
        },
        performer: {
            text: undefined,
            font: path.resolve( 'fonts/Playfair_Display/PlayfairDisplay-Italic.ttf' ),
            color: 'rgba(255, 255, 255, 0.7)',
            // maxSize: 30,
            // minSize: 8,
        },
    };

    constructor ( options = {} ) {
        this.options = Object.assign( {}, this.options, options );

        this.options.logger = appLogger;

        assertOptions( this.options, {
            title: {
                composer: 'string',
                title: 'string',
                performer: 'string'
            },
        } );

        this.options.areas.header = {
            x: this.options.border,
            y: 0,
            width: this.options.width - ( this.options.border * 2 ),
            height: this.options.height / 3
        };

        this.options.areas.center = {
            x: this.options.border,
            y: this.options.height / 3,
            width: this.options.width - ( this.options.border * 2 ),
            height: this.options.height / 3
        };

        this.options.areas.footer = {
            x: this.options.border,
            y: this.options.height - ( this.options.height / 3 ),
            width: this.options.width - ( this.options.border / 2 ),
            height: this.options.height / 3
        };

        this.options.areas.copyright = {
            x: this.options.border,
            y: this.options.height - ( this.options.height / 3 ),
            width: this.options.width - ( this.options.border / 2 ),
            height: ( this.options.height / 3 ) - 10
        };
    }

    getFadedTitleCanvas ( opacityPc ) {
        if ( isNaN( opacityPc ) ) {
            throw new TypeError( 'getFadedTitleCanvas expected a percentage number, got ' + opacityPc );
        }
        if ( this.completeCanvasImageData === undefined ) {
            this.completeCanvasImageData = this.completeCanvasImageData || this.ctx.getImageData( 0, 0, this.options.width, this.options.height );
        }

        const fadedTitleCanvas = Canvas.createCanvas( this.options.width, this.options.height );
        const ctx = fadedTitleCanvas.getContext( '2d' );

        ctx.putImageData( this.completeCanvasImageData, 0, 0 );

        ctx.globalAlpha = opacityPc / 100;
        ctx.fillStyle = this.options.bg;
        ctx.fillRect( 0, 0, this.options.width, this.options.height );

        return fadedTitleCanvas;
    }

    getCanvas () {
        this.canvas = Canvas.createCanvas( this.options.width, this.options.height );
        this.ctx = this.canvas.getContext( '2d' );
        this.ctx.fillStyle = this.options.bg;
        this.ctx.fillRect( 0, 0, this.options.width, this.options.height );

        if ( this.options.composer.text ) {
            const args = {
                textFillStyle: this.options.composer.color || this.options.fg,
                minSize: this.options.composer.minSize,
                maxSize: this.options.composer.maxSize,
                vAlign: 'middle',
                hAlign: 'center',
                fitMethod: 'bottom',
                drawRect: false
            };
            if ( this.options.composer.minSize ) {
                args.minSize = this.options.composer.minSize;
            }
            if ( this.options.composer.maxnSize ) {
                args.minSize = this.options.composer.maxSize;
            }
            drawText(
                this.ctx,
                smartquotes( this.options.composer.text || '' ),
                opentype.loadSync( this.options.composer.font || this.defaultFont ),
                this.options.areas.header,
                args
            );
        }

        if ( this.options.title.text ) {
            const args = {
                textFillStyle: this.options.title.color || this.options.fg,
                vAlign: 'middle',
                hAlign: 'center',
                fitMethod: 'bottom',
                drawRect: false
            };
            if ( this.options.title.minSize ) {
                args.minSize = this.options.title.minSize;
            }
            if ( this.options.title.maxnSize ) {
                args.minSize = this.options.title.maxSize;
            }
            drawText(
                this.ctx,
                smartquotes( this.options.title.text || '' ),
                opentype.loadSync( this.options.title.font || this.defaultFont ),
                this.options.areas.center,
                args
            );
        }

        if ( this.options.performer.text ) {
            const args = {
                textFillStyle: this.options.performer.color || this.options.fg,
                vAlign: 'middle',
                hAlign: 'center',
                fitMethod: 'bottom',
                drawRect: false
            };
            if ( this.options.performer.minSize ) {
                args.minSize = this.options.performer.minSize;
            }
            if ( this.options.performer.maxnSize ) {
                args.minSize = this.options.performer.maxSize;
            }

            drawText(
                this.ctx,
                smartquotes( this.options.performer.text || '' ),
                opentype.loadSync( this.options.performer.font || this.defaultFont ),
                this.options.areas.footer,
                args
            );
        }

        drawText(
            this.ctx,
            `Visualisation & Video Copyright © ${ new Date().getFullYear() } ff Lee Goddard. All Rights Reserved`,
            opentype.loadSync( this.defaultFont ),
            this.options.areas.copyright, {
            textFillStyle: this.options.fg,
            minSize: 10,
            maxSize: 20,
            vAlign: 'bottom',
            hAlign: 'center',
            fitMethod: 'baseline',
            drawRect: false
        }
        );

        return this.canvas;
    }
}