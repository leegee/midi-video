#!/usr/bin/env node

import readdir from "recursive-readdir";

import noteHues = from '../src/Colours/roland-td11.js');
import App = from  "../src/index");

let processed = 0;
let TODO = 1;

readdir( "fixtures/google-groove/groove/drummer1/session1", [ ignoreFunc ], ( err, files ) => {
    if ( err ) throw err;

    files.forEach( path => {
        const base = path.replace( /\.mid$/, '' );
        processFile( base );
    } );
} );

function ignoreFunc ( file, stats ) {
    return !file.match( /\.mid$/ );
}

async function processFile ( base ) {
    processed++;
    if ( processed > TODO ) {
        return;
    }

    const t = base.split( /[\\\/]+/ );
    title = [
        t.pop(), t.pop(), t.pop()
    ]
        .reverse()
        .join( ' ' )
        .replace( /_/g, ' ' )
        .replace( /(^|\s)\S/g, ( t ) => {
            return t.toUpperCase();
        } );

    console.log( 'Path:%s\nTitle:%s', base, title );

    const app = new App( {
        noteHues: noteHues,
        audiopath: base + '.wav',
        midipath: base + '.mid',
        text: {
            title,
            composer: 'From the Google Groove Dataset',
            performer: 'Dillon Vado (Never Weather), Jonathan Fishman (Phish), Michaelle Goerlitz (Wild Mango), Nick Woodbury (SF Contemporary Music Players), Randy Schwartz (El Duo), Jon Gillick, Mikey Steczo, Sam Berman, and Sam Hancock'
        }
    } );

    try {
        const encoderExitStatus = await app.integrate();
        this.options.logger.debug( 'Completed with code', encoderExitStatus );
    } catch ( e ) {
        console.trace();
        console.error( e );
    }
}