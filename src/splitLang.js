'use strict';

let Tokenspliter = require('./tokenSplit/index');

let tokenspliter = Tokenspliter([{
    type: 'assign',
    regular: /<%\=.*?%>/
}, {
    type: 'jscode',
    regular: /<%[\s\S]*?%>/m
}, {
    type: 'string',
    regular: /.+?/
}, {
    type: 'whitespace',
    regular: /\s+/
}]);

module.exports = (str = '') => {
    let tokens = [];
    let tokenStream = tokenspliter(str);
    while (!tokenStream.isEmpty()) {
        let word = tokenStream.next();
        tokens.push(word);
    }

    tokens = tokens.reduce((prev, cur) => {
        let last = prev[prev.length - 1];
        if (last && last.type === 'string' && cur.type === 'string') {
            last.lexicon += cur.lexicon;
        } else {
            prev.push(cur);
        }
        return prev;
    }, []);

    return tokens;
};
