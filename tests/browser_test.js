import test from 'ava';
import Server from './helpers/server';

let server = Server();

test.before((t) => server.start(t));
test.after((t) => server.close(t));

test('should be successful', async (t) => {
    await server.goto('/');
});

test('should see welcome page', async (t) => {
    await server.goto('/');
    t.is(await server.page.title(), 'Valyrian.js');
    t.not(await server.page.$('#mundo'), null);
});
