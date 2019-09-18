module.exports = class Note {
    constructor(options) {
        ['channel', 'pitch', 'startTick', 'endTick'].forEach(_ => this[_] = options[_]);
    }
}
