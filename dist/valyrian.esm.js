/**
 * Handles the mix of single and array of middlewares
 * @method parseMiddlewares
 * @param  {Function|Array}         middlewares     // Middleware or array of middlewares
 * @param  {Array}                  [array=[]]      // The array to store the final list of middlewares
 * @return {Array}                                  // The final list of middlewares
 */
let parseMiddlewares = (middlewares, array = []) => {
    if (typeof middlewares === 'function') {
        array.push(middlewares);
        return array;
    }

    let i = 0, l = middlewares.length;
    for (; i < l; i++) {
        if (Array.isArray(middlewares[i])) {
            parseMiddlewares(middlewares[i], array);
        }

        if (!Array.isArray(middlewares[i])) {
            array.push(middlewares[i]);
        }
    }
    return array;
};

/**
 * Adds a path to a router
 * @method addPath
 * @param  {Router} router              The router in which to add the path
 * @param  {String} method              The method that will handle this path
 * @param  {Array} args                The mixed params (String|Function|Array)
 */
let addPath = (router, method, args) => {
    let path, middlewares;

    // Get the first argument
    if (typeof args[0] === 'string') {
        path = args.shift();
    }

    // If the seccond argument is a function and has paths
    // and regexpList properties then
    // Treat it as a subrouter
    if (
        typeof args[0] === 'function' &&
        args[0].paths !== undefined &&
        args[0].regexpList !== undefined
    ) {
        let subrouter = args.shift(),
            i = 0,
            l = subrouter.paths.length;

        // For each path of the subrouter
        for (; i < l; i++) {
            let submiddlewares = subrouter.paths[i].middlewares;
            let submethod = subrouter.paths[i].method;
            let subpath = subrouter.paths[i].path;

            // If there is a path add it as prefix to the subpath
            if (path !== undefined) {
                subpath = path + (subpath || '*');
            }

            // If there are a subpath set it as the first element
            // on the submiddlewares array
            if (subpath !== undefined) {
                submiddlewares.unshift(subpath);
            }

            // Add the path to the router
            router = addPath(router, submethod, submiddlewares);
        }
    }

    // Parse middlwares to handle mixed arrays of middlwares and sequenced middlwares
    middlewares = parseMiddlewares(args);

    // Add the path only if there are middlewares passed
    if (middlewares.length > 0) {
        // If the path wasn't set before, set the regexp and params list
        if (path !== undefined && router.regexpList[path] === undefined) {
            // Remove the last slash
            path = path.replace(/\/(\?.*)?$/gi, '$1');

            // Find the params like express params
            let params = path.match(/:(\w+)?/gi) || [];

            // Set the names of the params found
            for (let i in params) {
                params[i] = params[i].replace(':', '');
            }

            let regexpPath = path
                // Catch params
                .replace(/:(\w+)/gi, '([^\\s\\/|\\?]+)')
                // To set to any url with the path as prefix
                .replace(/\*/g, '.*')
                // Remove the last slash
                .replace(/\/(\?.*)?$/gi, '$1');

            // Set the object to the path
            router.regexpList[path] = {
                regexp : new RegExp('^' + regexpPath  + '/?(\\?.*)?$', 'gi'),
                params: params
            };
        }

        // Add the path to the paths list
        router.paths.push({
            method: method,
            path: path,
            middlewares: middlewares
        });
    }

    return router;
};

let RouterFactory = () => {
    /**
     * new Rotuer
     * @param  {Request}    req     NodeJs Request object
     * @param  {Response}   res     NodeJs Response object
     * @return {Function}           The async function to be passed to micro
     */
    let Router = async function (url = '/') {
        let method = 'get',
            params = {},
            middlewares = [],
            response,
            i = 0,
            l = Router.paths.length;
        
        Router.url = url;

        for (; i < l; i++) {
            let path = Router.paths[i];
            if (method !== path.method && path.method !== 'use') {
                continue;
            }

            if ((path.method === 'use' || method === path.method) && path.path === undefined) {
                middlewares = parseMiddlewares(path.middlewares, middlewares);
                continue;
            }

            let matches = Router.regexpList[path.path].regexp.exec(url);
            Router.regexpList[path.path].regexp.lastIndex = -1;
            if (Array.isArray(matches)) {
                matches.shift();
                let l = Router.regexpList[path.path].params.length;
                for (; l--;) {
                    if (params[Router.regexpList[path.path].params[l]] === undefined) {
                        params[Router.regexpList[path.path].params[l]] = matches[l];
                    }
                }
                middlewares = parseMiddlewares(path.middlewares, middlewares);
            }
        }

        Router.params = params;

        if (middlewares.length > 0) {
            let i = 0, l = middlewares.length;
            // call sequentially every middleware
            for (; i < l; i++) {
                response = await middlewares[i](params);
                // If there is a response or a response was sent to the client
                // break the for block
                if (response !== undefined) {
                    return response;
                }
            }
        }

        if (Router.throwNotFound){
            // If no response was sent to the client throw an error
            throw new Error(`The url ${url} requested wasn't found`);
        }
    };

    Router.url = '/';
    Router.params = {};
    Router.throwNotFound = true;

    /**
     * Where to store the paths and its middlewares
     * @type {Object}
     */
    Router.paths = [];

    /**
     * Where to store the regexp and params list for the paths
     * @type {[type]}
     */
    Router.regexpList = {};

    /**
     * For each accepted method, add the method to the router
     * @type {Array}
     */
    ['get', 'use'].map(method => {
        Router[method] = (...args) => addPath(Router, method, args);
    });

    /**
     * Return the new router
     * @type {Router}
     */
    return Router;
};

