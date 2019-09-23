const sqlite3 = require('sqlite3').verbose();
const md5 = require('md5');

module.exports = class Note {
    static ready = false;
    static dbFields = ['startSeconds', 'endSeconds', 'pitch', 'velocity', 'channel', 'track', 'md5'];
    static statements = {
        insert: undefined,
        readRange: undefined
    };
    static dbh = new sqlite3.Database(':memory:');
    static log = () => { }

    static verbose() {
        Note.log = console.log;
        return Note;
    }

    static async reset(options = {}) {
        Note.ready = false;
        Note.init(options);
    }

    static async init(options = {}) {
        if (Note.ready) {
            return;
        }

        this.log = options.verbose ? console.log : Note.log;

        let scheme = 'CREATE TABLE notes (\n'
            + Note.dbFields
                .map(field => '\t' + field + (
                    field.match(/seconds/i) ? ' DECIMAL' :
                        field.match(/(pitch|velocity)/i) ? ' INTEGER' : ' TEXT'
                ))
                .join(',\n')
            + '\n)';

        let insert = 'INSERT INTO notes ('
            + Note.dbFields.join(', ')
            + ') VALUES ('
            + new Array(Note.dbFields.length).fill('?').join(',')
            + ')';

        let readRange = 'SELECT * FROM notes WHERE startSeconds BETWEEN ? and ?';

        await Note.dbh.serialize(() => {
            Note.dbh.run('DROP TABLE IF EXISTS notes');
            Note.dbh.run(scheme);
            Note.statements.insert = Note.dbh.prepare(insert);
            Note.statements.readRange = Note.dbh.prepare(readRange);
        });

        Note.ready = true;
    }

    static readRange(from, to) {
        if (from < 0) {
            from = 0;
        }
        if (to < 0) {
            to = 0;
        }
        return new Promise((resolve, reject) => {
            const rows = [];
            Note.dbh.serialize(() => {
                Note.statements.readRange.each(from, to).each(
                    (err, row) => err ? reject(err) : rows.push(row),
                    () => {
                        this.log('readRange from %d to %d: %d results', from, to, rows.length);
                        resolve(rows)
                    }
                );
            });
        });
    }

    constructor(options) {
        Note.dbFields.forEach(_ => this[_] = options[_]);
        this.md5 = md5(
            Note.dbFields.map(_ => options[_])
        );
    }

    save() {
        const values = [];
        Note.dbFields.forEach(_ => values.push(this[_]));
        Note.dbh.serialize(() => {
            Note.statements.insert.run(values);
        });
    }

}

