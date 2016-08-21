'use strict';

let assert = require('assert');

let splitLang = require('../src/splitLang');

describe('splitLang', () => {
    it('base', () => {
        let tokens = splitLang(`
    <% if(a){%>
    <a href="<%= b %>">hah</a>
      <%}else{%>
    <p>ppp</p>
    <%}%>
            `);

        assert.deepEqual(
            tokens, [{
                type: 'whitespace',
                lexicon: '\n    '
            }, {
                type: 'jscode',
                lexicon: '<% if(a){%>'
            }, {
                type: 'whitespace',
                lexicon: '\n    '
            }, {
                type: 'string',
                lexicon: '<a href="'
            }, {
                type: 'assign',
                lexicon: '<%= b %>'
            }, {
                type: 'string',
                lexicon: '">hah</a>'
            }, {
                type: 'whitespace',
                lexicon: '\n      '
            }, {
                type: 'jscode',
                lexicon: '<%}else{%>'
            }, {
                type: 'whitespace',
                lexicon: '\n    '
            }, {
                type: 'string',
                lexicon: '<p>ppp</p>'
            }, {
                type: 'whitespace',
                lexicon: '\n    '
            }, {
                type: 'jscode',
                lexicon: '<%}%>'
            }, {
                type: 'whitespace',
                lexicon: '\n            '
            }]
        );
    });
});
