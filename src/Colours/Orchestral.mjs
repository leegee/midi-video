
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
    'Flauti': 'hsl(60, 77%, 63%)',
    'Oboi': 'hsl(90, 77%, 33%)',
    'Clarinetti': 'hsl(90, 77%, 43%)',
    'Fagotti': 'hsl(300, 77%, 83%)',
    'Corni ': 'hsl(120, 77%, 43%)',
    'Corni': 'hsl(150, 77%, 43%)',
    'Trombe': 'hsl(180, 77%, 43%)',
    'Tromboni': 'hsl(210, 77%, 43%)',
    'Trombono Basso': 'hsl(240, 77%, 43%)',
    'Timpani': 'hsl(280, 77%, 43%)',
    'Violini I': 'hsl(63, 77%, 53%)',
    'Violini II': 'hsl(66, 77%, 63%)',
    'Viole': 'hsl(60, 77%, 33%)',
    'Violoncelli': 'hsl(30, 77%, 43%)',
    'Contrabassi': 'hsl(7, 77%, 43%)'
};

module.exports = sortNames.reduce(
    (acc, i, index) => ({ ...acc, [i]: ['hsl(', ((360 / sortNames.length + 1) * index), ', 77%, 43%'].join('') }),
    {}
)
