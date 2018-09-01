const Browser = require('zombie');
Browser.extend(function (browser) {
    browser.on('console', function (level, message) {
        console.log(level, message);
    });
    browser.on('log', function (level, message) {
        console.log(level, message);
    });
});

const browser = new Browser({ site: 'http://localhost:3001' });
describe('User visits signup page', function () {

    describe('Main page', function () {

        it('should be successful', async () => {
            await browser.visit('/');
            browser.assert.success();
        });

        it('should see welcome page', function () {
            browser.assert.text('title', 'Valyrian.js');
            browser.assert.element('#mundo');
        });
    });
});
