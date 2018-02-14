let micro = require('micro');
let Router = require('micro-ex-router');
let Helper = require('./helpers');

global.htmlElement = require('html-element');
global.nodeFetch = require('node-fetch');
require('../dist/valyrian.min.js');
require('../app/index.min.js');

// Create a new router
let router = Router();

router.get('/', () => v.router.go('/'));

v.router.paths.forEach(function(path){
    if (path.method === 'get'){
        if (path.path !== ''){
            router.get(path.path, () => v.router.go(path.path));
        }
    }
});

router
    .get('/api/hola', () => ({hello: 'Aloha', name: 'meine welt'}))
    .get('/index.js', (req, res) => Helper.serveFile(res, `./app/index.min.js`))
    .get('/valyrian.min.js', (req, res) => Helper.serveFile(res, `./dist/valyrian.min.js`))
;

// Init micro server
let server = micro(router);

// v.router.go('/diff').catch(console.log);

server.listen(3000, async () => {
    console.log('Micro listening on port 3000');
});
