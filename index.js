'use strict';

const esprima = require('esprima');
let splitLang = require('./src/splitLang');

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

let replaceJsCode = (jsCode, fragment, rule, flag) => {
    jsCode = jsCode.replace(rule, (...args) => {
        if (args[1].length) {
            fragment.push({
                type: 'whitespace',
                lexicon: args[1]
            });
        }
        if (args[2]) {
            fragment.push({
                type: 'jscode',
                lexicon: `<%${args[2]}%>`
            });
        }
        if (args[3].length) {
            fragment.push({
                type: 'whitespace',
                lexicon: args[3]
            });
        }
        if(args[2]){
            return '';
        }
    });
    return jsCode;
};

let analyseJs = (ast, jsCode, fragment=[]) => {
    ast.body.forEach((item) => {
        if(item.type === 'VariableDeclaration'){
            jsCode = replaceJsCode(jsCode, fragment, /(\s*)([\s\S]*?\;)(\s*)/, true);
        }else if(item.type === 'IfStatement'){
            let stateMent = [];
            // split if(){
            jsCode = replaceJsCode(jsCode, fragment, /(\s*)(if\s*\(.*?\)(\s*)\{)/);
            // statement {}
            if(item.consequent && item.consequent.body){
                jsCode = analyseJs(item.consequent, jsCode, fragment);
            }
            // split }
            if(jsCode.match(/\s*(})\s*/)){
                jsCode = replaceJsCode(jsCode, fragment, /(\s*)(})(\s*)/);
            }
        }else{
            console.log(item.type);
        }       
    });
    return jsCode
} 

let splitJsCode = (token, index, tokens, newTokens)=> {
    let jscode = getJsCodePart(token.lexicon);
    let fragment = [];
    let ast;
    try {
        ast = esprima.parse(jscode);
    } catch (e) {
        //pass, not js code..
    }
    if (!ast) {
        return
    }
    try {
        analyseJs(ast, jscode, fragment);
    } catch (e) {
        console.log(e);
    }
    let increment = fragment.length;
    if (increment) {
        increment = increment - 1;
        fragment.unshift(index, 1)
        tokens.splice.apply(tokens, fragment);
   }
    return increment;
};

let splitProcess = (tokens) => {
    let add = 0;
    for(let i = 0; i < tokens.length; i++){
        if (tokens[i].type === 'jscode') {
            add = splitJsCode(tokens[i], i, tokens);
            i = i + add;
        }
    }
    return tokens;
}

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

let replacePair = (rest, str, {
    symbol,
    pairSymbol
} = {}) => {

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
            replacePair(rest, '}} {{/ if }} {{');
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
        let list = lexicon.match(/\s*else\s*\{/);
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
                if (stackLen === 0) { // find the one
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
    let lexicon = token.lexicon;
    let set = [];
    let replace = (str) => {
        // get all var definitions
        str.replace(/(?:\s*var\s+|\s*)\s*([a-z|A-Z|\_|\$][a-z|A-Z|0-9|_|\$]*)\s*\=\s*([a-z|A-Z|\_|\$].*?)[,|;|\s]/, (...args) => {
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
    }
});

module.exports = (str) => {
    let tokens = splitLang(str);
    tokens = clean(
        lastDelimiterRule(
            equalSignRule(
                varDefineRule(
                    elseIfRule(
                        elseRule(
                            ifRule(
                                jqueryEachRule(
                                    assignRule(
                                        splitProcess(tokens)
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    );
    let notProcess = [];
    let ret = tokens.reduce((prev, token) => {
        if (token.xtplLexicon) {
            prev += token.xtplLexicon;
        } else {
            prev += token.lexicon;
            if (token.type === 'jscode') {
                notProcess(token.lexicon);
            }
        }
        return prev;
    }, '');

    return {ret,notProcess};
};