'use strict';

const splitLang = require('./src/splitLang');
const splitJs = require('./src/splitJs');

let getJsCodePart = (lexicon) => {
    let list = lexicon.match(/<%([\s\S]*?)%>/);
    if (list) return list[1];
};

let processJsToken = (handler) => (tokens) => tokens.map((token, index, tokens) => {
    if (token.type === 'jscode') {
        handler && handler(token, index, tokens);
    }
    return token;
});


let assignRule = (tokens) => tokens.map((token) => {
    if (token.type === 'assign') {
        let value = token.lexicon.match(/<%=(.*)%>/)[1];
        token.xtplLexicon = `{{ ${value} }}`;
    }

    return token;
});

let jqueryEachRule = processJsToken((token, index, tokens) => {
    let jscode = getJsCodePart(token.lexicon);
    if (jscode) {
        jscode = jscode.trim();
        let list = jscode.match(/\$\.each\s*\((.*),\s*(?:function|\(\)\s*\=\>)\s*\(.*,(.*)\)/);
        if (list) {
            let arrName = list[1];
            let name = list[2];
            token.xtplLexicon = `{{# each(${arrName})}}\n{{set (${name} = this)}}`;
            // find the pair }
            let rest = tokens.slice(index + 1);
            replacePair(rest, '}} {{/ each }} {{');
        }
    }
});

let processChangeArr = (handler) => (tokens) => {
    let add = 0;
    for(let i = 0; i < tokens.length; i++){
        if (tokens[i].type === 'jscode') {
            add = handler && handler(tokens[i], i, tokens);
            i = i + add;
        }
    }
    return tokens;
};

// <% for(var i = 0,len = itemData.length;i<len;i++) {
//       var item = itemData[i];
//   %>
let forRule = processChangeArr((token, index, tokens) => {
    if(token.xtplLexicon){
        return 0;
    }
    let increment = 0;
    let jscode = getJsCodePart(token.lexicon);
    let addToken = [];
    if (jscode) {
        jscode = jscode.trim();
        let list = jscode.match(/for\s*\(([\s\S]*?)\)\s*\{([\s\S]*?$)/);
        if (list) {
            // find the pair }
            let rest = tokens.slice(index + 1);
            let {start, end} = {};
            let condition = list[1];
            let statement = list[2];
                if (condition) {
                    let cList = condition.split(';');
                    addToken.push({
                        type: 'jscode',
                        lexicon: `<%${cList[0]};%>`
                    });
                    if(cList[1]){
                       let variable = cList[1].match(/\s*([a-z|A-Z|\_|\$]*?)([<>])([a-z|A-Z|\_|\$]*)\s*/);
                       if(variable[0]){
                          if(variable[2] === '<'){
                             start = variable[1];
                             end = variable[3];
                          }else{
                             end = variable[1];
                             start = variable[3];
                          }
                       }
                    }
                    addToken.push(token);
                    if (statement) {
                        addToken.push({
                           type: 'jscode',
                           lexicon: `<%${statement}%>`
                        });
                    }
                    increment = addToken.length - 1;
                    addToken.unshift(index, 1);
                    tokens.splice.apply(tokens, addToken);
                }    
            token.xtplLexicon = `{{# each(range(${start}, ${end}))}}\n{{set (${start} = this)}}`;
            replacePair(rest, '}} {{/ each }} {{');
        }
    }
    return increment;
});


let replacePair = (rest, str, {
    symbol,
    pairSymbol
} = {}, isif) => {
    let {
        restTokenIndex,
        charIndex
    } = findPairLine(rest, symbol, pairSymbol);
    let pairToken = rest[restTokenIndex];
    let pairChars = pairToken.lexicon.split('');
    pairChars.splice(charIndex, 1, str);
    pairToken.xtplLexicon = pairChars.join('');
};

let ifRule = processJsToken((token, index, tokens) => {
    let {
        type, lexicon
    } = token;
    if (type === 'jscode') {
        let list = lexicon.match(/^<%\s*if\s*\((.*)\)\s*\{/);
        if (list) {
            token.xtplLexicon = `{{# if ( ${list[1]} ) }}`;
            //
            let rest = tokens.slice(index + 1);
            replacePair(rest, '}} {{/ if }} {{', {}, true);
        }
    }
});

let elseIfRule = processJsToken((token, index, tokens) => {
    let {
        type, lexicon
    } = token;
    if (type === 'jscode') {
        let list = lexicon.match(/\s*\}\s*else\s*if\s*(\([\s\S]*?\))\s*\{/);
        if (list) {
            token.xtplLexicon = `{{ elseif ${list[1]}}}`;
            let rest = tokens.slice(index + 1);
            replacePair(rest, '}} {{/ if }} {{');
        }
    }
});

let elseRule = processJsToken((token, index, tokens) => {
    let {
        type, lexicon
    } = token;
    if (type === 'jscode') {
        let list = lexicon.match(/\s*\}\s*else\s*\{/);
        if (list) {
            token.xtplLexicon = '{{ else }}';
            let rest = tokens.slice(index + 1);
            replacePair(rest, '}} {{/ if }} {{');
        }
    }
});

let findPairLine = (tokens, symbol = '{', pairSymbol = '}') => {
    let stackLen = 0;
    for (let i = 0; i < tokens.length; i++) {
        let {
            lexicon
        } = tokens[i];
        for (let j = 0; j < lexicon.length; j++) {
            let item = lexicon[j];
            if (item === symbol) {
                stackLen++;
            } else if (item === pairSymbol) {
                if (stackLen === 0) {  // find the one
                    return {
                        restTokenIndex: i,
                        charIndex: j
                    };
                } else {
                    stackLen--;
                }
            }
        }
    }

    throw new Error('fail to find pair symbol');
};

let lastDelimiterRule = processJsToken((token) => {
    let {
        type, lexicon
    } = token;
    lexicon = lexicon.trim();
    if (type === 'jscode') {
        if (token.xtplLexicon) {
            token.xtplLexicon = replaceDelimiter(token.xtplLexicon);
        } else {
            token.lexicon = replaceDelimiter(token.lexicon);
        }
    }
});

let replaceDelimiter = (lexicon) => {
    let list = lexicon.match(/^<%(.*)%>$/);
    if (list) {
        lexicon = `{{ ${list[1]} }}`;
    }
    return lexicon;
};

let varDefineRule = processJsToken((token) => {
     if(token.xtplLexicon){
        return;
    }
    let lexicon = token.lexicon;
    let set = [];
    let replace = (str) => {
        // get all var definitions
        str.replace(/(?:\s*var\s+|\s*)\s*([a-z|A-Z|\_|\$][a-z|A-Z|0-9|_|\$]*)\s*\=\s*([a-z|A-Z|0-9|_|\$\.\[\]]*)[,|;|\s]/, (...args) => {
          if (args[0]) {
                let nextStr = str.substring(args[3] + args[0].length);
                set.push(`${args[1]} = ${args[2]}`);
                replace(nextStr);
            }
        });
    };

    replace(lexicon);

    if (set.length) {
        let code = `{{ set ( ${set.join(',')} ) }}`;
        token.xtplLexicon = code;
    }
});

let equalSignRule = processJsToken((token) => {
    if (token.xtplLexicon) {
        token.xtplLexicon = token.xtplLexicon.replace(/[^\=\!]\=\=(?=[^\=])/g, (...args) => {
            return args[0] + '=';
        });
    }
});

let clean = processJsToken((token) => {
    if (token.xtplLexicon) {
        token.xtplLexicon = token.xtplLexicon.replace(/\{\{\s*\}\}/g, '');
        token.xtplLexicon = token.xtplLexicon.replace(/\{\{\s*\)\s*\}\}/g, '');
        token.xtplLexicon = token.xtplLexicon.replace(/\{\{\s*\)\;\s*\}\}/g, '');
    }
});

module.exports = (str) => {
    let tokens = splitLang(str);
    tokens = clean(
       lastDelimiterRule(
            equalSignRule(
               varDefineRule(
                    elseRule(
                        elseIfRule(
                           ifRule(
                               tokens = jqueryEachRule(
                                  forRule(
                                    assignRule(
                                        splitJs.splitProcess(tokens)
                                    )
                                  )
                                )
                            )
                        )
                    )
                )
            )
        )
    );
    let ret = tokens.reduce((prev, token) => {
        if (token.xtplLexicon) {
            prev += token.xtplLexicon;
        } else {
            prev += token.lexicon;
        }
        return prev;
    }, '');

    return ret;
};
