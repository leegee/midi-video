import chai from "chai";
import chaiFs from "chai-fs";

const expect = chai.expect;
chai.use( chaiFs );

import Note from "./Note.js"; // .debugging();

const NEW_NOTE_ARGS = {
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
};

describe( 'Note', () => {
    beforeEach( async () => {
        await Note.init();
        await Note.reset();
    } );
    afterEach( async () => {
        await Note.reset();
    } );

    it( 'saves to memory db', async () => {
        expect( Note.dbh ).to.not.be.null;
        expect( Note.statements.insert ).not.to.be.undefined;
        expect( Note.ready ).to.be.ok;

        const note = new Note( NEW_NOTE_ARGS );

        await note.save();

        const rows = await new Promise( ( resolve, reject ) => {
            Note.dbh.all( 'SELECT * FROM notes', ( err, rows ) => {
                if ( err ) {
                    console.error( 'Error retrieving data from the notes table:', err );
                    reject( err );
                } else {
                    resolve( rows );
                }
            } );
        } );

        expect( rows.length ).to.equal( 1 );

        const notes = await Note.readRange( 0, 3 );
        expect( notes.length ).to.equal( 1 );
    } );

    // it( 'it prevents saving a note with negative y', async () => {
    //     try {
    //         await new Note( {
    //             startSeconds: 0,
    //             endSeconds: 1,
    //             pitch: 1,
    //             track: 0,
    //             channel: 0,
    //             y: -1
    //         } ).save();
    //         throw new Error( 'Expected save operation to throw a TypeError' );
    //     } catch ( error ) {
    //         expect( error ).to.be.an.instanceOf( TypeError );
    //     }
    // } );

    it( 'it allows 0 pitch', async () => {
        expect( async () => {
            await new Note( {
                ...NEW_NOTE_ARGS,
                pitch: 0,
            } ).save();
        } ).not.to.throw();
    } );

    it( 'it prevents -1 pitch', async () => {
        try {
            await new Note( {
                ...NEW_NOTE_ARGS,
                pitch: -1,
            } ).save();
        } catch ( error ) {
            expect( error ).to.be.an.instanceOf( TypeError );
        }
    } );

} );
