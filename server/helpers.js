let fs = require('fs'),
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

            res.writeHead(200, {
                'Content-Type': config.mimeTypes[extension] || 'text/plain',
                'Content-Length': stat.size,
                'Cache-Control': 'public, max-age=2592000',
                'Expires': new Date(Date.now() + 604800000).toUTCString()
            });

            let readStream = fs.createReadStream(filePath);

            resolve(readStream.pipe(res));
        });
    });
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
        if (typeof htmlOrFunc === 'function'){
            html = await htmlOrFunc(req, res);
        }

        if (typeof htmlOrFunc === 'string'){
            html = htmlOrFunc;
        }

        res.writeHead(200, {
            'Content-Type': config.mimeTypes.html,
            'Content-Length': html.length
        });

        res.end(html);
    };
};

/**
 * Expor default object with all the helpers
 */
module.exports = {
    serveFile,
    render
};
