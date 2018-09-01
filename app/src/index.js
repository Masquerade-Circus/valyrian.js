import './init';
import Pages from './pages';

// Create a router
let router = v.Router();
router
    .use(() => console.log('ok'))
    .get('/', [
        () => console.log('Init'),
        () => Pages.Hello
    ])
    .get('/hello', [
        () => Pages.Hello.getServer(),
        () => Pages.Hello
    ])
    .get('/counter', () => Pages.Counter)
    .get('/diff', () => Pages.Diff)
    .get('/lifecycle', () => Pages.Lifecycle)
    .get('/subcomponent', () => Pages.Subcomponent)
    .get('/hello/:ok', (params) => {
        return Pages.Hello;
    })
;

// Assign routes to ValyrianJs
v.routes('body', router);

// if (v.isBrowser) {
//     v.sw('./sw.js')
//         .then(() => {
//             console.log('SW registered');
//         });
// }

// // Export what is needed for the backend
export default {Pages};
