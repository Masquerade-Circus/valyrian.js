let fs = require('fs');
let micro = require('micro');
let Router = require('micro-ex-router');
let Helper = require('./helpers');

// Require valyrian and main app
require('../dist/valyrian.node.min.js');
// global.v = require('../dist/valyrian.min.js');
let App = require('../app/dist/index.min.js');

// Set the internal nodejs url
v.request.nodeUrl = 'http://localhost:3001';

// Inline styles and javascript
v.inline.js('./dist/valyrian.min.js');
v.inline.js('./app/dist/index.min.js');
v.inline.css('./app/public/main.css')
    .then(() => {
        let renderedHtml = v.routes().map(path => v.routes.go(path, App.Components.Main));
        //console.log(renderedHtml);
        //let renderedHtml = ['<html></html>'];
        v.inline
            .uncss(renderedHtml)
            .then((css) => {
                console.log(css);
                App.Components.Main.css = css;
                App.Components.Main.js = v.inline.js();
            });
    });

// Set the title and version for the Main component
let packageJson = require('../package.json');
App.Components.Main.title = 'Valyrian.js';
App.Components.Main.version = packageJson.version;
App.Components.Main.css = v.inline.css();


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
v.routes().forEach(path => router.get(path, (req, res) => v.routes.go(req.url, App.Components.Main)));

// Init micro server
micro(router).listen(3001, async () => {
    console.log('Micro listening on port 3001');
});


