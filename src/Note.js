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

    static async readRange ( from, to ) {
        Note.logger.silly( 'Note.readRange from %d to %d', from, to );

        if ( from < 0 ) {
            from = 0;
        }
        if ( to < 0 ) {
            to = 0;
        }

        return await new Promise( ( resolve, reject ) => {
            Note.dbh.all( 'SELECT * FROM notes WHERE startSeconds BETWEEN ? AND ?', [ from, to ], ( err, rows ) => {
                if ( err ) {
                    Note.logger.error( 'Note.readRange error ' + err );
                    reject( err );
                } else {
                    resolve( rows );
                }
            } );
        } );
    }

    static assertValues ( note ) {
        let errMsgs = [];

        if ( isNaN( Number( note.x ) ) ) {
            errMsgs.push( 'x is NaN: ' + note.x );
        }
        if ( isNaN( Number( note.y ) ) ) {
            errMsgs.push( 'y is NaN ' + note.y );
        }
        if ( Number( note.y ) < 0 ) {
            errMsgs.push( 'y is negative: ' + note.y );
        }
        if ( Number( note.pitch ) < 0 || Number( note.pitch ) > 126 ) {
            errMsgs.push( 'pitch out of range 1-126: ' + note.pitch );
        }

        if ( errMsgs.length ) {
            this.options.logger.error( 'Bad note: ', note );
            this.options.logger.error( errMsgs.join( "\n" ) );
            throw new TypeError(
                'Error' + ( errMsgs.length > 1 ? 's' : '' ) + ':\n\t' + errMsgs.join( '\n\t' )
            );
        }
    }


    constructor ( options ) {
        for ( const _ of Note.dbFields ) {
            this[ _ ] = options[ _ ];
        }
        this.md5 = md5(
            Note.dbFields.map( _ => options[ _ ] )
        );
    }

    async save () {
        Note.assertValues( this );
        const values = Note.dbFields.map( field => this[ field ] );
        Note.logger.silly( 'Note.save ', Note.statements.insert, values );

        await new Promise( ( resolve, reject ) => {
            Note.dbh.serialize( () => {
                Note.statements.insert.run( values, error => {
                    if ( error ) {
                        Note.logger.error( 'Error occurred while saving note:', error );
                        reject( error );
                    } else {
                        resolve();
                    }
                } );
            } );
        } );
    }

    async updatePitch ( newPitch ) {
        this.options.logger.silly( 'Note.updatePitch', this, newPitch );
        this.pitch = newPitch;

        if ( isNaN( Number( this.pitch ) ) ) {
            throw new TypeError( 'pitch is NaN' );
        }
        if ( !this.md5 ) {
            throw new TypeError( 'No md5?' );
        }

        try {
            await new Promise( ( resolve, reject ) => {
                Note.dbh.serialize( () => {
                    Note.statements.updatePitch.run( this.pitch, this.md5, error => {
                        if ( error ) {
                            reject( error );
                        } else {
                            this.options.logger.silly( 'Note.updatePitch ran: ', this.pitch );
                            resolve();
                        }
                    } );
                } );
            } );
        } catch ( error ) {
            this.options.logger.error( 'Error occurred while updating pitch:', error );
            throw error; // Re-throw the error to propagate it to the caller
        }
    }

    async updateForDisplay () {
        Note.logger.silly( 'Note.updateForDisplay', this );
        Note.assertValues( this );

        try {
            await new Promise( ( resolve, reject ) => {
                Note.dbh.serialize( () => {
                    Note.statements.updateForDisplay.run(
                        this.x, this.y, this.width, this.height, this.colour,
                        error => {
                            if ( error ) {
                                reject( error );
                            } else {
                                Note.logger.silly( 'Note.updateForDisplay ran: ', this.x, this.y, this.width, this.height, this.colour );
                                resolve();
                            }
                        }
                    );
                } );
            } );
        } catch ( error ) {
            Note.logger.error( 'Error occurred while updating display:', error );
            throw error; // Re-throw the error to propagate it to the caller
        }
    }

    async getUnisonNotes ( pitch, from, to ) {
        return new Promise( ( resolve, reject ) => {
            const rows = [];
            Note.statements.getUnison.each( from, to, from, to, pitch, ( err, row ) => {
                if ( err ) {
                    this.options.logger.error( err );
                    reject( err );
                } else {
                    rows.push( row );
                }
            }, () => {
                Note.logger.debug( 'getUnisonNotes at pitch %d from %d to %d: %d results', pitch, from, to, rows.length );
                resolve( rows.map( row => new Note( row ) ) );
            } );
        } );
    }

}
