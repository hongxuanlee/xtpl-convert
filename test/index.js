'use strict';

let assert = require('assert');

let tplConvert = require('..');

describe('index', () => {
    it('base', () => {
        tplConvert(`
            <% if(item.item_num === 0 || item.item_num === "0"){ %>
        <a href="<%= item.item_url %>" class="item-shouqing-03 theme-btn-main">再去逛逛</a>
          <% }else { %>
                  <a href="<%= item.item_url %>" class="item-buy-03 theme-btn-main">立即抢购</a>
                <% } %>
            `);
    });

    it('$.each', () => {
        tplConvert(`
            <% $.each(page,function(index,item){ %>
                <span class="shop-name-02"><%= item.item_shop_title %></span>
            <% } %>
            `);
    });
    it('$.each2', () => {
        tplConvert(`
            <% $.each(page,() => (index,item){ %>
                <span class="shop-name-02"><%= item.item_shop_title %></span>
            <% } %>
            `);
    });
    it('if', () => {
        tplConvert(`
            <%if( item.item_trade_num && item.item_trade_num!==0 && item.item_trade_num !== '0'){%>
            <p class="item-favorite-02">已售<%= item.item_trade_num %>件</p>
            <%}%>
            `);
    });

    it('else', () => {
        tplConvert(`
    <% if( item.shop_hongbao){%>
        <a href="<%= item.item_url %>">立即抢购</a>
    <%}else{%>
        <a href="<%= item.item_url %>" class="item-total-look theme-btn theme-btn-main">立即抢购</a>
<%}%>
            `);
    });

    it('var define', () => {
        tplConvert(`
            <%
            a.b.f;
var type = page[0].item_type,
                isopenwindow = page[0].openwindow;
            %>
            `);
    });

    it('else if', () => {
        let ret = tplConvert(`
            <%if(c){%><%}else if(a){%><%} else if(b){%><%}%>
            `).trim();
        assert.equal('{{# if ( c ) }}{{ elseif (a)}}{{ elseif (b)}} {{/ if }}', ret);
    });

    it('!==', () => {
        let ret = tplConvert(`
            <%if(a!==b){%><%}%>
            `).trim();
        assert.equal(ret, '{{# if ( a!==b ) }} {{/ if }}');
    });

    it('==', () => {
        let ret = tplConvert(`
            <%if(a==b){%><%}%>
            `).trim();
        assert.equal(ret, '{{# if ( a===b ) }} {{/ if }}');
    });

});
