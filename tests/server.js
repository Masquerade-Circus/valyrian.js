const micro = require('micro');
const router = require('../server/router');
const Browser = require('zombie');

module.exports = () => {
    let server;
    let port = Math.floor(Math.random() * (3999 - 3001)) + 3000;

    return {
        start({end, log}) {
            server = micro(router).listen(port, (...args) => {
                log(`Micro listening on port ${port}`);
                end();
            });
        },
        close() {
            server.close();
        },
        browser: new Browser({ site: `http://localhost:${port}` })
    };
};
