
let fs = require('fs'),
    recursive = require("recursive-readdir"),
    config = require('./config.js');

/**
 * Helper function to serve a file from the file system
 * @method serveFile
 * @param  {Object}  res        Response object
 * @param  {String}  filePath   Path of the file to serve
 * @return {Promise}
 */
let serveFile = (res, filePath) => {
    let extension = filePath.split('/').pop().split('.').pop();
    return new Promise((resolve, reject) => {
        return fs.stat(filePath, (err, stat) => {
            if (err) {
                return reject(err);
            }

            if (extension === 'html') {
                res.writeHead(200, {
                    'Content-Type': config.mimeTypes[extension] || 'text/plain',
                    'Content-Length': stat.size,
                    'Cache-Control': 'public, no-cache, no-store, must-revalidate',
                    'Expires': '0',
                    'Pragma': 'no-cache'
                });
            }

            if (extension !== 'html') {
                res.writeHead(200, {
                    'Content-Type': config.mimeTypes[extension] || 'text/plain',
                    'Content-Length': stat.size,
                    'Cache-Control': 'public, max-age=2592000',
                    'Expires': new Date(Date.now() + 604800000).toUTCString()
                });
            }

            let readStream = fs.createReadStream(filePath);

            resolve(readStream.pipe(res));
        });
    });
};

let serveDir = function (dir) {
    let dirName = dir.replace('./', '');
    let f = {};
    recursive(dir, function (err, files) {
        if (err) {
            return console.log(err);
        }

        files.forEach(file => {
            file = file.replace(/\\/gi, '/');
            let path = file.replace(dirName, '');
            let regexpPath = path
                // To set to any url with the path as prefix
                .replace(/\*/g, '.*')
                // Remove the last slash
                .replace(/\/(\?.*)?$/gi, '$1');


            f[file.replace(dirName, '')] = {
                file: './' + file,
                regexp: new RegExp('^' + regexpPath + '\\?.*?$', 'gi')
            };
        });
    });

    return (req, res) => {
        if (f[req.url] !== undefined) {
            return serveFile(res, f[req.url].file);
        }

        for (let i in f) {
            let matches = f[i].regexp.exec(req.url);
            f[i].regexp.lastIndex = -1;
            if (Array.isArray(matches)) {
                return serveFile(res, f[i].file);
                break;
            }
        }
    };
};

/**
 * Helper function to render an html string
 * @method render
 * @param  {Object} res     Response object
 * @param  {String} html    Html string
 * @return {Void}
 */
let render = (htmlOrFunc) => {
    return async (req, res) => {
        var html;
        if (typeof htmlOrFunc === 'function') {
            html = await htmlOrFunc(req, res);
        }

        if (typeof htmlOrFunc === 'string') {
            html = htmlOrFunc;
        }

        res.writeHead(200, {
            'Content-Type': config.mimeTypes.html,
            'Content-Length': html.length,
            'Cache-Control': 'public, no-cache, no-store, must-revalidate',
            'Expires': '0',
            'Pragma': 'no-cache'
        });

        console.log(html);

        res.end(html);
    };
};


/**
 * Small and super fast logic-less template engine in 132 bytes.
 * https://gist.github.com/Masquerade-Circus/d441541cc604624552a9
 */
let compile = function (a, b, c) { return c = Function("o", "return " + JSON.stringify(a).replace(/{{(.+?)}}/g, '" + (o["$1"]||"") + "') + ";"), b != []._ ? c(b) : c; };


/**
 * Export default object with all the helpers
 */
module.exports = {
    serveFile,
    serveDir,
    render,
    compile
};
