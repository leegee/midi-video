const path = require('path');
const chai = require("chai");
const expect = chai.expect;

const MidiFile = require("./MidiFile.mjs");

describe('MidiFile', () => {
    
    it('reads MIDI', () => {
        const reader = new MidiFile({
            filepath: path.resolve('fixtures/one.mid'),
            bpm: 100,
            verbose: true
        });
        expect(reader).to.be.an.instanceOf(MidiFile);
        expect(reader.totalMidiDurationInSeconds).to.be.greaterThan(
            2.389
        );
        expect(reader.totalMidiDurationInSeconds).to.be.lessThan(
            2.42
        );
    });

});

