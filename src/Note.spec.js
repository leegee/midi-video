const chai = require("chai");
const expect = chai.expect;

const Note = require("./Note.mjs"); // .logging();

describe('Note', () => {
    beforeEach(async () => {
        await Note.reset();
    });
    afterEach(async () => {
        await Note.reset();
    });

    it('saves to memory db', async () => {
        expect(Note.dbh).to.not.be.null;
        await Note.init();
        expect(Note.statements.insert).not.to.be.undefined;
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

