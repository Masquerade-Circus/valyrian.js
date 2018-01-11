let micro = require('micro');
let Router = require('micro-ex-router');
global.htmlelement = require('html-element');
require('../dist');
global.Store = require('../store');
let Components = require('../components');
let Helper = require('./helpers');

// Create a new router
let router = Router();

router

    // Default returned responses
    .get('/', () => m.render(Components.Home, {children: Components.Counter.view()}))
    .get('/hello', () => m.render(Components.Home, {children: Components.Hello.view()}))
    .get('/counter', () => m.render(Components.Home, {children: Components.Counter.view()}))
    .get('/index.js', (req, res) => Helper.serveFile(res, `./client/index.cjs.js`))
    .get('/lib.js', (req, res) => Helper.serveFile(res, `./dist/index.js`))
    .get('/router.js', (req, res) => Helper.serveFile(res, `./dist/router.js`))
;

// Init micro server
let server = micro(router);

server.listen(3000, async () => {
    console.log('Micro listening on port 3000');
});
