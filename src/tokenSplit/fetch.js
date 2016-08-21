'use strict';

const ERROR_TYPE = 'error_type';

/**
 * get a token from txt
 *
 * 1. get all matches from txt, you may got more than one, because the bunch of token types
 * 2. chose one
 *    (1) long matching principle
 *    (2) first one principle
 *
 * ## test
[
    [
        [
            [{
                type: 'id',
                regular: /[a-zA-Z]+/
            }], '123hello'
        ], {
            token: null,
            next: 'hello',
            error: {
                lexicon: '123'
            }
        }
    ]
]
*/
let fetchToken = (token_class, txt) => {
    let info = findNext(token_class, txt);
    let error = info.error;
    let matches = info.matches;
    let token = null;
    let next = '';
    if (!error) {
        token = choseMatched(matches);
        next = txt.substring(token.lexicon.length);
    } else {
        token = {
            lexicon: error.lexicon,
            type: ERROR_TYPE
        };
        next = txt.substring(error.lexicon.length);
    }
    return {
        token,
        next
    };
};

/**
 * chose one from matches
 *    (1) long matching principle
 *    (2) first one principle
 *
 * ## test
 * [
 *      [[[{type:'a', lexicon: 'aa'}, {type:'b', lexicon: 'bbbb'}]], {type: 'b', lexicon: 'bbbb'}],
 *      [[[{type:'a', lexicon: 'aa'}, {type:'b', lexicon: 'bb'}]], {type: 'a', lexicon: 'aa'}]
 * ]
 */
let choseMatched = (matches) => {
    let token = matches[0];
    for (let i = 1; i < matches.length; i++) {
        // > not >=, because the first one principle
        if (matches[i].lexicon.length > token.lexicon.length) {
            token = matches[i];
        }
    }
    return token;
};

/**
 *  find all matched token, these tokens satisfied:
 *  (i) start from txt
 *  (ii) satisfied one of token_class
 *
 *  ## test
 *
[
    [
        [
            [{
                type: 'identity',
                regular: /[a-z]+/
            }], 'hello world'
        ], {
            matches: [{
                type: 'identity',
                lexicon: 'hello'
            }],
            error: null
        }
    ],
    [
        [
            [{
                type: 'identity',
                regular: /[a-z]+/
            }, {
                type: 'any',
                regular: /.+/
            }], 'hello world'
        ], {
            matches: [{
                type: 'identity',
                lexicon: 'hello'
            }, {
                type: 'any',
                lexicon: 'hello world'
            }],
            error: null
        }
    ],
    [
        [
            [{
                type: 'identity',
                regular: /[a-z]+/
            }], '1234hello'
        ], {
            matches: [],
            error: {
                lexicon: '1234'
            }
        }
    ]
]
*/

let findNext = (token_class, txt) => {
    let matches = [];
    let latestIndex = txt.length;
    for (let i = 0; i < token_class.length; i++) {
        let item = token_class[i];
        let arr = item.regular.exec(txt);
        if (arr) {
            if (arr.index < latestIndex) {
                latestIndex = arr.index;
            }
            if (arr.index === 0) {
                matches.push({
                    type: item.type,
                    lexicon: arr[0]
                });
            }
        }
    }
    let error = null;
    if (latestIndex > 0) {
        error = {
            lexicon: txt.substring(0, latestIndex)
        };
    }
    return {
        matches,
        error
    };
};

module.exports = {
    fetchToken
};
