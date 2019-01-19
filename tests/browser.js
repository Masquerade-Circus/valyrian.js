import test from 'ava';
import Server from './server';

let server = Server();
let {browser} = server;

test.before.cb(server.start);
test.after(server.close);

test('should be successful', async (t) => {
    await browser.visit('/');
    browser.assert.success();
});

test('should see welcome page', async () => {
    await browser.visit('/');
    browser.assert.text('title', 'Valyrian.js');
    browser.assert.element('#mundo');
});
