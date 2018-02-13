/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

(function(){
    let VFactory = function(){

        let Router = __webpack_require__(1);
        let h = __webpack_require__(2);
        let S = __webpack_require__(3);
        let Request = __webpack_require__(4);
        let Patch = __webpack_require__(6);

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

        v.isNode = typeof window === 'undefined';

        var w = v.isNode ? __webpack_require__(7) : window,
            document = w.document;

        var lifecycle = [];

        var patch = Patch(w);

        // node to vnode
        var vnode = function(element) {
            if (element){
                return {
                  name: element.nodeName.toLowerCase(),
                  props: {},
                  children: Array.prototype.map.call(element.childNodes, (element) => {
                      return element.nodeType === 3
                        ? element.nodeValue
                        : vnode(element);
                  })
                };
            }
        };

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

        v.getFixedFrameRateMethod = function(fps = 5, callback) {
            let time,
                previousTime = v.clock(),
                method = function () {
                    time = v.clock();
                    if (v.clock(previousTime) > 1000 / fps) {
                        previousTime = time;
                        if (typeof callback === 'function') {
                            if (typeof requestAnimationFrame === 'function') {
                                requestAnimationFrame(callback.bind(this));
                            } else {
                                callback.call(this);
                            }
                        }
                    }
                };

            return method;
        };

        var mounted = false;
        v.container = document.createElement('div');
        var oldTree = vnode();
        var newTree = undefined;
        var rootComponent = undefined;

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
              oldTree = vnode(container.children[0]);
          }

          rootComponent = component;
          v.container = container;
          mounted = true;
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
              rootComponent = component;
          };

          newTree = v.render(rootComponent);
          console.log('******************************');
          v.container = patch(v.container, newTree, oldTree);
          console.log('******************************');
          oldTree = newTree;
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


/***/ }),
/* 1 */
/***/ (function(module, exports) {


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
                    .replace(/:(\w+)/gi, '([^\\s\\/]+)')
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


    let RouterFactory = (v, options = {}) => {
        let opt = Object.assign({}, {
            acceptedMethods: ['get','use'] // The methods that will be handled by the router
        }, options);

        /**
         * new Rotuer
         * @return {Function}           The async function to be passed to micro
         */
        const Router = function(container, mainComponent, attributes = {}) {
            Router.container = container;
            Router.attributes = attributes;
            // This is the component that will be used on the backend to serve the initial load
            Router.mainComponent = mainComponent;
            return Router;
        };

        Router.default = '/';
        Router.params = {};

        Router.run = async function(url = Router.default, attributes = {}) {
            let method = 'get',
                middlewares = [],
                response,
                i = 0,
                l = Router.paths.length;

            Router.params = {};
            v.assignAttributes(Router, attributes);

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
                        if (Router.params[Router.regexpList[path.path].params[l]] === undefined) {
                            Router.params[Router.regexpList[path.path].params[l]] = matches[l];
                        }
                    }
                    middlewares = parseMiddlewares(path.middlewares, middlewares);
                }
            }

            if (middlewares.length > 0) {

                let i = 0, l = middlewares.length;
                // call sequentially every middleware
                for (; i < l; i++) {
                    response = await middlewares[i]();
                    // If there is a response and the response is a component
                    // break the for block
                    if (v.isComponent(response)) {
                        break;
                    }
                }

                // If there is a response and no other response was sent to the client
                // return the response
                if (v.isComponent(response)) {
                    this.attributes.params = this.params;

                    if (this.isNode){
                        if (v.mounted){
                            return v.update(this.mainComponent, v(response, this.attributes));
                        }
                        return v.mount(this.container, this.mainComponent, v(response, this.attributes));
                    }

                    if (v.mounted){
                        return v.update(response, this.attributes);
                    }
                    return v.mount(this.container, response, this.attributes);
                }
            }


            throw new Error(`The url ${url} requested by ${method}, wasn't found`);
        };

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
        opt.acceptedMethods.map(method => {
            Router[method] = (...args) => addPath(Router, method, args);
        });

        Router.isNode = typeof window === 'undefined';

        Router.go = function(url, attributes = {}){
            if (!Router.isNode){
                if (typeof url === 'number'){
                    window.history.go(url);
                    return;
                };
                window.history.pushState({},'',url);
            }
            return Router.run(url, attributes);
        };

        if (!Router.isNode){
            Router.back = () => window.history.back();
            Router.forward = () => window.history.forward();

            window.addEventListener("popstate", function(e) {
              Router.run(document.location.pathname);
            }, false);

	        window.document.addEventListener(
                /https?:\/\//.test(window.document.URL) ?
                    'DOMContentLoaded' :
                    'deviceready',
                function(){
                    Router.run(document.location.pathname);
                },
                false
            );
        }

        /**
         * Return the new router
         * @type {Router}
         */
        return Router;
    };

