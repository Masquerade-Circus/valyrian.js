let fs = require('fs');
let micro = require('micro');
let Router = require('micro-ex-router');
let Helper = require('./helpers');

// Require valyrian and main app
//require('../dist/valyrian.min.js');
let App = require('../app/dist/index.min.js');

// Set the internal nodejs url
v.request.nodeUrl = 'http://localhost:3001';

// Inline styles and javascript
v.inline.js('./app/dist/index.min.js');
v.inline.css('./app/public/main.css');

// Set the title and version for the Main component
let packageJson = require('../package.json');
App.Components.Main.title = 'Valyrian.js';
App.Components.Main.version = packageJson.version;
App.Components.Main.css = v.inline.css();
let renderedHtml = v.routes().map(path => v.routes.go(path, App.Components.Main));
v.inline.uncss(renderedHtml)
    .then((css) => {
        App.Components.Main.css = css;
        App.Components.Main.js = v.inline.js();
    });

v.sw.create('./app/public/sw.js', {
    name: 'Test',
    version: packageJson.version,
    urls: ['/', '/hello']
});

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
