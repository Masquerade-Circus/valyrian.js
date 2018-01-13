let micro = require('micro');
let Router = require('micro-ex-router');
let Helper = require('./helpers');

global.htmlelement = require('html-element');
require('../app/index.min.js');

// Create a new router
let router = Router();

router
    .get('/', () => v.router.go('/'))
    .get('/hello', () => v.router.go('/hello'))
    .get('/counter', () => v.router.go('/counter'))
    .get('/index.js', (req, res) => Helper.serveFile(res, `./app/index.min.js`))
;


// Init micro server
let server = micro(router);

server.listen(3000, async () => {
    console.log('Micro listening on port 3000');
});
