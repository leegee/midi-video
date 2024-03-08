import chai from "chai";
import chaiFs from "chai-fs";

const expect = chai.expect;
chai.use( chaiFs );

import Note from "./Note.js"; // .debugging();

describe( 'Note', () => {
    beforeEach( async () => {
        await Note.reset();
    } );
    afterEach( async () => {
        await Note.reset();
    } );

    it.only( 'saves to memory db', async () => {
        expect( Note.dbh ).to.not.be.null;
        await Note.init();
        expect( Note.statements.insert ).not.to.be.undefined;
        expect( Note.ready ).to.be.ok;

        const note = new Note( {
            startSeconds: 0,
            endSeconds: 2.999999,
            pitch: 77,
            channel: 0,
            track: 0,
            velocity: 99,
            width: 10,
            height: 10,
            colour: 1,
            luminosity: 1,
            x: 1,
            y: 1,
        } );

        await note.save();

        Note.dbh.all( 'SELECT * FROM notes', ( err, rows ) => {
            if ( err ) {
                console.error( 'Error retrieving data from the notes table:', err );
            } else {
                console.log( 'Inserted data:', rows );
            }
        } );

        const notes = await Note.readRange( 0, 3 );
        expect( notes.length ).to.equal( 1 );
    } );

    it( 'it prevents negative y', () => {
        expect( () => {
            new Note( {
                startSeconds: 0,
                endSeconds: 1,
                pitch: 1,
                track: 0,
                channel: 0,
                y: -1
            } ).save();
        } ).to.throw();
    } );

    it( 'it allows 0 pitch', () => {
        expect( () => {
            new Note( {
                startSeconds: 0,
                endSeconds: 1,
                pitch: 0,
                track: 0,
                channel: 0,
            } ).save();
        } ).not.to.throw();
    } );

    it( 'it prevents -1 pitch', () => {
        expect( () => {
            new Note( {
                startSeconds: 0,
                endSeconds: 1,
                pitch: -1,
                track: 0,
                channel: 0,
            } ).save();
        } ).to.throw();
    } );


} );