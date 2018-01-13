require('../dist');
(function(){
    var root = this; // window or global
    this.v = Valyrian();
    this.Store = require('./store');
    this.Components = require('./components');

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

})();
