let micro = require('micro');
let Router = require('micro-ex-router');
let config = require('./config');
let Helper = require('./helpers');
require('colors');

// Require valyrian and main app
let nodePlugin = require('../plugins/node');
let App = require('../app/dist/index.min');
v.use(nodePlugin);
v.request.nodeUrl = 'http://localhost:3001';

// Inline styles and javascript
let renderedHtml = v.routes.get().map(path => v.routes.go(App.Pages.Main, path));
v.inline(
    './app/dist/index.min.js',
    'https://masquerade-circus.github.io/pure-material-css/css/pure-material.css'
)
    .then(() => v.inline.uncss(renderedHtml));

// Create a new router
let router = Router();

// Add api routes
router
    .get('/', (req, res) => Helper.serveFile(res, './server/index.html'))
    .get('/api/hola', () => ({ hello: 'Aloha', name: 'meine welt' }))
    .use(Helper.serveDir('./app/public'))
    .get('/favicon.ico', () => 'Not found')
    .get('/index.min.js', (req, res) => Helper.serveFile(res, './app/dist/index.min.js'))
    .get('/valyrian.min.js.map', (req, res) => Helper.serveFile(res, './dist/valyrian.min.js.map'))
;

// Add Valyrian routes
v.routes.get()
    .forEach(path => router.get(
        path,
        async (req, res) =>
            '<!DOCTYPE html>' +
            await v.routes.go(App.Pages.Main, req.url)
    ));

// Uncaught error handler
process.on('unhandledRejection', (reason) => {
    process.stderr.write(`    ${reason}\n`.italic.strikethrough.red);
    throw reason;
});

let server = micro(router).listen(3001, () => {
    process.stdout.write('Micro listening on port 3001\n');
});
