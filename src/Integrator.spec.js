import path from 'path';
import fs from 'fs';
import chai from "chai";
import chaiFs from "chai-fs";

const expect = chai.expect;
chai.use( chaiFs );

import Integrator from "./Integrator.js";
import Note from './Note.js';
import appLogger from './appLogger.js';

// import noteHues from '../src/Colours/roland-td11.js';

let oldLogLevel;

beforeEach( async () => {
    oldLogLevel = process.env.LEVEL;
    await Note.reset();
} );
afterEach( async () => {
    await Note.reset();
    process.env.LEVEL = oldLogLevel;
} );

describe( 'Integrator', function () {
    this.timeout( 1000 * 60 );

    it( 'Y range', async () => {
        const integrator = new Integrator( {
            outputpath: path.resolve( 'whatll-i-do.mp4' ),
            midipath: path.resolve( 'fixtures/berlin/49_MOD-IrvgB What ll I Do (1924) cb Irving Berlin pb Adam Carroll [204871].mid' ),
            fps: 1,
        } );

        await integrator.integrate();

        expect( integrator.imageMaker.options.height ).not.to.be.NaN;
        expect( integrator.imageMaker.ranges.y.lo ).not.to.be.undefined;
    } );

    it( 'creates a video file from simple MIDI', async () => {
        process.env.LEVEL = 'error';

        const integrator = new Integrator( {
            midipath: 'fixtures/4bars-60bpm.mid',
            audiopath: 'fixtures/4bars-60bpm.wav',
            largerNotes: true,
            fps: 5, // 30,
            text: {
                title: "4 Bar Test",
                composer: 'Random',
                performer: 'Bitwig'
            }
        } );
        expect( integrator ).to.be.an.instanceOf( Integrator );
        expect( integrator.options.logger ).to.be.an( 'Object' );

        expect( integrator.options.outputpath ).to.equal(
            path.resolve( 'fixtures/4bars-60bpm.mp4' )
        );

        if ( fs.existsSync( integrator.options.outputpath ) ) {
            fs.unlinkSync( integrator.options.outputpath );
        }

        const promiseResolvesWhenFileWritten = integrator.integrate();
        expect( promiseResolvesWhenFileWritten ).to.be.an.instanceOf( Promise );

        const encoderEitStatus = await promiseResolvesWhenFileWritten;

        integrator.options.logger.info( 'encoderEitStatus=' + encoderEitStatus );
        expect( encoderEitStatus ).to.equal( 0 );

        expect(
            path.resolve( integrator.options.outputpath )
        ).to.be.a.path();
    } );

    it( 'creates a video file from real world Irving Berlin MIDI', async () => {
        const integrator = new Integrator( {
            // audiopath: 'fixtures/berlin/49-IrvgB What ll I Do (1924) cb Irving Berlin pb Adam Carroll [204871]-110bpm.wav',
            midipath: 'fixtures/berlin/49_MOD-IrvgB What ll I Do (1924) cb Irving Berlin pb Adam Carroll [204871].mid',
            text: {
                title: "What'll I Do",
                composer: 'Irving Berlin, 1923',
                performer: 'Piano Roll by Adam Carroll'
            }
        } );

        expect( integrator ).to.be.an.instanceOf( Integrator );

        if ( fs.existsSync( integrator.options.outputpath ) ) {
            fs.unlinkSync( integrator.options.outputpath );
        }

        const promiseResolvesWhenFileWritten = integrator.integrate();
        expect( promiseResolvesWhenFileWritten ).to.be.an.instanceOf( Promise );

        const encoderEitStatus = await promiseResolvesWhenFileWritten;
        expect( encoderEitStatus ).to.equal( 0 );

        expect(
            path.resolve( integrator.options.outputpath )
        ).to.be.a.path();
    } );

} );



describe( 'Integrator - drummer', function () {
    this.timeout( 1000 * 60 );

    it( 'remapPitches', async () => {
        const integrator = new Integrator( {
            midipath: 'fixtures/drum-track.mid',
            noteHues: {
                1: 0, //  – red
                2: 60, // – yellow
                3: 120, // – green
                4: 180, // – turquoise
                5: 240, // – blue
                6: 300 // – pink
            },

            remapPitches: {
                26: 1,
                36: 2,
                37: 3,
                38: 4,
                42: 5,
                44: 6
            }
        } );

        await integrator.integrate();
    } );

} );