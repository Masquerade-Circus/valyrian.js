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
    .get('/hello/:ok', (params) => {
        return Components.Hello;
    })
;

// Assign routes to ValyrianJs
v.routes('body', router);

if (v.isBrowser) {
    v.sw('./sw.js')
        .then(() => {
            console.log('SW registered');
        });
}

// Export what is needed for the backend
export default {Components};
