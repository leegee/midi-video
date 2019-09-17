const chai = require("chai");
const expect = chai.expect;

const MidiReader = require("./MidiReader.mjs");

describe('MidiReader', () => {
    
    it('reads MIDI', () => {
        const reader = new MidiReader({
            filepath: '../fixtures/boo.mid'
        });
        expect(reader).to.be.an.instanceOf(MidiReader);
    });

});

