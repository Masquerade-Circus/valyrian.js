let fs = require('fs');
let micro = require('micro');
let Router = require('micro-ex-router');
let Helper = require('./helpers');

// Require valyrian and main app
require('../dist/valyrian.node.helpers.min.js');
let App = require('../app/dist/index.min.js');

let v = global.v;

// Set the internal nodejs url
v.request.nodeUrl = 'http://localhost:3001';

// Inline styles and javascript
v.inline.js('./dist/valyrian.min.js');
v.inline.js('./app/dist/index.min.js');
v.inline.css('https://masquerade-circus.github.io/pure-material-css/css/pure-material.css')
    .then(() => {
        let renderedHtml = v.routes().map(path => v.routes.go(path, App.Pages.Main));
        v.inline
            .uncss(renderedHtml)
            .then((css) => {
                App.Pages.Main.css = css;
                App.Pages.Main.js = v.inline.js();
            });
    });

// Set the title and version for the Main component
let packageJson = require('../package.json');
App.Pages.Main.title = 'Valyrian.js';
App.Pages.Main.version = packageJson.version;
App.Pages.Main.css = v.inline.css();


// Create a new router
let router = Router();

// Add api routes
router
    .get('/api/hola', () => ({ hello: 'Aloha', name: 'meine welt' }))
    .use(Helper.serveDir('./app/dist'))
    .use(Helper.serveDir('./app/public'))
    .use(Helper.serveDir('./dist'))
    .get('/favicon.ico', () => 'Not found')
;

// Add Valyrian routes
v.routes()
    .forEach(path => router.get(
        path,
        async (req, res) =>
            '<!DOCTYPE html>' +
            await v.routes.go(req.url, App.Pages.Main)
    ));

// Init micro server
micro(router).listen(3001, async () => {
    process.stdout.write('Micro listening on port 3001\n');
});


