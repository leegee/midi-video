## Completed so far

* An object to render video via ffmpeg.
* An object to interpret  MIDI files using `midi-parser-js`.
* An object to store and render via `node-canvas` currently sounding notes.
* An object to integrate the above

## Yet to do

* Check highlightCurrent sizes do not conflict with small note heights
* Fix layout bug (extra note lane at top) ?
* Aftertouch, controllers (breath, expression)
* Time signature change

## Notes

Bitwig only exports 16 channels of MIDI (good) but gives each one a track (bad).

## Bibliography

* http://www.kunstderfuge.com/beethoven/variae.htm#Symphonies

* https://github.com/colxi/midi-parser-js/wiki/MIDI-File-Format-Specifications
  
* http://midi.teragonaudio.com/tech/midifile/ppqn.htm