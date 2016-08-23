'use strict';

let convert = require('..');

let {
    readdir, readFile, writeFile
} = require('mz/fs');

let xtemplate = require('xtemplate');

let sourceDir = __dirname + '/source';
let targetDir = __dirname + '/target';

let log = console.log; // eslint-disable-line

readdir(sourceDir).then((files) => {
    return Promise.all(files.map((file) => {
        if (file !== '.' && file !== '..' && file[0] !== '.') {
            let sourceFile = sourceDir + '/' + file;
            return readFile(sourceFile, 'utf-8').then((res) => {
                let ret = convert(res).ret;
                let render = new xtemplate(ret);
                if (render.compileError) {
                    log('syntax error happend in file: ' + sourceFile);
                    log(render.compileError);
                }
                let name = file.replace('.jst.html', '.xtpl');
                return writeFile(targetDir + '/' + name, ret, 'utf-8');
            });
        }
    }));
}).then(() => {
    log('job finished!');
}).catch(err => {
    log(err);
});