let h = function (...args) {
    var vnode = {
        name: 'div',
        props: {},
        children: []
    },
        l,
        i,
        attributes;

    if (typeof args[0] === 'string' && args[0].trim().length > 0) {
        vnode.name = args.shift();
    }

    if (vnode.name === 'textNode') {
        vnode.value = args.join(' ').trim();
        return vnode;
    }

    if (!h.isVnode(args[0]) && typeof args[0] === 'object' && !Array.isArray(args[0]) && args[0] !== null) {
        vnode.props = args.shift();
    }

    if (/(\.|\[|#)/gi.test(vnode.name)) {
        attributes = vnode.name.match(/([\.|\#]\w+|\[[^\]]+\])/gi);
        vnode.name = vnode.name.replace(/([\.|\#]\w+|\[[^\]]+\])/gi, '');
        if (attributes) {
            for (l = attributes.length; l--;) {
                if (attributes[l].charAt(0) === '#') {
                    vnode.props.id = attributes[l].slice(1);
                    continue;
                }

                if (attributes[l].charAt(0) === '.') {
                    vnode.props.class = ((vnode.props.class || '') + ' ' + attributes[l].slice(1)).trim();
                    continue;
                }

                if (attributes[l].charAt(0) === '[') {
                    attributes[l] = attributes[l].trim().slice(1, -1).split('=');
                    vnode.props[attributes[l][0]] = attributes[l][1];
                }
            }
        }
    }

    let nodes = h.flatenArray(args);

    for (i = 0, l = nodes.length; i < l; i++) {
        vnode.children.push(h.isVnode(nodes[i]) ? nodes[i] : h('textNode', nodes[i]));
    }

    return vnode;
};

h.flatenArray = function(nodes, array = []) {
    if (!Array.isArray(nodes)) {
        array.push(nodes);
        return array;
    }

    let i = 0, l = nodes.length;
    for (; i < l; i++) {
        if (Array.isArray(nodes[i])) {
            h.flatenArray(nodes[i], array);
        }

        if (!Array.isArray(nodes[i])) {
            array.push(nodes[i]);
        }
    }

    return array;
};

h.isVnode = function (vnode) {
    return vnode && vnode.name && vnode.props && vnode.children;
};

h.vnode = function ($el) {
    if ($el) {
        if ($el.nodeType === 3) {
            return {
                value: $el.nodeValue,
                name: 'textNode',
                props: {},
                children: [],
                dom: $el
            };
        }

        return {
            name: $el.nodeName.toLowerCase(),
            props: {},
            children: Array.prototype.map.call($el.childNodes, $el => h.vnode($el)),
            dom: $el
        };
    }
};

let Request = function (baseUrl = '', options = {}) {
    let url = baseUrl.replace(/\/$/gi, '').trim(),
        opts = Object.assign({}, options);

    let methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

    let r = function (baseUrl, options) {
        let url = r.baseUrl + '/' + baseUrl,
            opts = Object.assign({}, r.options, options);
        return Request(url, opts);
    };

    r.apiUrl = undefined;
    r.nodeUrl = undefined;
    r.isNode = typeof window === 'undefined';
    r.options = opts;
    r.baseUrl = url;
    let Fetch = r.isNode ? require('node-fetch') : fetch.bind(window);

    function serialize(obj, prefix) {
        let e = encodeURIComponent;
        return '?' + Object.keys(obj).map(k => {
            if (prefix !== undefined) {
                k = prefix + "[" + k + "]";
            }

            return typeof obj[k] === 'object' ?
                serialize(obj[k], k) :
                e(k) + '=' + e(obj[k]);
        }).join('&');
    }
    function parseUrl (url) {
        let u = (r.baseUrl + '/' + url).trim().replace(/^\/\//gi, '/').trim();
        if (
            r.isNode &&
            typeof r.nodeUrl === 'string'
        ) {
            r.nodeUrl = r.nodeUrl.replace(/\/$/gi, '').trim();

            if (/^http/gi.test(u) && typeof r.apiUrl === 'string') {
                r.apiUrl = r.apiUrl.replace(/\/$/gi, '').trim();
                u = u.replace(r.apiUrl, r.nodeUrl);
            }

            if (!/^http/gi.test(u)) {
                u = r.nodeUrl + u;
            }
        }
        return u;
    }
    function request(method, url, data, options = {}) {
        let opts = Object.assign({
            method: method.toLowerCase(),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }, r.options, options),
            type = opts.headers.Accept;

        if (data !== undefined) {
            if (opts.method === 'get' && typeof data === 'object') {
                url += data = serialize(data);
            }

            if (opts.method !== 'get') {
                opts.body = JSON.stringify(data);
            }
        }

        return Fetch(parseUrl(url), opts)
            .then(response => {
                if (response.status < 200 || response.status > 300) {
                    let err = new Error(response.statusText);
                    err.response = response;
                    throw err;
                }

                if (/text/gi.test(type)) {
                    return response.text();
                }

                if (/json/gi.test(type)) {
                    return response.json();
                }

                return response;
            });
    }
    methods.forEach(method =>
        r[method] = (url, data, options) => request(method, url, data, options)
    );

    return r;
};

var Request$1 = Request();

let PatchFactory = function (v) {
    let document = v.document;

    function setProp($target, name, value) {
        if (name === 'className') {
            $target.setAttribute('class', value);
            return;
        }

        if (typeof value === 'function') {
            $target[name] = value.bind($target);
            return;
        }

        if (typeof value === 'boolean') {
            $target[name] = value;
        }

        if (value !== undefined && value !== false) {
            $target.setAttribute(name, value);
        } else {
            $target.removeAttribute(name);
        }
    }

    function updateProps(newNode, oldNode = {}) {
        // const props = Object.assign({}, newProps, oldProps);
        var newProps = newNode.props,
            oldProps = oldNode.props || {};

        const props = Object.assign(
            {},
            newProps,
            oldProps
        );
        for (let name in props) {
            if (newProps[name] !== oldProps[name]) {
                setProp(newNode.dom, name, newProps[name]);
            }
        }
    }

    async function lifecycleCall(vnode, methodName, ...args) {
        if (v.isVnode(vnode)) {
            let method = vnode.props[methodName];
            if (method && method.call) {
                args.unshift(vnode);
                let response = await method.apply(vnode, args);
                return response;
            }
        }
    }

    function createElement(vnode) {
        var $el;
        delete vnode.dom;
        lifecycleCall(vnode, 'oninit');
        $el = vnode.name === 'textNode' ?
            document.createTextNode(vnode.value) :
            vnode.name === "svg" ?
                document.createElementNS("http://www.w3.org/2000/svg", vnode.name) :
                document.createElement(vnode.name);

        vnode.dom = $el;
        updateProps(vnode);

        for (let i = 0; i < vnode.children.length; i++) {
            $el.appendChild(createElement(vnode.children[i]));
        }

        lifecycleCall(vnode, 'oncreate');
        return $el;
    }

    function removeElement(oldNode, destroyed = false) {
        return Promise.resolve(lifecycleCall(oldNode, 'onbeforeremove'))
            .then(() => {
                if (!destroyed && oldNode.dom && oldNode.dom.parentElement) {
                    oldNode.dom.parentElement.removeChild(oldNode.dom);
                }

                let i = 0, l = oldNode.children.length;
                for (; i < l; i++) {
                    removeElement(oldNode.children[i], destroyed);
                }

                lifecycleCall(oldNode, 'onremove');
            });
    }

    function patch($parent, newNode, oldNode) {
        // console.log(0, $parent, newNode, oldNode);

        // New node
        if (oldNode === undefined && newNode !== undefined) {
            // console.log(2, newNode);
            $parent.appendChild(createElement(newNode));
            return $parent;
        }

        // Deleted node
        if (newNode === undefined) {
            // console.log(3, oldNode);
            removeElement(oldNode);
            return $parent;
        }

        if (v.isVnode(oldNode) && v.isVnode(newNode)) {
            newNode.dom = oldNode.dom;

            // Same node
            if (newNode.name === 'textNode' && oldNode.value == newNode.value) {
                // console.log(1, newNode, oldNode);
                return $parent;
            }

            // New node replacing old node
            if (
                (newNode.name === 'textNode' && newNode.value != oldNode.value) ||
                newNode.name !== oldNode.name
            ) {
                // console.log(4, $parent, newNode, oldNode);
                createElement(newNode);
                Promise.resolve(removeElement(oldNode, true))
                    .then(() => {
                        $parent.replaceChild(newNode.dom, oldNode.dom);
                    });
                return $parent;
            }

            // Same node updated
            // console.log(5, newNode, oldNode);
            // if (lifecycleCall(newNode, 'onbeforeupdate', oldNode) === false){
            //     return $parent;
            // }

            // if (!v.isMounted) {
            //     lifecycleCall(newNode, 'oninit');
            //     lifecycleCall(newNode, 'oncreate');
            // }

            updateProps(newNode, oldNode);

            const max = Math.max(newNode.children.length, oldNode.children.length);
            for (let i = 0; i < max; i++) {
                patch(
                    newNode.dom,
                    newNode.children[i],
                    oldNode.children[i]
                );
            }

            lifecycleCall(newNode, 'onupdate');
            return $parent;
        }

        // console.log(6, newNode, oldNode);

        return $parent;
    }
    return patch;
};

let VFactory = function () {

    let v = function (...args) {
        if (v.isComponent(args[0])) {
            return render.apply(v, args);
        }

        return h.apply(h, args);
    };

    v.ready = function(callback){
        addEvent(
            document, 
            /https?:\/\//.test(window.document.URL) ?
                'DOMContentLoaded' :
                'deviceready', 
            callback, 
            false
        );
    };

    v.request = Request$1;
    Object.keys(Request$1).forEach(key => {
        if (typeof Request$1[key] === 'function'){
            v[key] = (...args) => Request$1[key]
                .apply(Request$1, args)
                .then(res => {
                    v.update();
                    return res;
                });
        }
    });

    v.router = RouterFactory;

    v.isVnode = h.isVnode;
    v.vnode = h.vnode;
    v.flatenArray = h.flatenArray;

    v.isNode = typeof window === 'undefined';
    v.isBrowser = !v.isNode;

    v.window = v.isNode ? require('html-element') : window;
    v.document = v.window.document;

    let patch = PatchFactory(v);

    function resetToDefaults() {
        v.isMounted = false;
        v.container = v.document.createElement('html');
        v.parent = v.document.createElement('div');
        v.parent.appendChild(v.container);
        v.rootTree = v.vnode(v.container);
        v.oldTree = Object.assign({}, v.rootTree);
    }    resetToDefaults();

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
    }
    function render(component, attributes = {}) {
        assignAttributes(component, attributes);

        let nodes = component.view();

        return Array.isArray(nodes) ? nodes : [nodes];
    }
    function addEvent(container, events, handler, useCapture){
        if (v.isBrowser){
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
        if (v.isBrowser){
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

        if (v.isBrowser && v.container){
            removeEvent(v.container, 'mouseup keyup', v.update);
        }

        v.container = v.isNode ? v.document.createElement('div') : typeof container === 'string' ? v.document.querySelectorAll(container)[0] : container;
        v.rootTree = v.vnode(v.container);
        v.oldTree = Object.assign({}, v.rootTree);

        if (v.isBrowser){
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
        }
        if (v.rootComponent){
            if (v.isNode) {
                resetToDefaults();
            }
    
            v.rootTree.children = render(v.rootComponent);
    
            // console.log('******************************');
            patch(v.rootTree.dom.parentElement, v.rootTree, v.oldTree);
            // console.log('******************************');
    
            v.oldTree = Object.assign({}, v.rootTree);
    
            if (!v.isMounted) {
                v.isMounted = true;
            }
        }
        
        return v.isNode ? require('he').decode(v.rootTree.dom.parentElement.innerHTML) : v.rootTree.dom.parentElement;
    }
    v.update = function (component, attributes = {}) {
        if (v.isBrowser){
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
    };

    v.routes.go = function (url, parentComponent) {
        if (v.isBrowser) {
            window.history.pushState({}, '', url);
        }
        return v.routes.run(url, parentComponent);
    };

    v.routes.init = function(){
        if (v.isBrowser) {
            addEvent(window, 'popstate', function (e) {
                v.routes.run(document.location.pathname);
            }, false);
            
            v.ready(() => {
                v.routes.run(document.location.pathname);
            });
        }
    };

    if (v.isBrowser){
        v.sw = {
            ready: false,
            file: '/sw.js',
            options: {scope: '/'},
            register(file = v.sw.file, options = v.sw.options){
                return navigator.serviceWorker.register(file, options)
                    .then(() => navigator.serviceWorker.ready)
                    .then(registration => {
                        v.sw.ready = true;
                        v.sw.file = file;
                        v.sw.options = options;
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve();
                            }, 10);
                        });
                    })
                    .catch(err => console.error('ServiceWorker registration failed: ', err))
            }
        };
    }

    if (v.isNode && typeof VNodeFactory !== 'undefined'){
        VNodeFactory(v);
    }

    v.new = VFactory;
    
    return v;
};

(typeof window === 'undefined'? global : window).v = VFactory();
//# sourceMappingURL=valyrian.esm.js.map
