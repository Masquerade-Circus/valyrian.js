(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (factory());
}(this, (function () { 'use strict';

    /**
     * Handles the mix of single and array of middlewares
     * @method parseMiddlewares
     * @param  {Function|Array}         middlewares     // Middleware or array of middlewares
     * @param  {Array}                  [array=[]]      // The array to store the final list of middlewares
     * @return {Array}                                  // The final list of middlewares
     */
    var parseMiddlewares = function (middlewares, array) {
        if ( array === void 0 ) array = [];

        if (typeof middlewares === 'function') {
            array.push(middlewares);
            return array;
        }

        var i = 0, l = middlewares.length;
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
    var addPath = function (router, method, args) {
        var path, middlewares;

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
            var subrouter = args.shift(),
                i = 0,
                l = subrouter.paths.length;

            // For each path of the subrouter
            for (; i < l; i++) {
                var submiddlewares = subrouter.paths[i].middlewares;
                var submethod = subrouter.paths[i].method;
                var subpath = subrouter.paths[i].path;

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
                var params = path.match(/:(\w+)?/gi) || [];

                // Set the names of the params found
                for (var i$1 in params) {
                    params[i$1] = params[i$1].replace(':', '');
                }

                var regexpPath = path
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

    var RouterFactory = function () {
        /**
         * new Rotuer
         * @param  {Request}    req     NodeJs Request object
         * @param  {Response}   res     NodeJs Response object
         * @return {Function}           The async function to be passed to micro
         */
        var Router = async function (url) {
            if ( url === void 0 ) url = '/';

            var method = 'get',
                params = {},
                middlewares = [],
                response,
                i = 0,
                l = Router.paths.length;
            
            Router.url = url;

            for (; i < l; i++) {
                var path = Router.paths[i];
                if (method !== path.method && path.method !== 'use') {
                    continue;
                }

                if ((path.method === 'use' || method === path.method) && path.path === undefined) {
                    middlewares = parseMiddlewares(path.middlewares, middlewares);
                    continue;
                }

                var matches = Router.regexpList[path.path].regexp.exec(url);
                Router.regexpList[path.path].regexp.lastIndex = -1;
                if (Array.isArray(matches)) {
                    matches.shift();
                    var l$1 = Router.regexpList[path.path].params.length;
                    for (; l$1--;) {
                        if (params[Router.regexpList[path.path].params[l$1]] === undefined) {
                            params[Router.regexpList[path.path].params[l$1]] = matches[l$1];
                        }
                    }
                    middlewares = parseMiddlewares(path.middlewares, middlewares);
                }
            }

            Router.params = params;

            if (middlewares.length > 0) {
                var i$1 = 0, l$2 = middlewares.length;
                // call sequentially every middleware
                for (; i$1 < l$2; i$1++) {
                    response = await middlewares[i$1](params);
                    // If there is a response or a response was sent to the client
                    // break the for block
                    if (response !== undefined) {
                        return response;
                    }
                }
            }

            if (Router.throwNotFound){
                // If no response was sent to the client throw an error
                throw new Error(("The url " + url + " requested wasn't found"));
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
        ['get', 'use'].map(function (method) {
            Router[method] = function () {
                var args = [], len = arguments.length;
                while ( len-- ) args[ len ] = arguments[ len ];

                return addPath(Router, method, args);
            };
        });

        /**
         * Return the new router
         * @type {Router}
         */
        return Router;
    };

    var h = function () {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

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

        var nodes = h.flatenArray(args);

        for (i = 0, l = nodes.length; i < l; i++) {
            vnode.children.push(h.isVnode(nodes[i]) ? nodes[i] : h('textNode', nodes[i]));
        }

        return vnode;
    };

    h.flatenArray = function(nodes, array) {
        if ( array === void 0 ) array = [];

        if (!Array.isArray(nodes)) {
            array.push(nodes);
            return array;
        }

        var i = 0, l = nodes.length;
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
                children: Array.prototype.map.call($el.childNodes, function ($el) { return h.vnode($el); }),
                dom: $el
            };
        }
    };

    var Request = function (baseUrl, options) {
        if ( baseUrl === void 0 ) baseUrl = '';
        if ( options === void 0 ) options = {};

        var url = baseUrl.replace(/\/$/gi, '').trim(),
            opts = Object.assign({}, options);

        var methods = ['get', 'post', 'put', 'patch', 'delete'];

        var r = function (baseUrl, options) {
            var url = r.baseUrl + '/' + baseUrl,
                opts = Object.assign({}, r.options, options);
            return Request(url, opts);
        };

        r.apiUrl = undefined;
        r.nodeUrl = undefined;
        r.isNode = typeof window === 'undefined';
        r.options = opts;
        r.baseUrl = url;
        var Fetch = r.isNode ? require('node-fetch') : fetch.bind(window);

        function serialize(obj, prefix) {
            var e = encodeURIComponent;
            return '?' + Object.keys(obj).map(function (k) {
                if (prefix !== undefined) {
                    k = prefix + "[" + k + "]";
                }

                return typeof obj[k] === 'object' ?
                    serialize(obj[k], k) :
                    e(k) + '=' + e(obj[k]);
            }).join('&');
        }
        function parseUrl (url) {
            var u = (r.baseUrl + '/' + url).trim().replace(/^\/\//gi, '/').trim();
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
        function request(method, url, data, options) {
            if ( options === void 0 ) options = {};

            var opts = Object.assign({
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
                .then(function (response) {
                    if (response.status < 200 || response.status > 300) {
                        var err = new Error(response.statusText);
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
        methods.forEach(function (method) { return r[method] = function (url, data, options) { return request(method, url, data, options); }; }
        );

        return r;
    };

    var Request$1 = Request();

    var PatchFactory = function (v) {
        var document = v.document;

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

        function updateProps(newNode, oldNode) {
            if ( oldNode === void 0 ) oldNode = {};

            // const props = Object.assign({}, newProps, oldProps);
            var newProps = newNode.props,
                oldProps = oldNode.props || {};

            var props = Object.assign(
                {},
                newProps,
                oldProps
            );
            for (var name in props) {
                if (newProps[name] !== oldProps[name]) {
                    setProp(newNode.dom, name, newProps[name]);
                }
            }
        }

        function lifecycleCall(vnode, methodName) {
            return vnode.props && vnode.props[methodName] && vnode.props[methodName](vnode);
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

            for (var i = 0; i < vnode.children.length; i++) {
                $el.appendChild(createElement(vnode.children[i]));
            }

            lifecycleCall(vnode, 'oncreate');
            return $el;
        }

        function removeElement(oldNode, destroyed) {
            if ( destroyed === void 0 ) destroyed = false;

            return Promise.resolve(lifecycleCall(oldNode, 'onbeforeremove'))
                .then(function () {
                    if (!destroyed && oldNode.dom && oldNode.dom.parentElement) {
                        oldNode.dom.parentElement.removeChild(oldNode.dom);
                    }

                    var i = 0, l = oldNode.children.length;
                    for (; i < l; i++) {
                        removeElement(oldNode.children[i], destroyed);
                    }

                    lifecycleCall(oldNode, 'onremove');
                });
        }

        function patch($parent, newNode, oldNode) {

            // New node
            if (oldNode === undefined && newNode !== undefined) {
                $parent.appendChild(createElement(newNode));
            }

            // Deleted node
            if (newNode === undefined) {
                removeElement(oldNode);
            }

            if (h.isVnode(oldNode) && h.isVnode(newNode)) {
                newNode.dom = oldNode.dom;

                // Same node
                if (newNode.name === 'textNode' && oldNode.value == newNode.value) {
                    return $parent;
                }

                // New node replacing old node
                if (
                    (newNode.name === 'textNode' && newNode.value != oldNode.value) ||
                    newNode.name !== oldNode.name
                ) {
                    createElement(newNode);
                    Promise.resolve(removeElement(oldNode, true))
                        .then(function () {
                            $parent.replaceChild(newNode.dom, oldNode.dom);
                        });
                    return $parent;
                }

                // if (!v.isMounted) {
                //     lifecycleCall(newNode, 'oninit');
                //     lifecycleCall(newNode, 'oncreate');
                // }

                updateProps(newNode, oldNode);

                var max = Math.max(newNode.children.length, oldNode.children.length);
                for (var i = 0; i < max; i++) {
                    patch(
                        newNode.dom,
                        newNode.children[i],
                        oldNode.children[i]
                    );
                }

                lifecycleCall(newNode, 'onupdate');
            }

            return $parent;
        }
        return patch;
    };

    var v = function () {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

        if (isComponent(args[0])) {
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
    Object.keys(Request$1).forEach(function (key) {
        if (typeof Request$1[key] === 'function'){
            v[key] = function () {
                var args = [], len = arguments.length;
                while ( len-- ) args[ len ] = arguments[ len ];

                return Request$1[key]
                .apply(Request$1, args)
                .then(function (res) {
                    v.update();
                    return res;
                });
            };
        }
    });

    v.router = RouterFactory;
    v.isNode = typeof window === 'undefined';
    v.isBrowser = !v.isNode;

    v.window = v.isNode ? require('html-element') : window;
    v.document = v.window.document;

    var patch = PatchFactory(v);

    function resetToDefaults() {
        v.isMounted = false;
        v.container = v.document.createElement('html');
        v.parent = v.document.createElement('div');
        v.parent.appendChild(v.container);
        v.rootTree = h.vnode(v.container);
        v.oldTree = Object.assign({}, v.rootTree);
    }resetToDefaults();

    v.rootComponent = undefined;

    function assignAttributes(component, attributes) {
        if ( attributes === void 0 ) attributes = {};

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
    function render(component, attributes) {
        if ( attributes === void 0 ) attributes = {};

        assignAttributes(component, attributes);

        var nodes = component.view();

        return Array.isArray(nodes) ? nodes : [nodes];
    }
    function addEvent(container, events, handler, useCapture){
        if (v.isBrowser){
            events.split(' ').forEach(function (event) {
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
            events.split(' ').forEach(function (event) {
                container.removeEventListener(
                    event,
                    handler
                );
            });
        }
    }

    v.mount = function (container, component, attributes) {
        if ( attributes === void 0 ) attributes = {};

        if (container === undefined) {
            throw new Error('A container element is required as first element');
            return;
        }

        if (!isComponent(component)) {
            throw new Error('A component is required as a second argument');
            return;
        }

        if (v.isBrowser && v.container){
            removeEvent(v.container, 'mouseup keyup', v.update);
        }

        v.container = v.isNode ? v.document.createElement('div') : typeof container === 'string' ? v.document.querySelectorAll(container)[0] : container;
        v.rootTree = h.vnode(v.container);
        v.oldTree = Object.assign({}, v.rootTree);

        if (v.isBrowser){
            addEvent(v.container, 'mouseup keyup', v.update, false);
        }

        return v.update(component, attributes);
    };

    function redraw(component, attributes){
        if ( attributes === void 0 ) attributes = {};

        if (isComponent(component)) {
            assignAttributes(component, attributes);
            v.rootComponent = component;
            v.rootTree.props = {};
            Object.keys(v.rootComponent).forEach(function (prop) {
                if (typeof v.rootComponent[prop] === 'function') {
                    v.rootTree.props[prop] = function () {
                        var args = [], len = arguments.length;
                        while ( len-- ) args[ len ] = arguments[ len ];

                        return v.rootComponent[prop].apply(v.rootComponent, args);
                    };
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
    v.update = function (component, attributes) {
        if ( attributes === void 0 ) attributes = {};

        if (v.isBrowser){
            requestAnimationFrame(function () { return redraw(component, attributes); });
            return;
        }
        return redraw(component, attributes);
    };

    function isComponent(component) {
        return typeof component === 'object' &&
            component !== null &&
            typeof component.view === 'function';
    }
    v.routes = function(container, router) {
        if (container && router){
            v.routes.router = router;
            v.routes.container = container;
            // Activate the use of the router
            v.routes.init();
            return;
        }
        
        var routes = [];
        v.routes.router.paths.forEach(function (path) {
            if (path.method === 'get') {
                routes.push(path.path === '' ? '/' : path.path);
            }
        });
        return routes;
    };

    v.routes.run = async function(url, parentComponent){
        if ( url === void 0 ) url = '/';
        if ( parentComponent === void 0 ) parentComponent = undefined;

        var response = await v.routes.router(url);
        if (!isComponent(response)){
            var r = response;
            response = {view: function view(){return r}};
        }

        if (parentComponent){
            var c = response;
            response = {view: function view(){return v(parentComponent, v(c))}};
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
            
            v.ready(function () {
                v.routes.run(document.location.pathname);
            });
        }
    };

    if (v.isBrowser){
        v.sw = {
            ready: false,
            file: '/sw.js',
            options: {scope: '/'},
            register: function register(file, options){
                if ( file === void 0 ) file = v.sw.file;
                if ( options === void 0 ) options = v.sw.options;

                return navigator.serviceWorker.register(file, options)
                    .then(function () { return navigator.serviceWorker.ready; })
                    .then(function (registration) {
                        v.sw.ready = true;
                        v.sw.file = file;
                        v.sw.options = options;
                        return new Promise(function (resolve, reject) {
                            setTimeout(function () {
                                resolve();
                            }, 10);
                        });
                    })
                    .catch(function (err) { return console.error('ServiceWorker registration failed: ', err); })
            }
        };
    }

    if (v.isNode && typeof VNodeFactory !== 'undefined'){
        VNodeFactory(v);
    }

    (v.isNode ? global : window).v = v;

    console.log({v: v});

})));
//# sourceMappingURL=valyrian.js.map
