import fs from 'fs';
import MidiParser from 'midi-parser-js';
import Decimal from 'decimal.js';

import appLogger from './appLogger.js';
import Note from './Note.js';
import assertOptions from './assertOptions.js';

export default class MidiFile {
	static logging = false;
	static NOTE_ON = 9;
	static NOTE_OFF = 8;
	static META = 255;
	static MS_PER_BEAT = 81;
	static SIXTY_MILLION = new Decimal( 60000000 );
	static SIXTY = new Decimal( 60 );
	static INIT_RANGES = {
		pitch: {
			hi: 0,
			lo: 127
		},
		velocity: {
			hi: 0,
			lo: 127
		}
	};

	options = {
		midipath: null,
		quantizePitchBucketSize: false, // Or int
		scaleLuminosity: true,
		defaultLuminosity: 50,
		colour: {
			minLuminosityPc: undefined,
			maxLuminosityPc: undefined
		}
	};
	tracks = [];
	durationSeconds = null;
	ranges = MidiFile.INIT_RANGES;

	constructor ( options = {} ) {
		if ( typeof options === 'string' ) {
			options = {
				midipath: options
			};
		}
		this.options = Object.assign( {}, this.options, options );
		this.options.logger = appLogger;

		assertOptions( this.options, {
			midipath: 'string for input path',
			quantizePitchBucketSize: 'integer bucket size for quantizing pitch',
			colour: {
				minLuminosityPc: 'Number, 0-100',
				maxLuminosityPc: 'Number, 0-100',
				defaultLuminosity: 'Number, 0-100'
			}
		} );

		this.options.logger.debug( 'Logging...' );
		this.options.logger.verbose( 'Debugging...' );
	}

	ticksToSeconds ( delta ) {
		return delta * this.timeFactor;
	}

