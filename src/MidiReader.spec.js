const path = require('path');
const chai = require("chai");
const expect = chai.expect;

const MidiReader = require("./MidiReader.mjs");

describe('MidiReader', () => {
    
    it('reads MIDI', () => {
        const reader = new MidiReader({
            filepath: path.resolve('fixtures/boo.mid'),
            bpm: 107,
            verbose: false
        });
        expect(reader).to.be.an.instanceOf(MidiReader);
        expect(reader.totalMidiDurationInSeconds).to.equal(
            20.116822429906556
        );
    });

});

