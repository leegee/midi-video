const sqlite3 = require('sqlite3').verbose();

module.exports = class Note {
    static ready = false;
    static dbFields = ['startSeconds', 'endSeconds', 'pitch', 'channel', 'track'];
    static statements = {
        insert: undefined,
        readRange: undefined
    };
    static dbh = new sqlite3.Database(':memory:');
    static log = () => { }
    // fields = Note.dbFields.reduce((acc, key) => ({ ...acc, [key]: undefined }), {});

    static verbose() {
        Note.log = console.log;
        return Note;
    }

    static async init() {
        if (Note.ready) {
            return;
        }
        let scheme = 'CREATE TABLE notes (\n'
            + Note.dbFields
                .map(field => '\t' + field + ' TEXT')
                .join(',\n')
            + '\n)';

        let insert = 'INSERT INTO notes ('
            + Note.dbFields.join(', ')
            + ') VALUES ('
            + new Array(Note.dbFields.length).fill('?').join(',')
            + ')';

        let readRange = 'SELECT * FROM notes WHERE startSeconds BETWEEN ? and ?';

        Note.log(scheme);
        Note.log(insert);
        Note.log(readRange);

        await Note.dbh.serialize(() => {
            Note.dbh.run(scheme);
            Note.statements.insert = Note.dbh.prepare(insert);
            Note.statements.readRange = Note.dbh.prepare(readRange);
        });

        Note.ready = true;
    }

    static readRange(from, to) {
        return new Promise((resolve, reject) => {
            const rows = [];
            Note.dbh.serialize(() => {
                Note.statements.readRange.each(from, to).each(
                    (err, row) => err ? reject(err) : rows.push(row),
                    () => resolve(rows)
                );
            });
        });
    }

    constructor(options) {
        Note.dbFields.forEach(_ => this[_] = options[_]);
    }

    save() {
        const values = [];
        Note.dbFields.forEach(_ => values.push(this[_]));
        Note.dbh.serialize(() => {
            Note.statements.insert.run(values);
        });
    }


}

