# Synopsis

    const App = require('./src');

    const app = new App(
        'fixtures/4bars-60bpm.mid'
    ); // src contains more options

    app.init().then(() => {
        return app.integrate();
    }).then(() => {
        console.log('Wrote ', app.options.outputpath);
    }).catch(err => {
        console.error(err);
    })

## Constructor Options

    * `logging`: `false`
    * `midipath`: text
    * `outputpath`: 'output.mp4',
    * `width`: 1920
    * `height`: 1080
    * `fps`: 30
    * `fitNotesToScreen`: true
    * `beatsOnScreen`: 12
    * `defaultHue`: 100 - default HSL hue value for tracks otherwise uncoloured
    * `trackHues`: if supplied, should be an object mapping the MIDI track names to HSL hue values.

# Status

## Completed so far

* An object to render video via `ffmpeg`.
* An object to interpret  MIDI files using `midi-parser-js`.
* An object to store and render via `node-canvas`
* An object to integrate the above
* Highlight currently sounding notes
* Scale used notes to fill screen
* Quantize pitch
* Colour by track and velocity
* Process tempo changes
* Visually represent multiple voicings of the same pitch

## Yet to do

* `assertOptions` to take objects
* Fix layout bug (extra note lane at top) ?
* Double height notes offset by 50% of height
* Check `highlightCurrent` sizes do not conflict with small note heights
* Transient annotation
* Synchronise transients to transient file
* Aftertouch, controllers (breath, expression)
* Fractional pitches

## Notes

Bitwig only exports 16 channels of MIDI (good) but gives each one a track (bad).

## Bibliography

* http://www.kunstderfuge.com/beethoven/variae.htm#Symphonies

* https://github.com/colxi/midi-parser-js/wiki/MIDI-File-Format-Specifications
  
* http://midi.teragonaudio.com/tech/midifile/ppqn.htm

* http://www.kuhmann.com/Yamaha.htm