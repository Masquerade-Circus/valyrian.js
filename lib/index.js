(function(){
    let VFactory = function(){

        let Router = require('./router');
        let h = require('./h');
        let S = require('./s');
        let Request = require('./request');
        let Patch = require('./patch');

        let v = function (...args) {
            if (v.isComponent(args[0])) {
                return v.render.apply(v,args);
            }

            return h.apply(h, args);
        };

        v.r = Request();

        ['get','post','put','patch','delete','options'].forEach(method =>
            v[method] = (url, data, options) => v.r.request(method, url, data, options)
        );

        v.router = Router(v);

        v.isVnode = h.isVnode;
        v.vnode = h.vnode;

        v.isNode = typeof window === 'undefined';

        v.window = v.isNode ? require('html-element') : window;
        v.document = v.window.document;

        var lifecycle = [];

        var patch = Patch(v);

        v.clock = function(start) {
            let end, p = typeof performance !== 'undefined' ? performance : process;
            if (p !== undefined && p.hrtime !== undefined) {
                if (!start) {
                    return process.hrtime();
                };
                end = process.hrtime(start);
                return Math.round((end[0] * 1000) + (end[1] / 1000000));
            }

            if (p !== undefined && p.now !== undefined) {
                if (!start) {
                    return performance.now();
                }

                end = performance.now();
                return end - start;
            }
        };

        v.getFixedFrameRateMethod = function(fps = 5, callback, scope) {
            let time,
                previousTime = v.clock(),
                method = function () {
                    time = v.clock();
                    if (v.clock(previousTime) > 1000 / fps) {
                        previousTime = time;
                        if (typeof callback === 'function') {
                            if (typeof requestAnimationFrame === 'function') {
                                requestAnimationFrame(callback.bind(scope || this));
                            } else {
                                setTimeout(callback.bind(scope || this), 1);
                            }
                        }
                    }
                };

            return method;
        };

        v.mounted = false;
        v.container = v.document.createElement('div');
        v.oldTree = v.vnode();
        v.newTree = undefined;

        v.rootComponent = undefined;

        v.assignAttributes = function(component, attributes = {}){
            if (attributes.name && attributes.props && Array.isArray(attributes.children)){
                component.attributes = {children: attributes};
            } else {
                component.attributes = Object.assign({}, component.attributes, attributes);
            }
        };

        v.mount = function(container, component, attributes = {}){
            if (container === undefined){
                throw new Error('A container element is required as first element');
                return;
            }

            if (!v.isComponent(component)){
                throw new Error('A component is required as a second argument');
                return;
            }

            v.assignAttributes(component, attributes);

            if (container && container.children){
                v.oldTree = v.vnode(container.children[0]);
            }

            v.rootComponent = component;
            v.container = container;
            v.mounted = true;
            return v.update();
        };

        v.render = function (component, attributes = {}) {
            if (!v.isComponent(component)){
                return;
            }

            v.assignAttributes(component, attributes);

            return component.view();
        };

        v.update = function(component, attributes = {}){
            var next;
            if (v.isComponent(component)){
                v.assignAttributes(component, attributes);
                v.rootComponent = component;
            };

            v.newTree = v.render(v.rootComponent);
            if (v.isNode){
                v.container = v.document.createElement('div');
                v.oldTree = v.vnode();
            }

            // console.log('******************************');
            v.container = patch(v.container, v.newTree, v.oldTree);
            // console.log('******************************');

            v.oldTree = v.newTree;
            while ((next = lifecycle.pop())) next();

            return v.isNode ? v.container.innerHTML : v.container;
        };

        v.isComponent = function(component){
            return typeof component === 'object' &&
                component !== null &&
                typeof component.view === 'function';
        };

        var s = S(v);

        v.data = function(...args) {
            return s.storeData.apply(s, args);
        };

        v.onStoreUpdate = function(...args) {
            return s.onStoreUpdate.apply(s, args);
        };

        v.onStoreUpdate(function(){
            v.update();
        });

        return v;
    };

    this.Valyrian = VFactory;
})();
