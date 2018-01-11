import Store from '../store';
import Components from '../components';


// m.router(document.body)
//     // Use middlewares available for all requests
//     .use(() => console.log('ok'))
//     .get('/', () => console.log('Also ok'))
//     .get('/', [
//         () => console.log('Init'),
//         () => Components.Counter
//     ])
//     .get('/hello', () => Components.Hello)
//     .get('/counter', () => Components.Counter);

window.Store = Store;

setTimeout(function () {
    console.log('hello');
    Store.hello('Hola');
}, 5000);

setTimeout(function () {
    console.log('world');
    Store.name('Mundo');
}, 7000);

// setTimeout(function(){
//     m.router.go('/counter');
// }, 10000);

console.log(m.isNode);

m.mount(document.body, Components.Counter);
