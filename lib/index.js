import RouterFactory from './router';
import h from './h';
import Request from './request';
import Patch from './patch';

let VFactory = function () {

    let v = function (...args) {
        if (v.isComponent(args[0])) {
            return v.render.apply(v, args);
        }

        return h.apply(h, args);
    };

    v.domReady = function(callback){
        addEvent(
            document, 
            /https?:\/\//.test(window.document.URL) ?
                'DOMContentLoaded' :
                'deviceready', 
            callback, 
            false
        );
    };

    v.request = Request;
    Object.keys(Request).forEach(key => {
        if (typeof Request[key] === 'function'){
            v[key] = (...args) => Request[key]
                .apply(Request, args)
                .then(res => {
                    v.update();
                    return res;
                });
        }
    });

    v.router = RouterFactory;

    v.isVnode = h.isVnode;
    v.vnode = h.vnode;
    v.isDomElement = h.isDomElement;

    v.isNode = typeof window === 'undefined';

    v.window = v.isNode ? require('html-element') : window;
    v.document = v.window.document;

    let patch = Patch(v);

    function resetToDefaults() {
        v.isMounted = false;
        v.container = v.document.createElement('html');
        v.parent = v.document.createElement('div');
        v.parent.appendChild(v.container);
        v.rootTree = v.vnode(v.container);
        v.oldTree = Object.assign({}, v.rootTree);
    };
    resetToDefaults();

    v.rootComponent = undefined;

    function assignAttributes(component, attributes = {}) {
        if (attributes.name && attributes.props && Array.isArray(attributes.children)) {
            component.attributes = { children: attributes };
            return;
        } 

        if (Array.isArray(attributes)){
            component.attributes = {children: attributes.length === 1 ? attributes[0] : attributes};
            return;
        }
        
        component.attributes = Object.assign({}, component.attributes, attributes);
    };

    function parseNodes (nodes, array = []) {
        if (!Array.isArray(nodes)) {
            array.push(nodes);
            return array;
        }

        let i = 0, l = nodes.length;
        for (; i < l; i++) {
            if (Array.isArray(nodes[i])) {
                parseNodes(nodes[i], array);
            }

            if (!Array.isArray(nodes[i])) {
                array.push(nodes[i]);
            }
        }
        return array;
    };

    v.render = function (component, attributes = {}) {
        var nodes;
        if (!v.isComponent(component)) {
            throw new Error('A component is required');
            return;
        }

        assignAttributes(component, attributes);

        nodes = parseNodes(component.view());

        return nodes;
    };

    function addEvent(container, events, handler, useCapture){
        if (!v.isNode){
            events.split(' ').forEach(event => {
                container.addEventListener(
                    event,
                    handler,
                    useCapture
                );
            });   
        }
    }

    function removeEvent(container, events, handler){
        if (!v.isNode){
            events.split(' ').forEach(event => {
                container.removeEventListener(
                    event,
                    handler
                );
            });
        }
    }

    v.mount = function (container, component, attributes = {}) {
        if (container === undefined) {
            throw new Error('A container element is required as first element');
            return;
        }

        if (!v.isComponent(component)) {
            throw new Error('A component is required as a second argument');
            return;
        }

        if (!v.isNode && v.container){
            removeEvent(v.container, 'mouseup keyup', v.update);
        }

        v.container = v.isNode ? v.document.createElement('div') : typeof container === 'string' ? v.document.querySelectorAll(container)[0] : container;
        v.rootTree = v.vnode(v.container);
        v.oldTree = Object.assign({}, v.rootTree);

        if (!v.isNode){
            addEvent(v.container, 'mouseup keyup', v.update, false);
        }

        return v.update(component, attributes);
    };

    function redraw(component, attributes = {}){
        if (v.isComponent(component)) {
            assignAttributes(component, attributes);
            v.rootComponent = component;
            v.rootTree.props = {};
            Object.keys(v.rootComponent).forEach(prop => {
                if (typeof v.rootComponent[prop] === 'function') {
                    v.rootTree.props[prop] = (...args) => v.rootComponent[prop].apply(v.rootComponent, args);
                }
            });
        };

        if (v.rootComponent){
            if (v.isNode) {
                resetToDefaults();
            }
    
            v.rootTree.children = v.render(v.rootComponent);
    
            // console.log('******************************');
            patch(v.rootTree.dom.parentElement, v.rootTree, v.oldTree);
            // console.log('******************************');
    
            v.oldTree = Object.assign({}, v.rootTree);
    
            if (!v.isMounted) {
                v.isMounted = true;
            }
        }
        
        return v.isNode ? v.rootTree.dom.parentElement.innerHTML : v.rootTree.dom.parentElement;
    };

    v.update = function (component, attributes = {}) {
        if (!v.isNode){
            requestAnimationFrame(() => redraw(component, attributes));
            return;
        }
        return redraw(component, attributes);
    };

    v.isComponent = function (component) {
        return typeof component === 'object' &&
            component !== null &&
            typeof component.view === 'function';
    };

    v.routes = function(container, router) {
        if (container && router){
            v.routes.router = router;
            v.routes.container = container;
            // Activate the use of the router
            v.routes.init();
            return;
        }
        
        let routes = [];
        v.routes.router.paths.forEach(path => {
            if (path.method === 'get') {
                routes.push(path.path === '' ? '/' : path.path);
            }
        });
        return routes;
    };

    v.routes.run = async function(url = '/', parentComponent = undefined){
        let response = await v.routes.router(url);
        if (!v.isComponent(response)){
            let r = response;
            response = {view(){return r}};
        }

        if (parentComponent){
            let c = response;
            response = {view(){return v(parentComponent, v(c))}};
        }

        
        if (v.isNode || !v.isMounted) {
            return v.mount(v.routes.container, response, {params: v.routes.router.params});
        }

        
        return v.update(response, {params: v.routes.router.params});
    }

    v.routes.go = function (url, parentComponent) {
        if (!v.isNode) {
            window.history.pushState({}, '', url);
        }
        return v.routes.run(url, parentComponent);
    };

    v.routes.init = function(){
        if (!v.isNode) {
            addEvent(window, 'popstate', function (e) {
                v.routes.run(document.location.pathname);
            }, false);
            
            v.domReady(() => {
                v.routes.run(document.location.pathname);
            });
        }
    };

    v.new = VFactory;
    
    return v;
};

(typeof window === 'undefined'? global : window).v = VFactory();

