const path = require('path');
const chai = require("chai");
const expect = chai.expect;

const MidiFile = require("./MidiFile.mjs");
const Note = require("./Note.mjs");

describe('MidiFile', () => {
    beforeEach( () => {
        Note.reset();
    });

    it('reads simple MIDI', async () => {
        const midiReader = new MidiFile({
            midiFilepath: path.resolve('fixtures/one.mid'),
            bpm: 100,
            verbose: true
        });
        expect(midiReader).to.be.an.instanceOf(MidiFile);

        await midiReader.parse();

        expect(midiReader.timeSignature).to.equal(4);
        expect(midiReader.tracks.length).to.equal(1);
        expect(midiReader.tracks[0].name).to.equal('Polysynth');

        expect(midiReader.durationSeconds).to.be.greaterThan(
            2.389
        );
        expect(midiReader.durationSeconds).to.be.lessThan(
            2.42
        );

        expect(Note.ready).to.be.ok;
        const notes = await Note.readRange(0, 3);
        expect(notes.length).to.equal(1);
    });


    it('reads simple MIDI', async () => {
        const midiReader = new MidiFile({
            midiFilepath: path.resolve('fixtures/one.mid'),
            bpm: 100,
            verbose: true
        });
        expect(midiReader).to.be.an.instanceOf(MidiFile);

        await midiReader.parse();

        expect(midiReader.timeSignature).to.equal(4);
        expect(midiReader.tracks.length).to.equal(1);
        expect(midiReader.tracks[0].name).to.equal('Polysynth');

        expect(midiReader.durationSeconds).to.be.greaterThan(
            2.389
        );
        expect(midiReader.durationSeconds).to.be.lessThan(
            2.42
        );

        expect(Note.ready).to.be.ok;
        const notes = await Note.readRange(0, 3);
        expect(notes.length).to.equal(1);
    });

});

