const micro = require('micro');
const router = require('../../server/router');
import puppeteer from 'puppeteer';

export default () => {
    let port = Math.floor(Math.random() * (3999 - 3001)) + 3000;

    return {
        port,
        async start({log}) {
            await new Promise((resolve) => {
                this.server = micro(router).listen(port, (...args) => {
                    log(`Micro listening on port ${port}`);
                    resolve();
                });
            });
            this.browser = await puppeteer.launch({
                dupio: true
            });
            this.page = await this.browser.newPage();
        },
        async close() {
            this.server.close();
            await this.page.close();
            await this.browser.close();
        },
        async goto(url) {
            await this.page.goto(`http://localhost:${port}${url}`);
        }
    };
};
