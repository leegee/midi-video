const sqlite3 = require('sqlite3').verbose();
const md5 = require('md5');

module.exports = class Note {
    static ready = false;
    static dbFields = [
        'startSeconds', 'endSeconds', 'pitch', 'velocity', 'channel', 'track',
        'md5',
        'x', 'y', 'width', 'height', 'colour'
    ];
    static statements = {
        insert: undefined,
        readRange: undefined,
        update: undefined,
        getUnison: undefined,
    };
    static dbh = new sqlite3.Database(':memory:');
    static log = () => { }
    static debug = () => { }

    static logging() {
        Note.log = console.log;
        Note.debug = console.debug;
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

        this.log = options.logging ? console.log : Note.log;

        let scheme = 'CREATE TABLE notes (\n'
            + Note.dbFields
                .map(field => '\t' + field + (
                    field.match(/seconds/i) ? ' DECIMAL' :
                        field.match(/(pitch|velocity)/i) ? ' INTEGER' : ' TEXT'
                ))
                .join(',\n')
            + '\n)';

        await Note.dbh.serialize(() => {
            Note.dbh.run('DROP TABLE IF EXISTS notes');
            Note.dbh.run(scheme);
            Note.statements.insert = Note.dbh.prepare(
                'INSERT INTO notes ('
                + Note.dbFields.join(', ')
                + ') VALUES ('
                + new Array(Note.dbFields.length).fill('?').join(',')
                + ')'
            );
            Note.statements.readRange = Note.dbh.prepare(
                'SELECT * FROM notes WHERE startSeconds BETWEEN ? and ?'
            );
            Note.statements.update = Note.dbh.prepare(
                'UPDATE notes SET (x, y, width, height, colour) = (?, ?, ?, ?, ?) WHERE md5 = ?'
            );
            Note.statements.getUnison = Note.dbh.prepare(
                'SELECT * FROM notes WHERE startSeconds BETWEEN ? and ? AND endSeconds BETWEEN ? and ? AND pitch = ?'
            );
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

        Note.debug('Note.readRange from %d to %d', from, to);

        return new Promise((resolve, reject) => {
            const rows = [];
            Note.dbh.serialize(() => {
                Note.statements.readRange.each(from, to).each(
                    (err, row) => err ? console.error(err) && reject(err) : rows.push(row),
                    () => {
                        Note.log('readRange from %d to %d: %d results', from, to, rows.length);
                        resolve(rows.map(row => new Note(row)));
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

    update() {
        Note.debug('Note.update', this);
        if (Number(this.x) === NaN) {
            throw new TypeError('x is NaN');
        }
        Note.dbh.serialize(() => {
            Note.statements.update.run(
                this.x, this.y, this.width, this.height, this.colour
            );
            Note.debug('Note.update ran: ', this.x, this.y, this.width, this.height, this.colour);
        });
    }

    getUnisonNotes(pitch, from, to) {
        const rows = [];
        Note.dbh.serialize(() => {
            Note.statements.getUnison.each(from, to, from, to, pitch).each(
                (err, row) => err ? console.error(err) && reject(err) : rows.push(row),
                () => {
                    Note.log('getUnisonNotes at pitch %d from %d to %d: %d results', pitch, from, to, rows.length);
                    resolve(rows.map(row => new Note(row)));
                }
            );

        });
    }

}

