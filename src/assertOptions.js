export default ( options, requiredArgs ) => {
    let errMsgs = [];
    for ( const key of Object.keys( requiredArgs ) ) {
        if ( typeof options[ key ] === 'undefined' ) {
            errMsgs.push( key + ': ' + requiredArgs[ key ] );
        }
    }

    if ( errMsgs.length ) {
        console.error( '\nSupplied options: ', options );
        throw new TypeError(
            'Missing argument' + ( errMsgs.length > 1 ? 's' : '' ) + ':\n\t' + errMsgs.join( '\n\t' )
        );
    }
};