	async parse () {
		this.options.logger.info( 'MidiFile.parse Beginning' );
		await Note.init();
		this.ranges = MidiFile.INIT_RANGES;
		let longestTrackDurationSeconds = 0;

		const midi = MidiParser.parse( fs.readFileSync( this.options.midipath ) );
		const midiTimeDivision = new Decimal( midi.timeDivision );

		this.options.logger.verbose( 'MIDI.timeDivision: %d', midiTimeDivision );

		for ( let trackNumber = 0; trackNumber < midi.tracks; trackNumber++ ) {
			let durationSeconds = 0;
			let currentTick = 0;
			let playingNotes = {};
			let totalNotesOn = 0;
			let totalNotesOff = 0;

			this.tracks.push( {
				notes: [],
				name: 'Track ' + trackNumber,
				number: trackNumber
			} );

			for ( const event of midi.track[ trackNumber ].event ) {
				this.options.logger.silly( trackNumber, 'EVENT', event );
				currentTick += event.deltaTime;

				if ( event.type === MidiFile.META ) {
					if ( event.metaType === MidiFile.MS_PER_BEAT ) {
						const eventData = new Decimal( event.data )
						this.bpm = MidiFile.SIXTY_MILLION.dividedBy( eventData );
						this.timeFactor = MidiFile.SIXTY.dividedBy( this.bpm.times( midiTimeDivision ) );
						this.options.logger.debug( 'TEMPO CHANGE %d BPM %d timeFactor', event.data, this.bpm, this.timeFactor );
					} else if ( event.metaType === 3 ) {
						this.tracks[ this.tracks.length - 1 ].name = event.data;
						this.options.logger.verbose( 'Parsing track number %d named %s', trackNumber, event.data );
					}
				} else {
					if ( event.type === MidiFile.NOTE_ON ) {
						if ( event.data[ 1 ] === 0 ) { // No velocity === silence note
							event.type = MidiFile.NOTE_OFF;
							this.options.logger.verbose( 'ZERO VELOCITY NOTE ON === NOTE OFF' );
						} else {
							totalNotesOn++;
							playingNotes[ event.data[ 0 ] ] = {
								startTick: currentTick,
								velocity: event.data[ 1 ]
							};
							this._setPitchRange( event.data[ 0 ] );
							if ( !this.ranges.velocity.hi || event.data[ 1 ] > this.ranges.velocity.hi ) {
								this.ranges.velocity.hi = event.data[ 1 ];
							}
							if ( !this.ranges.velocity.lo || event.data[ 1 ] < this.ranges.velocity.lo ) {
								this.ranges.velocity.lo = event.data[ 1 ];
							}
						}
					}

					if ( event.type === MidiFile.NOTE_OFF ) {
						totalNotesOff++;
						let note;
						try {
							note = new Note( {
								channel: event.channel,
								track: trackNumber,
								pitch: event.data[ 0 ],
								velocity: playingNotes[ event.data[ 0 ] ].velocity,
								startTick: playingNotes[ event.data[ 0 ] ].startTick,
								endTick: currentTick,
								startSeconds: this.ticksToSeconds( playingNotes[ event.data[ 0 ] ].startTick ),
								endSeconds: this.ticksToSeconds( currentTick )
							} );
							this.tracks[ trackNumber ].notes.push( note );
							delete playingNotes[ event.data[ 0 ] ];
						} catch ( e ) {
							this.options.logger.error( 'Error. playingNotes: ', playingNotes );
							this.options.logger.error( 'info', {
								endTick: currentTick,
								endSeconds: this.ticksToSeconds( currentTick ),
								channel: event.channel,
								track: trackNumber,
								pitch: event.data[ 0 ]
							} );
						}
					}
				}
			}

			durationSeconds += this.ticksToSeconds( currentTick );

			if ( durationSeconds > longestTrackDurationSeconds ) {
				longestTrackDurationSeconds = durationSeconds;
			}

			this.options.logger.debug( 'Track %d %s completed with %d notes, %d ticks = %d seconds',
				trackNumber, this.tracks[ trackNumber ].name, this.tracks[ trackNumber ].notes.length,
				currentTick, durationSeconds
			);
			this.options.logger.debug( 'Time factor %d, bpm %d', this.timeFactor, this.bpm );
			this.options.logger.debug( 'Total notes on: ', totalNotesOn );
			this.options.logger.debug( 'Total notes off: ', totalNotesOff );
		}

		this.tracks = this.tracks.filter( track => track.notes.length > 0 );
		this.durationSeconds = longestTrackDurationSeconds;

		this.options.logger.info( 'MidiFile.parse populated %d tracks, leaving.', this.tracks.length );
		this.options.logger.debug( 'MidiFile.parse found initial ranges: ', this.ranges );

		let notes = {};

		if ( this.options.remapPitches ) {
			this.ranges.pitch.hi = 0;
			this.ranges.pitch.lo = 127;
			for ( const track of this.tracks ) {
				for ( const note of track.notes ) {
					if ( typeof this.options.remapPitches[ note.pitch ] === 'undefined' ) {
						throw new RangeError( 'options.remapPitches was supplied but found unmapped pitch, ' + note.pitch );
					} else {
						// const old = note.pitch;
						note.pitch = this.options.remapPitches[ note.pitch ];
						// this.options.logger.silly('REMAP %d to %d', old, note.pitch);
						this._setPitchRange( note.pitch );
					}

					notes[ note.pitch ]++;
				};
			}

			this.options.logger.debug( 'Notes used after remap: ', Object.keys( notes ).sort() );
			notes = {};
		}


		for ( const track of this.tracks ) {
			for ( const note of track.notes ) {
				if ( this.options.fitNotesToScreen ) {
					note.pitch = note.pitch - this.ranges.pitch.lo + 1;
					// this.options.logger.silly('fitNotesToScreen made  pitch %d after - %d +1', note.pitch, this.ranges.pitch.lo);
				}

				if ( this.options.quantizePitchBucketSize ) {
					note.pitch = this.quantizePitch( note.pitch );
					// this.options.logger.silly('Quantized pitch is ', note.pitch);
				}

				if ( this.options.scaleLuminosity && this.ranges.velocity.hi !== this.ranges.velocity.lo ) {
					note.luminosity =
						( this.options.colour.maxLuminosityPc - this.options.colour.minLuminosityPc )
						* ( note.velocity - this.ranges.velocity.lo )
						/ ( this.ranges.velocity.hi - this.ranges.velocity.lo )
						+ this.options.colour.minLuminosityPc;
				} else {
					note.luminosity = this.options.defaultLuminosity;
				}

				await note.save();
				notes[ note.pitch ]++;
			}
		}

		if ( this.options.fitNotesToScreen ) {
			this.options.midiNoteRange = this.ranges.pitch.hi - this.ranges.pitch.lo;
			this.options.logger.debug( 'MidiFile.fitNotesToScreen: new MIDI new range: %d (ie %d - %d)',
				this.options.midiNoteRange, this.ranges.pitch.hi, this.ranges.pitch.lo
			);
		}

		this.options.logger.debug( 'Final list of notes used: ', Object.keys( notes ).sort() );
		return this.options.midiNoteRange;
	}

	_setPitchRange ( pitch ) {
		if ( pitch > this.ranges.pitch.hi ) {
			this.ranges.pitch.hi = pitch;
		}
		if ( pitch < this.ranges.pitch.lo ) {
			this.ranges.pitch.lo = pitch;
		}
	}

	fitNoteHues ( noteHues ) {
		if ( this.options.fitNotesToScreen && noteHues ) {
			const replacement = {};
			for ( const pitch of Object.keys( noteHues ) ) {
				replacement[ pitch - this.ranges.pitch.lo ] = noteHues[ pitch ]
			}
			this.options.logger.silly( 'New noteHue map: ', replacement );
			return replacement;
		}
		return noteHues;
	}

	mapTrackNames2Hues ( trackHues, defaultHue ) {
		const mapped = [];
		let i = 0;

		for ( const track of this.tracks ) {
			if ( trackHues instanceof Object && trackHues[ track.name ] ) {
				mapped.push( trackHues[ track.name ] );
				this.options.logger.debug( 'Made trackHues for track %d, named "%s": ', track.number, track.name, trackHues[ track.name ] )
			} else if ( trackHues instanceof Array ) {
				mapped.push( trackHues[ i++ ] );
			} else {
				this.options.logger.warn( 'Missing trackHues for track %d, named "%s"!', track.number, track.name )
				mapped.push( defaultHue );
			}
		}

		return mapped;
	}

	quantizePitch ( pitch ) {
		let bucketNumber = Math.ceil( pitch / this.options.quantizePitchBucketSize );
		// let rv = pitch % this.options.quantizePitchBucketSize;
		// if (rv == 0) {
		//     rv = this.options.quantizePitchBucketSize;
		// }
		return bucketNumber;
	}
}