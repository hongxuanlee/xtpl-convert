'use strict';

let http = require('http');

let fs = require('fs');

let server = http.createServer((req, res) => {
    console.log(req.url); // eslint-disable-line
    if (req.url === '/') {
        let indexStream = fs.createReadStream(__dirname + '/index.html', 'utf-8');
        indexStream.pipe(res);
    } else {
        res.end('hello world!');
    }
});

server.listen(3000, () => {
    console.log('server listen at 3000'); // eslint-disable-line
});
