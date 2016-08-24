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
            <%if(c){%><%}else if(a){%><%} else if(b){%><%} else {%><%}%>
            `).trim();
        console.log(ret);
        assert.equal('{{# if ( c ) }}{{ elseif (a)}}{{ elseif (b)}}{{ else }} {{/ if }}', ret);

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

    it('var define and if', () => {
        let ret = tplConvert(`
        <%var start = page[0].item_time,
          winRedPacket = page[0].winRedPacket,
          customRedPacket = page[0].customRedPacket,
          winManFan = page[0].winManFan,
          customManFan = page[0].customManFan;
          if(start === 'pre' && (winRedPacket === true || winRedPacket === 'true') && customRedPacket === 'true'){
            var openRedPacket = true;
          }
          if(start === 'now' && (winManFan === true || winManFan === 'true') && customManFan ==='true'){
             var openManFan = true;
          }%>
       `);
        console.log(ret);
    });

    it('if else', () => {
        let ret = tplConvert(`
          <% if(item.item_shop_activity_url && item.item_shop_activity_url.indexOf('?') !== -1){
          item.item_shop_activity_url = item.item_shop_activity_url + '&cpp=0'
        }else{
           item.item_shop_activity_url = item.item_shop_activity_url + '?cpp=0'
          } %>
       `);
        console.log(ret);
    });

    it('for', () => {
        let ret = tplConvert(`
          <% for(var i = 0,len = subData.length;i<len;i++) { 
              var subItem = subData[i];
          %> 
          <a href="<%= subItem.href %>" class="J_hyperlink">
          <img class="item-pic" src="data:image/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=" data-network="Q75s100,Q50s100" data-src="<%= subItem.placePic %>_240x240.jpg 1x,<%= subItem.placePic %>_240x240.jpg 2x,<%= subItem.placePic %>_360x360.jpg 3x" />
           </a>
           <% } %>
       `);
        console.log(ret);
    });

});


