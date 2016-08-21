'use strict';

let check = (v, type, name) => {
    if (!type(v)) {
        throw new TypeError('Expect type ' + name + '. but got ' + v);
    }
    return true;
};

let isArray = v => v && typeof v === 'object' &&
    typeof v.length === 'number';

let isObject = v => v && typeof v === 'object';

let notEmptyString = v => v && typeof v === 'string';

let isRegular = v => v && v instanceof RegExp;

module.exports = {
    check,
    isArray,
    isObject,
    notEmptyString,
    isRegular
};
