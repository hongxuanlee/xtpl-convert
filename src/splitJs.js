'use strict';

const esprima = require('esprima');

let getJsCodePart = (lexicon) => {
    let list = lexicon.match(/<%([\s\S]*?)%>/);
    if (list) {
        return list[1];
    }
};

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
                lexicon: `<% ${args[2]} %>`
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

let analyseIfCommon = (item, jsCode, fragment) => {
    // statement {}
    if(item.consequent && item.consequent.body){
        jsCode = analyseJs(item.consequent, jsCode, fragment);
    }
    if(item.alternate && item.alternate.type === 'IfStatement'){
        jsCode = replaceJsCode(jsCode, fragment, /(\s*)(}\s*else\sif\s*\(.*?\)(\s*)\{)/);
        jsCode = analyseIfCommon(item.alternate, jsCode, fragment);
    }
    if(item.alternate && item.alternate.type === 'BlockStatement'){
        jsCode = replaceJsCode(jsCode, fragment, /(\s*)(}\s*else\s*\{)(\s*)/);
        jsCode = analyseJs(item.consequent, jsCode, fragment);
    }
    return jsCode;
};

let analyseIfState = (item, jsCode, fragment) => {
    // split if(){
    jsCode = replaceJsCode(jsCode, fragment, /(\s*)(if\s*\(.*?\)(\s*)\{)/);
    // statement {}
    jsCode = analyseIfCommon(item, jsCode, fragment);
    // split }
    if(jsCode.match(/\s*(})\s*/)){
        jsCode = replaceJsCode(jsCode, fragment, /(\s*)(})(\s*)/);
    }
    return jsCode;
};

let analyseJs = (ast, jsCode, fragment = []) => {
    ast.body.forEach((item) => {
        if(item.type === 'VariableDeclaration' || item.type === 'ExpressionStatement'){
            jsCode = replaceJsCode(jsCode, fragment, /(\s*)([\s\S]*?\;?[^,])(\n)/);
        }else if(item.type === 'IfStatement'){
            jsCode = analyseIfState(item, jsCode, fragment);
        }else{
            console.log(item.type);
        }
    });
    return jsCode;
};

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
        return 0;
    }
    try {
        analyseJs(ast, jscode, fragment);
    } catch (e) {
        console.log(e);
    }
    let increment = fragment.length;
    if (isNaN(increment)) {
        increment = 0;
    }
    if (increment) {
        increment = increment - 1;
        fragment.unshift(index, 1);
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
};

module.exports = {
    splitProcess
};
