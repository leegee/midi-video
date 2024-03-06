import md5 from 'md5';
import _sqlite3 from 'sqlite3';
const sqlite3 = _sqlite3.verbose();

import appLogger from './appLogger.js';

export default class Note {
    static ready = false;
    static logger = appLogger;
    static dbFields = [
        'startSeconds', 'endSeconds', 'pitch', 'velocity', 'channel', 'track',
        'md5',
        'x', 'y', 'width', 'height', 'colour', 'luminosity'
    ];
    static statements = {
        insert: undefined,
        readRange: undefined,
        updateForDisplay: undefined,
        updatePitch: undefined,
        getUnison: undefined,
    };
    static dbh = new sqlite3.Database( ':memory:' );

    static logging ( logger ) {
        Note.logger = logger || appLogger;
        return Note;
    }

    static async reset ( options = {} ) {
        Note.ready = false;
        Note.init( options );
    }

    static async init ( options = {} ) {
        if ( Note.ready ) {
            return;
        }

        this.options = options;
        this.options.logger = appLogger;

        let scheme = 'CREATE TABLE notes (\n' +
            Note.dbFields
                .map( field => '\t' + field + (
                    field.match( /seconds/i ) ? ' DECIMAL' :
                        field.match( /(pitch|velocity)/i ) ? ' INTEGER' : ' TEXT'
                ) )
                .join( ',\n' ) +
            '\n)';

        await Note.dbh.serialize( () => {
            Note.dbh.run( 'DROP TABLE IF EXISTS notes' );
            Note.dbh.run( scheme );
            Note.statements.insert = Note.dbh.prepare(
                'INSERT INTO notes (' +
                Note.dbFields.join( ', ' ) +
                ') VALUES (' +
                new Array( Note.dbFields.length ).fill( '?' ).join( ',' ) +
                ')'
            );
            Note.statements.readRange = Note.dbh.prepare(
                'SELECT * FROM notes WHERE startSeconds BETWEEN ? and ?'
            );
            Note.statements.updatePitch = Note.dbh.prepare(
                'UPDATE notes SET (pitch) = (?) WHERE md5 = ?'
            );
            Note.statements.updateForDisplay = Note.dbh.prepare(
                'UPDATE notes SET (x, y, width, height, colour) = (?, ?, ?, ?, ?) WHERE md5 = ?'
            );
            Note.statements.getUnison = Note.dbh.prepare(
                'SELECT * FROM notes WHERE startSeconds BETWEEN ? and ? AND endSeconds BETWEEN ? and ? AND pitch = ?'
            );
        } );

        Note.ready = true;
    }

    static readRange ( from, to ) {
        if ( from < 0 ) {
            from = 0;
        }
        if ( to < 0 ) {
            to = 0;
        }

        Note.logger.silly( 'Note.readRange from %d to %d', from, to );

        return new Promise( ( resolve, reject ) => {
            const rows = [];
            Note.dbh.serialize( () => {
                Note.statements.readRange.each( from, to ).each(
                    ( err, row ) => err ? this.options.logger.error( err ) && reject( err ) : rows.push( row ),
                    () => {
                        Note.logger.silly( 'readRange from %d to %d: %d results', from, to, rows.length );
                        resolve( rows.map( row => new Note( row ) ) );
                    }
                );
            } );
        } );
    }

    static assertValues ( note ) {
        let errMsgs = [];

        if ( Number( note.x ) === NaN ) {
            errMsgs.push( 'x is NaN' );
        }
        if ( Number( note.y ) === NaN ) {
            errMsgs.push( 'y is NaN' );
        }
        if ( Number( note.y ) < 0 ) {
            errMsgs.push( 'y is negative: ' + note.y );
        }
        if ( Number( note.pitch ) < 0 || Number( note.pitch ) > 126 ) {
            errMsgs.push( 'pitch out of range 1-126: ' + note.pitch );
        }

        if ( errMsgs.length ) {
            console.trace();
            this.options.logger.error( '\nBad note: ', note );
            throw new TypeError(
                'Error' + ( errMsgs.length > 1 ? 's' : '' ) + ':\n\t' + errMsgs.join( '\n\t' )
            );
        }
    }


    constructor ( options ) {
        Note.dbFields.forEach( _ => this[ _ ] = options[ _ ] );
        this.md5 = md5(
            Note.dbFields.map( _ => options[ _ ] )
        );
    }

    save () {
        const values = [];
        Note.assertValues( this );
        Note.dbFields.forEach( _ => values.push( this[ _ ] ) );
        Note.dbh.serialize( () => {
            Note.statements.insert.run( values );
        } );
    }

    updatePitch ( newPitch ) {
        this.options.logger.silly( 'Note.updatePitch', this, newPitch );
        this.pitch = newPitch;

        if ( Number( this.pitch ) === NaN ) {
            throw new TypeError( 'pitch is NaN' );
        }
        if ( !this.md5 ) {
            throw new TypeError( 'No md5?' );
        }

        Note.dbh.serialize( () => {
            Note.statements.updatePitch.run( this.pitch, this.md5 );
            this.options.logger.silly( 'Note.updatePitch ran: ', this.pitch );
        } );
    }

    updateForDisplay () {
        Note.logger.silly( 'Note.updateForDisplay', this );
        Note.assertValues( this );
        Note.dbh.serialize( () => {
            Note.statements.updateForDisplay.run(
                this.x, this.y, this.width, this.height, this.colour
            );
            Note.logger.silly( 'Note.updateForDisplay ran: ', this.x, this.y, this.width, this.height, this.colour );
        } );
    }

    getUnisonNotes ( pitch, from, to ) {
        const rows = [];
        Note.dbh.serialize( () => {
            Note.statements.getUnison.each( from, to, from, to, pitch ).each(
                ( err, row ) => err ? this.options.logger.error( err ) && reject( err ) : rows.push( row ),
                () => {
                    Note.logger.debug( 'getUnisonNotes at pitch %d from %d to %d: %d results', pitch, from, to, rows.length );
                    resolve( rows.map( row => new Note( row ) ) );
                }
            );
        } );
    }
}