module.exports = RouterFactory;


/***/ }),
/* 2 */
/***/ (function(module, exports) {

let h = function(...args) {
    var vnode = {
            name: 'div',
            props: {},
            children: []
        },
        l,
        i,
        attributes,
        children;

    if (typeof args[0] === 'string'){
        vnode.name = args.shift();
    }

    if (typeof args[0] === 'object' && !Array.isArray(args[0])){
        vnode.props = args.shift();
    }

    if(/(\.|\[|#)/gi.test(vnode.name)){
        attributes = vnode.name.match(/([\.|\#]\w+|\[[^\]]+\])/gi);
        vnode.name = vnode.name.replace(/([\.|\#]\w+|\[[^\]]+\])/gi, '');
        if (attributes){
            for(l = attributes.length; l--;){
                if (attributes[l].charAt(0) === '#'){
                    vnode.props.id = attributes[l].slice(1);
                    continue;
                }

                if (attributes[l].charAt(0) === '.'){
                    vnode.props.class = ((vnode.props.class || '') + ' ' + attributes[l].slice(1)).trim();
                    continue;
                }

                if (attributes[l].charAt(0) === '['){
                    attributes[l] = attributes[l].trim().slice(1,-1).split('=');
                    vnode.props[attributes[l][0]] = attributes[l][1];
                }
            }
        }
    }

    for (i = 0, l = args.length; i<l; i++){
        if(Array.isArray(args[i])){
            vnode.children.push.apply(vnode.children, args[i]);
            continue;
        }
        vnode.children.push(args[i]);
    }

    return vnode;
};

module.exports = h;


/***/ }),
/* 3 */
/***/ (function(module, exports) {

let SFactory = function(v){
    let s = {
        storeUpdateMethods: [],
        onStoreUpdate(onupdate) {
            if (typeof onupdate === 'function') {
                s.storeUpdateMethods.push(onupdate);
            }
        },
        storeUpdated: v.getFixedFrameRateMethod(60, function () {
            var l = s.storeUpdateMethods.length,
                i = 0,
                response,
                promises = [];

            for (; i < l; i++) {
                promises.push(Promise.resolve(s.storeUpdateMethods[i]()));
            }

            return Promise.all(promises);
        }),
        /**
         * Simple Getter Setter
         * Can call a given function when updated
         * @param Any
         * @param function (optional)
         * @return function
         */
        storeData(val, onchange) {
            let previousVal = undefined, newval = undefined, ret;
            /**
             * Returned function
             * If param is provided, sets the current value to this param,
             * call the function if any and return the final value.
             * You can process the value provided in the function by accessing it with this.val
             * If no param is provided, gets the current value
             * @param Any (optional)
             */
            ret = function (val) {
                if (val !== undefined) {
                    ret.value = val;
                }

                return ret.valueOf();
            };

            ret.toString = function () {
                return ret.valueOf().toString();
            };

            ret.valueOf = function () {
                if (typeof ret.value === 'function') {
                    newval = ret.value();
                }

                if (typeof ret.value !== 'function') {
                    newval = ret.value;
                }

                if (newval !== previousVal) {
                    if (typeof onchange === 'function') {
                        onchange.apply(ret, [previousVal, newval]);
                    }
                    s.storeUpdated();
                }

                previousVal = newval;

                return newval;
            };

            ret(val);

            return ret;
        }
    };
    return s;
};


module.exports = SFactory;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

let Request = function (baseUrl = '', options = {}) {
    let url = baseUrl.replace(/\/$/gi, '').trim(),
        opts = Object.assign({}, options);

    let methods = ['get','post','put','patch','delete','options'];

    let r = function (baseUrl, options) {
        let url = r.baseUrl + '/' + baseUrl,
            opts = Object.assign({},r.options, options);
        return Request(url, opts);
    };

    r.apiUrl = undefined;
    r.nodeUrl = undefined;
    r.isNode = typeof window === 'undefined';
    r.options = opts;
    r.baseUrl = url;
    r.fetch = r.isNode ? __webpack_require__(5) : fetch.bind(window);

    r.serialize = function (obj, prefix) {
        let e = encodeURIComponent;
        return '?' + Object.keys(obj).map(k => {
            if (prefix !== undefined){
                k = prefix + "["+k+"]";
            }

            return typeof obj[k] === 'object' ?
                r.serlialize(obj[k], k) :
                e(k) + '=' + e(obj[k]);
        }).join('&');
    };

    r.request = function(method, url, data, options = {}){
        let opts = Object.assign({
                method: method.toLowerCase(),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }, r.options, options),
            type = opts.headers.Accept;

        if(data !== undefined){
            if (opts.method === 'get' && typeof data === 'object'){
                url += data = r.serialize(data);
            }

            if (opts.method !== 'get'){
                opts.body = JSON.stringify(data);
            }
        }

        return r.fetch(r.parseUrl(url), opts)
            .then(response => {
                if (response.status < 200 || response.status > 300) {
                    let err = new Error(response.statusText);
                    err.response = response;
                    throw err;
                }

                if (/text/gi.test(type)){
                    return response.text();
                }

                if (/json/gi.test(type)){
                    return response.json();
                }

                return response;
            });
    };

    r.parseUrl = function(url){
        let u = (r.baseUrl+'/'+url).trim().replace(/^\/\//gi,'/').trim();
        if (
            r.isNode &&
            typeof r.nodeUrl === 'string'
        ){
            r.nodeUrl = r.nodeUrl.replace(/\/$/gi,'').trim();

            if (/^http/gi.test(u) && typeof r.apiUrl === 'string'){
                r.apiUrl = r.apiUrl.replace(/\/$/gi,'').trim();
                u = u.replace(r.apiUrl, r.nodeUrl);
            }

            if (!/^http/gi.test(u)){
                u = r.nodeUrl + u;
            }
        }
        return u;
    };

    methods.forEach(method =>
        r[method] = (url, data, options) => r.request(method, url, data, options)
    );

    return r;
};

module.exports = Request;


/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = nodeFetch;

/***/ }),
/* 6 */
/***/ (function(module, exports) {

let PatchFactory = function(window){
    let document = window.document;

    function setProp($target, name, value) {
      if (name === 'className') {
        $target.setAttribute('class', value);
        return;
      }

      if (typeof value === 'function') {
      	$target[name] = value.bind ? value.bind($target) : value;
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

    function updateProps($target, newProps, oldProps = {}) {
      const props = Object.assign({}, newProps, oldProps);
      for (let name in props){
        if (newProps[name] !== oldProps[name]) {
          setProp($target, name, newProps[name]);
        }
      }
    }

    function createElement(node) {
        var $el = node && node.name ?
            node.name === "svg" ?
                document.createElementNS("http://www.w3.org/2000/svg", node.name) :
                document.createElement(node.name) :
            document.createTextNode(node);

            if (node && node.props){
                updateProps($el, node.props);
            }

            if (node && node.children){
              for (let i = 0; i < node.children.length; i++){
                $el.appendChild(createElement(node.children[i]));
              }
            }

            return $el;
    }

    function removeElement($parent, index){
        console.log(Array.isArray($parent.childNodes));
        $parent.removeChild($parent.childNodes[index]);
    }

    function patch($parent, newNode, oldNode, index = 0) {
      if (oldNode == newNode){
          console.log(1, newNode);
      } else if (!oldNode) {
          console.log(2, $parent, newNode);
        $parent.appendChild(createElement(newNode));
      } else if (!newNode) {
          console.log(3, newNode);
          removeElement($parent, index);
      } else if (typeof newNode !== typeof oldNode || newNode.name !== oldNode.name) {
          console.log(4, newNode, oldNode, newNode !== oldNode);
        $parent.replaceChild(createElement(newNode),$parent.childNodes[index]);
      } else if (newNode.name) {
          console.log(5, newNode, $parent, index, $parent.childNodes[index]);
          console.log(typeof newNode, typeof oldNode, newNode.name, oldNode.name);
        updateProps(
          $parent.childNodes[index],
          newNode.props,
          oldNode.props
        );
        const newLength = newNode.children.length;
        const oldLength = oldNode.children.length;
        for (let i = 0; i < newLength || i < oldLength; i++) {
          patch(
            $parent.childNodes[index],
            newNode.children[i],
            oldNode.children[i],
            i
          );
        }
      }

      return $parent;
    };

    return patch;
};

module.exports = PatchFactory;


/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = htmlElement;

/***/ })
/******/ ]);
//# sourceMappingURL=index.js.map