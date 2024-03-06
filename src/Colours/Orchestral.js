import ImageMaker from '../ImageMaker.js';

const sortNames = [
    'Flauti',
    'Oboi',
    'Clarinetti',
    'Fagotti',
    'Corni ',
    'Corni',
    'Trombe',
    'Tromboni',
    'Trombono Basso',
    'Timpani',
    'Violini I',
    'Violini II',
    'Viole',
    'Violoncelli',
    'Contrabassi',
]

const manualColours = {
    'Flauti': 60,
    'Oboi': 90,
    'Clarinetti': 90,
    'Fagotti': 300,
    'Corni ': 120,
    'Corni': 150,
    'Trombe': 180,
    'Tromboni': 210,
    'Trombono Basso': 240,
    'Timpani': 280,
    'Violini I': 63,
    'Violini II': 66,
    'Viole': 60,
    'Violoncelli': 30,
    'Contrabassi': 7,
};


export default ImageMaker.createColourMap( sortNames );

