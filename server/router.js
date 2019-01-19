let Router = require('micro-ex-router');
let Helper = require('./helpers');
let compression = require('compression');
require('colors');

// Require valyrian and main app
let nodePlugin = require('../plugins/node');
let App = require('../app/dist/index.min');
v.use(nodePlugin);
v.request.urls.node = 'http://localhost:3001';

// // Inline styles and javascript
// let renderedHtml = v.routes.get().map(path => v.routes.go(App.Pages.Main, path));
// v.inline(
//     './app/dist/index.min.js',
//     'https://masquerade-circus.github.io/pure-material-css/css/pure-material.css'
// )
//     .then(() => v.inline.uncss(renderedHtml));

// Create a new router
let router = Router();

// Add api routes
router
    .use((req, res) => new Promise(next => compression()(req, res, next)))
    .get('/', (req, res) => Helper.serveFile(res, './server/index.html'))
    .get('/api/hola', () => ({ hello: 'Aloha', name: 'meine welt' }))
    .use(Helper.serveDir('./dist'))
    .use(Helper.serveDir('./app/public'))
    .use(Helper.serveDir('./app/dist'))
    .get('/favicon.ico', () => 'Not found')
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

module.exports = router;
