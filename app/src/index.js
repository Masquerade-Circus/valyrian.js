import './bootstrap';
import Store from './store';
import Components from './components';
var root = (typeof window === 'undefined' ? global : window);
root.Store = Store;
root.Components = Components;

v.r.nodeUrl = 'http://localhost:3000';

v.router(v.isNode ? v.container : document.body, Components.Main)
    // Use middlewares available for all requests
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

if (!v.isNode) {

    // setTimeout(function () {
    //     console.log('hello');
    //     Store.hello('Hola');
    // }, 5000);
    //
    // setTimeout(function () {
    //     console.log('world');
    //     Store.name('Mundo');
    // }, 7000);

    // setTimeout(function(){
    //     v.router.go('/counter');
    // }, 10000);
}
