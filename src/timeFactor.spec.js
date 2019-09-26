const chai = require("chai");
const expect = chai.expect;

const MidiFile = require("./MidiFile.mjs");

const expectation = 0.0005841121495327102;;

const mf = new MidiFile({
    bpm: 107,
    midiFilepath: 'foo'
})

describe('MidiFile', () => {
    it('timeFactor', async () => {
        expect(
            mf.setTimeFactor(960000)
        ).to.equal(
            expectation
        );

        expect(
            mf.setTimeFactor(560747 * 2)
        ).to.equal(
            expectation
        );
    })
});
