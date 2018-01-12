let micro = require('micro');
let Router = require('micro-ex-router');
let Helper = require('./helpers');

global.htmlelement = require('html-element');
require('../client/index.cjs.js');

// Create a new router
let router = Router();

router

    // Default returned responses
    .get('/', () => m.router.run('/', {children: Components.Hello.view()}))
    .get('/hello', () => m.router.run('/', {children: Components.Hello.view()}))
    .get('/counter', () => m.router.run('/', {children: Components.Counter.view()}))
    .get('/index.js', (req, res) => Helper.serveFile(res, `./client/index.cjs.js`))
    .get('/lib.js', (req, res) => Helper.serveFile(res, `./dist/index.js`))
    .get('/router.js', (req, res) => Helper.serveFile(res, `./dist/router.js`))
;

// Init micro server
let server = micro(router);

server.listen(3000, async () => {
    console.log('Micro listening on port 3000');
});
