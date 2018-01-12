let micro = require('micro');
let Router = require('micro-ex-router');
let Helper = require('./helpers');

global.htmlelement = require('html-element');
require('../app/index.min.js');

// Create a new router
let router = Router();

router
    .get('/', () => m.router.run('/', {children: Components.Hello.view()}))
    .get('/hello', () => m.router.run('/', {children: Components.Hello.view()}))
    .get('/counter', () => m.router.run('/', {children: Components.Counter.view()}))
    .get('/index.js', (req, res) => Helper.serveFile(res, `./app/index.min.js`))
;

// Init micro server
let server = micro(router);

server.listen(3000, async () => {
    console.log('Micro listening on port 3000');
});
