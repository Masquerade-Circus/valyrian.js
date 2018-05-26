import '../../dist/valyrian.min.js';
import Components from './components';

// Create a router
let router = v.router();
router
    .use(() => console.log('ok'))
    .get('/', [
        () => console.log('Init'),
        () => Components.Hello
    ])
    .get('/hello', [
        () => Components.Hello.getServer(),
        () => Components.Hello
    ])
    .get('/counter', () => Components.Counter)
    .get('/diff', () => Components.Diff)
    .get('/lifecycle', () => Components.Lifecycle)
    .get('/subcomponent', () => Components.Subcomponent)
    ;

// Assign routes to ValyrianJs
v.routes('body', router);

// Export what is needed for the backend
export default {Components};