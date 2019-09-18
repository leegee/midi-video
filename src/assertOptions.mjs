module.exports = (options, requiredArgs) => {
    let errMsgs = [];
    Object.keys(requiredArgs).forEach(key => {
        if (typeof options[key] === undefined) {
            errMsgs.push(requiredArgs[key]);
        }
    });
    if (errMsgs.length) {
        console.error('\nSupplied options: ', options);
        throw new TypeError(
            'Missing argument' + (errMsgs.length > 1 ? 's' : '') + ':\n' + errMsgs.join('\n\t')
        );
    }
};
