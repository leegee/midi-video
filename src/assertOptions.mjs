module.exports = (requiredArgs) => {
    let errMsgs = [];
    Object.keys(requiredArgs).forEach(key => {
        if (!this.options[key]) {
            errMsgs.push(requiredArgs[key]);
        }
    });
    if (errMsgs.length) {
        throw new TypeError('Missing argument' + (errMsgs.length > 1 ? 's' : '') + ':\n' + errMsgs.join('\n\t'));
    }
}
