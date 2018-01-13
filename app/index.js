import '../dist';
import Store from './store';
import Components from './components';

if (v.isNode){
    global.Store = Store;
    global.Components = Components;
} else {
    window.Store = Store;
    window.Components = Components;
}

console.log(v);

v.router(v.isNode ? v.container : document.body, Components.Main)
    // Use middlewares available for all requests
    .use(() => console.log('ok'))
    .get('/', () => console.log('Also ok'))
    .get('/', [
        () => console.log('Init'),
        () => Components.Hello
    ])
    .get('/hello', () => Components.Hello)
    .get('/counter', () => Components.Counter);

if (!v.isNode){
    setTimeout(function () {
        console.log('hello');
        Store.hello('Hola');
    }, 5000);

    setTimeout(function () {
        console.log('world');
        Store.name('Mundo');
    }, 7000);

    setTimeout(function(){
        v.router.go('/counter');
    }, 10000);
}

// v.mount(document.body, Components.Hello);
