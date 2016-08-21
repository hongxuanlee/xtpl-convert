'use strict';

let util = require('./util');
let fetch = require('./fetch');
let fetchToken = fetch.fetchToken;

let check = util.check;
let isArray = util.isArray;
let notEmptyString = util.notEmptyString;
let isObject = util.isObject;
let isRegular = util.isRegular;

/**
 * token
 *     type
 *     lexicon
 *
 * token_class <array>
 *           type
 *           regular
 *
 *      [{
 *           type: 'identify',
 *           regular: /[a-zA-Z]+/
 *       }, {
 *           type: 'number',
 *           regular: /[0-9]+/
 *       }, {
 *           type: 'whitespace',
 *           regular: /\s+/
 *       }]
 */
let lookAheads = (token_class, txt, steps, filter) => {
    steps = steps || 1;
    let source = txt;
    let results = [];
    for (let i = 0; i < steps; i++) {
        if (!source) return results;
        let arr = fetchToken(token_class, source);
        source = arr.next;
        if (typeof filter === 'function') {
            if (filter(arr.token)) {
                results.push(arr.token);
            } else {
                i--;
            }
        } else {
            results.push(arr.token);
        }
    }
    return results;
};

/**
 *
 * ## test
 * [
 *      [[[]], true],
 *      [[[{type: 'identity', regular: /[a-z]+/}]], true],
 *      [[[{}]], new Error("Expect type not empty string. but got undefined")]
 * ]
 */
let validate = (token_class) => {
    check(token_class, isArray, 'array');
    for (let i = 0; i < token_class.length; i++) {
        let item = token_class[i];
        check(item, isObject, 'object');
        check(item.type, notEmptyString, 'not empty string');
        if (item.type === 'error_type') {
            throw new TypeError('type can not be error_type, which is reserved word.');
        }
        check(item.regular, isRegular, 'regular');
    }
    return true;
};

let defError = (error) => {
    throw new Error('unExpected token ' + error.lexicon);
};

let isErrorToken = (token) => token.type === 'error_type';

module.exports = (token_class) => {
    token_class = token_class || [];
    validate(token_class);
    let spliter = (txt, error) => {
        if (error === undefined) {
            error = defError;
        } else if (error === null) {
            error = null;
        }
        let next = () => {
            if (!txt) return null;
            let arr = fetchToken(token_class, txt);
            txt = arr.next;
            let token = arr.token;
            if (isErrorToken(token)) {
                error && error(token);
            }
            return token;
        };
        return {
            next,
            isEmpty: () => !txt,
            lookAheads: (steps, filter) => lookAheads(token_class, txt, steps, filter),
            lookAhead: () => lookAheads(token_class, txt)[0]
        };
    };

    return spliter;
};
