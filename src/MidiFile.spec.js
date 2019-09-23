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

    it('reads simple MIDI', async () => {
        const midiReader = new MidiFile({
            midiFilepath: path.resolve('fixtures/one.mid'),
            bpm: 60,
            verbose: false
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


    it('reads real world MIDI', async () => {
        const midiReader = new MidiFile({
            midiFilepath: path.resolve('fixtures/symphony_9_2_(c)cvikl.mid'),
            bpm: 100,
            verbose: false,
            debug: true
        });
        expect(midiReader).to.be.an.instanceOf(MidiFile);

        await midiReader.parse();

        expect(midiReader.tracks.length).to.equal(15);
        expect(midiReader.tracks[0].name).to.equal('Flauti');

        expect(midiReader.tracks.map(_ => _.name)).to.deep.equal([
            "Flauti",
            "Oboi",
            "Clarinetti",
            "Fagotti",
            "Corni ",
            "Corni",
            "Trombe",
            "Tromboni",
            "Trombono Basso",
            "Timpani",
            "Violini I",
            "Violini II",
            "Viole",
            "Violoncelli",
            "Contrabassi"
        ]);

        expect(Note.ready).to.be.ok;
        const notes = await Note.readRange(0, 3);
        expect(notes.length).to.equal(30);

    });

});

