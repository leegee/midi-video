const chai = require("chai");
const expect = chai.expect;

const Note = require("./Note.mjs").verbose();

describe('Note', () => {
    it('saves to memory db', async () => {
        expect(Note.dbh).to.not.be.null;
        expect(Note.statements.insert).to.be.undefined;
        Note.init();
        expect(Note.ready).to.be.ok;

        const note = new Note({
            startSeconds: 0,
            endSeconds: 2.999999,
            pitch: 77,
            channel: 0,
            track: 0
        });

        note.save();

        const notes = await Note.readRange(0, 3);
        expect(notes.length).to.equal(1);
    });

});

