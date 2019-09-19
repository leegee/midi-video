const chai = require("chai");
const expect = chai.expect;

const Note = require("./Note.mjs").verbose();

describe('Note', () => {
    it('inits', async () => {
        expect(Note.dbh).to.not.be.null;
        expect(Note.statements.insert).to.be.undefined;
        Note.init();

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


        // const promiseResolvesWhenFileWritten = integrater.integrate();
        // expect(promiseResolvesWhenFileWritten).to.be.an.instanceOf(Promise);

        // const encoderExitStatus = await promiseResolvesWhenFileWritten;
        // expect(encoderExitStatus).to.equal(0);

        // expect(
        //     path.resolve(integrater.options.outputpath)
        // ).to.be.a.path();
    });

});

