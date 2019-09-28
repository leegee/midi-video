const path = require('path');
const chai = require("chai");
const expect = chai.expect;

const MidiFile = require("./MidiFile.mjs");
const Note = require("./Note.mjs");

describe('MidiFile', function () {
    this.timeout(1000 * 1000);

    beforeEach(() => {
        Note.reset();
    });

    it('accepts a sole arg', async () => {
        const midiReader = new MidiFile(path.resolve('fixtures/4bars.mid'));
        expect(midiReader).to.be.an.instanceOf(MidiFile);
    });

    it('reads simple MIDI', async () => {
        const midiReader = new MidiFile({
            midipath: path.resolve('fixtures/one.mid'),
            debug: false
        });
        expect(midiReader).to.be.an.instanceOf(MidiFile);

        await midiReader.parse();

        expect(midiReader.tracks.length).to.equal(1);

        expect(midiReader.tracks[0].name).to.equal('Polysynth');

        expect(midiReader.durationSeconds).to.be.greaterThan(2.389);
        expect(midiReader.durationSeconds).to.be.lessThan(2.42);

        expect(Note.ready).to.be.ok;
        const notes = await Note.readRange(0, 3);
        expect(notes.length).to.equal(1);
    });

    xit('reads real world MIDI', async () => {
        const midiReader = new MidiFile({
            midipath: path.resolve('fixtures/symphony_9_2_(c)cvikl.mid'),
            logging: false,
            debug: false
        });
        expect(midiReader).to.be.an.instanceOf(MidiFile);

        await midiReader.parse();

        expect(midiReader.tracks.length).to.equal(1);

        expect(Note.ready).to.be.ok;
        const notes = await Note.readRange(0, 3);
        expect(notes.length).to.equal(68);
    });


    it('has a good test file', async () => {
        const midiReader = new MidiFile({
            midipath: path.resolve('fixtures/4bars.mid')
        });
        await midiReader.parse();

        const notes = await Note.readRange(0, 99);

        const uniqueNotes = notes.reduce((acc, note) => {
            acc.includes(note.pitch) ? acc : acc.push(note.pitch);
            return acc;
        }, []);

        expect(uniqueNotes).to.deep.equal([
            63, 39, 65, 41, 66, 42, 68, 44, 70, 46, 72, 48, 73, 49, 75,
            51, 77, 53, 78, 54, 80, 56, 82, 58, 84, 60, 85, 61, 97, 87, 37
        ]);
    });

    it('quantizes pitch', async () => {
        const midiReader = new MidiFile({
            midipath: path.resolve('fixtures/4bars.mid'),
            quantizePitchBucketSize: 12
        });
        await midiReader.parse();

        const notes = await Note.readRange(0, 99);

        const uniqueNotes = notes.reduce((acc, note) => {
            acc.includes(note.pitch) ? acc : acc.push(note.pitch);
            return acc;
        }, []);

        expect(uniqueNotes).to.deep.equal(
            [6, 4, 7, 5, 8, 9]
        );
    });

    it('quantizes pitch', async () => {
        const midiReader = new MidiFile(
            'fixtures/berlin/49_MOD-IrvgB What ll I Do (1924) cb Irving Berlin pb Adam Carroll [204871].mid',
        );
        midiReader.verbose();
        await midiReader.parse();
    });
});

