import '../dist';
import Store from './store';
import Components from './components';

if (m.isNode){
    global.Store = Store;
    global.Components = Components;
} else {
    window.Store = Store;
    window.Components = Components;
}

m.router(m.isNode ? m.container : document.body)
    // Use middlewares available for all requests
    .use(() => console.log('ok'))
    .get('/', () => console.log('Also ok'))
    .get('/', [
        () => console.log('Init'),
        () => {
            return m.isNode ? Components.Home : Components.Hello;
        }
    ])
    .get('/hello', () => Components.Hello)
    .get('/counter', () => Components.Counter);

if (!m.isNode){
    setTimeout(function () {
        console.log('hello');
        Store.hello('Hola');
    }, 5000);

    setTimeout(function () {
        console.log('world');
        Store.name('Mundo');
    }, 7000);

    setTimeout(function(){
        m.router.go('/counter');
    }, 10000);
}


console.log(m.isNode);

// m.mount(document.body, Components.Hello);
