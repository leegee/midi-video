const path = require('path');
const chai = require("chai");
const expect = chai.expect;

const MidiFile = require("./MidiFile.mjs");
const Note = require("./Note.mjs").verbose();

describe('MidiFile', () => {
    
    it('reads MIDI', () => {
        const reader = new MidiFile({
            filepath: path.resolve('fixtures/one.mid'),
            bpm: 100,
            verbose: true
        });
        expect(reader).to.be.an.instanceOf(MidiFile);

        expect(reader.timeSignature).to.equal(4);
        expect(reader.tracks.length).to.equal(1);
        expect(reader.tracks[0].name).to.equal('Polysynth');

        expect(reader.totalMidiDurationInSeconds).to.be.greaterThan(
            2.389
        );
        expect(reader.totalMidiDurationInSeconds).to.be.lessThan(
            2.42
        );

        expect(Note.ready).to.be.ok;
        const notes = await Note.readRange(0, 3);
        expect(notes.length).to.equal(1);

    });

});

