import path from 'path';
import fs from 'fs';
import chai from "chai";
import chaiFs from "chai-fs";
const expect = chai.expect;
chai.use( chaiFs );

import ImageMaker from "./ImageMaker.js";
import Note from './Note.js';

describe( 'ImageMaker', () => {
    it( 'get', async () => {
        const imageMaker = new ImageMaker( {
            width: 100,
            height: 100,
            noteHeight: 10,
            secondWidth: 10,
            beatsOnScreen: 10,
            midiNoteRange: 10
        } );

        await imageMaker.init();

        expect( imageMaker ).to.be.an.instanceOf( ImageMaker );
        await imageMaker.renderToBuffer();
        expect( imageMaker.renderToBuffer() ).to.be.an.instanceOf( Buffer );
    } );

    it( 'overlay pitch, varied velocity', async () => {
        await Note.init();

        const midiNoteRange = 10;

        const noteArgs = {
            startSeconds: 0,
            endSeconds: 1,
            pitch: 1,
            track: 0,
            channel: 0,
        };

        await new Note( {
            ...noteArgs,
            track: 0,
            velocity: 100
        } ).save();

        await new Note( {
            ...noteArgs,
            track: 1,
            velocity: 50
        } ).save();

        const im = new ImageMaker( {
            width: 1000,
            height: 1000,
            noteHeight: 10,
            secondWidth: 60,
            beatsOnScreen: 1,
            midiNoteRange
        } );
        expect( im ).to.be.an.instanceOf( ImageMaker );

        await im.init();
        im.createBlankImage();

        const imageBuffer = await im.getFrame( 0.5 );
        expect( imageBuffer ).to.be.an.instanceOf( Buffer );

        const savePath = path.resolve( 'temp.png' );
        fs.writeFileSync( savePath, imageBuffer );

        expect( savePath ).to.be.a.path();
    } );


    it( 'min/max note range', async () => {
        await Note.init();

        const midiNoteRange = 10;

        const noteArgs = {
            startSeconds: 0,
            endSeconds: 1,
            pitch: 1,
            track: 0,
            channel: 0,
        };

        await new Note( {
            ...noteArgs,
            track: 1,
            velocity: 50
        } ).save();

        await new Note( {
            ...noteArgs,
            pitch: midiNoteRange - 1,
        } ).save();

        const im = new ImageMaker( {
            width: 1000,
            height: 1000,
            noteHeight: 10,
            secondWidth: 60,
            beatsOnScreen: 1,
            midiNoteRange
        } );
        expect( im ).to.be.an.instanceOf( ImageMaker );

        await im.init();
        im.createBlankImage();

        const imageBuffer = await im.getFrame( 0.5 );
        expect( imageBuffer ).to.be.an.instanceOf( Buffer );

        const savePath = path.resolve( 'temp.png' );
        fs.writeFileSync( savePath, imageBuffer );

        expect( savePath ).to.be.a.path();
    } );

    it( 'velocity', async () => {
        await Note.init();

        const midiNoteRange = 127;

        const noteArgs = {
            track: 0,
            channel: 0,
        };

        for ( let pitch = 1; pitch < 127; pitch += 127 / 3 ) {
            await new Note( {
                ...noteArgs,
                pitch,
                velocity: pitch,
                startSeconds: 0,
                endSeconds: 1
            } ).save();
        }

        const im = new ImageMaker( {
            beatsOnScreen: 2,
            width: 1000,
            height: 1000,
            noteHeight: 10,
            secondWidth: 10,
            midiNoteRange
        } );
        expect( im ).to.be.an.instanceOf( ImageMaker );

        await im.init();
        im.createBlankImage();

        const imageBuffer = await im.getFrame( 0 );
        expect( imageBuffer ).to.be.an.instanceOf( Buffer );

        const savePath = path.resolve( 'temp-velocity.png' );
        fs.writeFileSync( savePath, imageBuffer );

        expect( savePath ).to.be.a.path();
    } );
} );

