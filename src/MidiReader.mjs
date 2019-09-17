const MidiPlayer = require('midi-player-js');

module.exports = class {
    options = {};
    constructor(options = {}) {
        this.options = Object.assign({}, this.options, options);
        this.player = new MidiPlayer.Player();
        this.player.loadFile(options.filepath);

        this.player.on('fileLoaded', () => {
        });

        this.player.on('playing', (currentTick) => {
        });

        this.player.on('midiEvent', (event) => {
        });

        this.player.on('endOfFile', () => {
        });

        this.player.play();
    }
}