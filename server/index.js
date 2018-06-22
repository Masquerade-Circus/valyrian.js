let config = require('./config');
let micro = require('micro');
let Router = require('micro-ex-router');
let Helper = require('./helpers');

// Create a new router
let router = Router();

// Add api routes
router
    .get('/api/hola', () => ({ hello: 'Aloha', name: 'meine welt' }))
    .use(Helper.serveDir('./app/public'))
    .get('/favicon.ico', () => 'Not found')
;

// Require valyrian and main app
require('../dist/valyrian.min.js');
let App = require('../app/dist/index.min.js');

v.routes.go('/', App.Pages.Main).then(console.log);

// Set the internal nodejs url
v.request.nodeUrl = 'http://localhost:3001';

// Inline styles and javascript
let renderedHtml = v.routes().map(path => v.routes.go(path, App.Pages.Main));
v.inline(
    './dist/valyrian.min.js',
    './app/dist/index.min.js',
    'https://masquerade-circus.github.io/pure-material-css/css/pure-material.css'
)
    .then(() => v.inline.uncss(renderedHtml));

// Add Valyrian routes
v.routes()
    .forEach(path => router.get(
        path,
        async (req, res) =>
            '<!DOCTYPE html>' +
            await v.routes.go(req.url, App.Pages.Main)
    ));

router.get('/index.min.js', (req, res) => {
    let js = v.inline.js();
    res.writeHead(200, {
        'Content-Type': config.mimeTypes.js,
        'Content-Length': js.length,
        'Cache-Control': 'public, no-cache, no-store, must-revalidate',
        'Expires': '0',
        'Pragma': 'no-cache'
    });

    res.end(js);
});

router.get('/index.min.js.map', (req, res) => Helper.serveFile(res, './app/dist/index.min.js.map'));

// Init micro server
micro(router).listen(3001, async () => {
    process.stdout.write('Micro listening on port 3001\n');
});


