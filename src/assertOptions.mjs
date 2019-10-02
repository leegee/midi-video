module.exports = ( options, requiredArgs ) => {
    let errMsgs = [];
    Object.keys( requiredArgs ).forEach( key => {
        if ( typeof options[ key ] === 'undefined' ) {
            errMsgs.push( key + ': ' + requiredArgs[ key ] );
        }
        // else {
        //     this.logger.debug('yes, key = %s; value =', key, options[key]);
        // }
    } );
    if ( errMsgs.length ) {
        console.error( '\nSupplied options: ', options );
        throw new TypeError(
            'Missing argument' + ( errMsgs.length > 1 ? 's' : '' ) + ':\n\t' + errMsgs.join( '\n\t' )
        );
    }
};
