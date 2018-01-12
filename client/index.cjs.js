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
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* WEBPACK VAR INJECTION */(function(global) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__dist__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__dist___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__dist__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__store__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__store___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__store__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__components__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__components___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__components__);




if (m.isNode){
    global.Store = __WEBPACK_IMPORTED_MODULE_1__store___default.a;
    global.Components = __WEBPACK_IMPORTED_MODULE_2__components___default.a;
} else {
    window.Store = __WEBPACK_IMPORTED_MODULE_1__store___default.a;
    window.Components = __WEBPACK_IMPORTED_MODULE_2__components___default.a;
}



m.router(m.isNode ? m.container : document.body)
    // Use middlewares available for all requests
    .use(() => console.log('ok'))
    .get('/', () => console.log('Also ok'))
    .get('/', [
        () => console.log('Init'),
        () => {
            return m.isNode ? __WEBPACK_IMPORTED_MODULE_2__components___default.a.Home : __WEBPACK_IMPORTED_MODULE_2__components___default.a.Hello;
        }
    ])
    .get('/hello', () => __WEBPACK_IMPORTED_MODULE_2__components___default.a.Hello)
    .get('/counter', () => __WEBPACK_IMPORTED_MODULE_2__components___default.a.Counter);

if (!m.isNode){
    setTimeout(function () {
        console.log('hello');
        __WEBPACK_IMPORTED_MODULE_1__store___default.a.hello('Hola');
    }, 5000);

    setTimeout(function () {
        console.log('world');
        __WEBPACK_IMPORTED_MODULE_1__store___default.a.name('Mundo');
    }, 7000);

    // setTimeout(function(){
    //     m.router.go('/counter');
    // }, 10000);
}


console.log(m.isNode);

// m.mount(document.body, Components.Hello);

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(1)))

/***/ }),
/* 1 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(process) {/******/ (function(modules) { // webpackBootstrap
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

let Router = __webpack_require__(1);

(function(){
    let m = function (...args) {
        if (
            typeof args[0] === 'object' &&
            args[0] !== null &&
            typeof args[0].view === 'function'
        ) {
            return m.render.apply(m,args);
        }

        return m.h.apply(m.h, args);
    };

    m.router = Router();

    m.isNode = typeof window === 'undefined';

    m.mounted = false;

    var w = m.isNode ? __webpack_require__(2) : window,
        document = w.document;

    m.clock = function(start) {
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

    m.getFixedFrameRateMethod = function(fps = 5, callback) {
        let ref = this,
            time,
            previousTime = ref.clock(),
            method = function () {
                time = ref.clock();
                if (ref.clock(previousTime) > 1000 / fps) {
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

    m.lifecycle = [];

    m.h = function(...args) {
        var vnode = {
                name: 'div',
                props: {},
                children: []
            },
            l,
            i;

        if (typeof args[0] === 'string'){
            vnode.name = args.shift();
        }

        if (typeof args[0] === 'object' && !Array.isArray(args[0])){
            vnode.props = args.shift();
        }

        for (i = 0, l = args.length; i<l; i++){
            if (typeof args[i] === 'function'){
                vnode.children.push(args[i]());
                continue;
            }
            if(Array.isArray(args[i])){
                vnode.children.push.apply(vnode.children, args[i]);
                continue;
            }
            vnode.children.push(args[i]);
        }

        console.log(vnode);

        return vnode;
    };

    // node to vnode
    m.vnode = function(element) {
        if (element){
            return {
              name: element.nodeName.toLowerCase(),
              props: {},
              children: Array.prototype.map.call(element.childNodes, (element) => {
                  return element.nodeType === 3
                    ? element.nodeValue
                    : this.vnode(element);
              })
            };
        }
    };

    m.copy = function(a, b) {
        var target = {};

        for (var i in a) target[i] = a[i];
        for (var i in b) target[i] = b[i];

        return target;
    };

    m.getKey = function(node) {
        return node && node.props ? node.props.key : null;
    };

    m.setElementProp = function(element, name, value, isSVG, oldValue) {
        if (name === "key") {
            return;
        }

        if (name === "style") {
            for (var i in this.copy(oldValue, value)) {
                element[name][i] = value == null || value[i] == null ? "" : value[i];
            }
            return;
        }

        if (typeof value === "function" || (name in element && !isSVG)) {
            element[name] = value == null ? "" : value;
            return;
        }

        if (value != null && value !== false) {
            element.setAttribute(name, value);
            return;
        }

        if (value == null || value === false) {
            element.removeAttribute(name);
            return;
        }
    };

    m.createElement = function(node, isSVG) {
        var name,
            i = 0,
            element = node && node.name
                ? (isSVG === true || node.name === "svg")
                    ? document.createElementNS("http://www.w3.org/2000/svg", node.name)
                    : document.createElement(node.name)
                : document.createTextNode(node);

        if (node && node.props) {
            if (node.props.oncreate) {
              this.lifecycle.push(function () {
                node.props.oncreate(element);
              });
            }

            for (; i < node.children.length; i++) {
              element.appendChild(this.createElement(node.children[i], isSVG));
            }

            for (name in node.props) {
              this.setElementProp(element, name, node.props[name], isSVG);
            }
        }

        return element;
    };

    m.updateElement = function(element, oldProps, props, isSVG) {
        var name;
        for (name in this.copy(oldProps, props)) {
          if (
            props[name] !==
            (name === "value" || name === "checked"
              ? element[name]
              : oldProps[name])
          ) {
            this.setElementProp(element, name, props[name], isSVG, oldProps[name]);
          }
        }

        if (props && props.onupdate) {
          this.lifecycle.push(function () {
            props.onupdate(element, oldProps, props);
          });
        }
    };

    m.removeChildren = function(element, node, props) {
        if (node !== undefined){
            var props = node.props;
            if (props) {
              for (var i = 0; i < node.children.length; i++) {
                this.removeChildren(element.childNodes[i], node.children[i]);
              }

              if (props.ondestroy) {
                props.ondestroy(element);
              }
            }
        }
      return element;
    };

    m.removeElement = function(parent, element, node) {
        var done = () => parent.removeChild(this.removeChildren(element, node));

      if (node.props && node.props.onremove){
          node.props.onremove(element, done);
          return;
      }

      done();
    };

    m.patch = function(parent, element, oldNode, node, isSVG, nextSibling) {
      if (node === oldNode) {

      } else if (oldNode == null) {

        element = parent.insertBefore(this.createElement(node, isSVG), element);

      } else if (
          node.name &&
          node.name ===
          oldNode.name
      ) {
        this.updateElement(
          element,
          oldNode.props,
          node.props,
          (isSVG === true || node.name === "svg")
        );

        var oldElements = [];
        var oldKeyed = {};
        var newKeyed = {};

        for (var i = 0; i < oldNode.children.length; i++) {
          oldElements[i] = element.childNodes[i];

          var oldChild = oldNode.children[i];
          var oldKey = this.getKey(oldChild);

          if (null != oldKey) {
            oldKeyed[oldKey] = [oldElements[i], oldChild];
          }
        }

        var i = 0;
        var j = 0;

        while (j < node.children.length) {
          var oldChild = oldNode.children[i];
          var newChild = node.children[j];

          var oldKey = this.getKey(oldChild);
          var newKey = this.getKey(newChild);

          if (newKeyed[oldKey]) {
            i++;
            continue;
          }

          if (newKey == null) {
            if (oldKey == null) {
              this.patch(element, oldElements[i], oldChild, newChild, isSVG);
              j++;
            }
            i++;
          } else {
            var recyledNode = oldKeyed[newKey] || [];

            if (oldKey === newKey) {
              this.patch(element, recyledNode[0], recyledNode[1], newChild, isSVG);
              i++;
            } else if (recyledNode[0]) {
              this.patch(
                element,
                element.insertBefore(recyledNode[0], oldElements[i]),
                recyledNode[1],
                newChild,
                isSVG
              );
            } else {
              this.patch(element, oldElements[i], null, newChild, isSVG);
            }

            j++;
            newKeyed[newKey] = newChild;
          }
        }

        while (i < oldNode.children.length) {
          var oldChild = oldNode.children[i];
          if (this.getKey(oldChild) == null) {
            this.removeElement(element, oldElements[i], oldChild);
          }
          i++;
        }

        for (var i in oldKeyed) {
          if (!newKeyed[oldKeyed[i][1].props.key]) {
            this.removeElement(element, oldKeyed[i][0], oldKeyed[i][1]);
          }
        }
      } else if (node.name === oldNode.name) {
        element.nodeValue = node;
      } else {
        element = parent.insertBefore(
          this.createElement(node, isSVG),
          (nextSibling = element)
        );
        this.removeElement(parent, nextSibling, oldNode);
      }
      return element;
    };

    m.s = {
        storeUpdateMethods: [],
        onStoreUpdate(onupdate) {
            if (typeof onupdate === 'function') {
                this.storeUpdateMethods.push(onupdate);
            }
        },
        storeUpdated: m.getFixedFrameRateMethod(60, function () {
            var l = this.storeUpdateMethods.length,
                i = 0,
                response,
                promises = [];

            for (; i < l; i++) {
                promises.push(Promise.resolve(this.storeUpdateMethods[i]()));
            }

            return Promise.all(promises);
        }),
        storeRoot(func, onchange) {
            return this.data.apply(this, [func, onchange]);
        },
        /**
         * Simple Getter Setter
         * Can call a given function when updated
         * @param Any
         * @param function (optional)
         * @return function
         */
        storeData(val, onchange) {
            let previousVal = undefined, newval = undefined, ret, s = this;
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

    m.data = function(...args) {
        return this.s.storeData.apply(this.s, args);
    };

    m.onStoreUpdate = function(...args) {
        return this.s.onStoreUpdate.apply(this.s, args);
    };

    m.onStoreUpdate(function(){
        m.update();
    });

    m.mounted = false;
    m.container = document.createElement('div');
    m.root = undefined;
    m.tree = m.vnode(m.root);

    m.mount = function(container, component, attributes = {}){
        if (container === undefined){
            throw new Error('A container element is required as first element');
            return;
        }

        if (component === undefined ||
            component.view === undefined
        ){
            throw new Error('A component is required as a second argument');
            return;
        }

      component.attributes = Object.assign({}, component.attributes, attributes);

      this.root = m.isNode ? m.root : (container && container.children[0]);
      this.tree = this.vnode(this.root);
      this.component = component;
      this.container = container;
      this.mounted = true;
      return this.update();
    };

    m.render = function (component, attributes = {}) {
        if (
            component === undefined ||
            component.view === undefined
        ){
            return;
        }

        component.attributes = Object.assign({}, component.attributes, attributes);

        return component.view();
    };

    m.update = function(component, attributes = {}){
      var next;
      if (typeof component === 'object' && typeof component.view === 'function'){
        this.component = component;
        this.component.attributes = Object.assign({}, component.attributes, attributes);
      };

      this.newTree = this.render(this.component);
      this.root = this.patch(this.container, this.root, this.tree, this.newTree);
      this.tree = this.newTree;
      while ((next = this.lifecycle.pop())) next();
      return m.isNode ? this.root.outerHTML : this.root;
    };

    this.m = m;
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


    let RouterFactory = (options = {}) => {
        let opt = Object.assign({}, {
            acceptedMethods: ['get','use'] // The methods that will be handled by the router
        }, options);

        /**
         * new Rotuer
         * @return {Function}           The async function to be passed to micro
         */
        const Router = function(container, defaultRoute = '/', attributes = {}) {
            Router.container = container;
            Router.default = defaultRoute;
            Router.attributes = attributes;
            return Router;
        };

        Router.default = '/';

        Router.run = async function(url = Router.default, attributes = {}) {
            let method = 'get',
                params = {},
                middlewares = [],
                response,
                i = 0,
                l = Router.paths.length;

            Router.attributes = attributes;

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

            if (middlewares.length > 0) {

                let i = 0, l = middlewares.length;
                // call sequentially every middleware
                for (; i < l; i++) {
                    response = await middlewares[i]();
                    // If there is a response
                    // break the for block
                    if (response !== undefined) {
                        break;
                    }
                }

                // If there is a response and no other response was sent to the client
                // return the response
                if (response !== undefined) {
                    if (response.view !== undefined){
                        if (m.mounted){
                            return m.update(response, this.attributes);
                        }
                        return m.mount(this.container, response, this.attributes);
                    }
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

        Router.go = function(url){
            if (!Router.isNode){
                if (typeof url === 'number'){
                    window.history.go(url);
                    return;
                };
                window.history.pushState({},'',url);
            }
            Router.run(url);
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

module.exports = htmlelement;

/***/ })
/******/ ]);
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(3)))

/***/ }),
/* 3 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 4 */
/***/ (function(module, exports) {

let Store = {
    hello: m.data('hello'),
    name: m.data('name'),
    count: m.data(2)
};

Store.message = m.data(() => Store.hello + ' ' + Store.name);

module.exports = Store;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

let Home = __webpack_require__(6),
    Hello = __webpack_require__(7),
    Counter = __webpack_require__(8)
;

module.exports = {
    Home,
    Hello,
    Counter
};


/***/ }),
/* 6 */
/***/ (function(module, exports) {

let Main = {
    view() {
        return m('div', [
            Main.attributes.children,
            // m('script', {src: 'lib.js'}),
            m('script', {src: 'index.js'})
        ]);
    }
};

module.exports = Main;


/***/ }),
/* 7 */
/***/ (function(module, exports) {

let Hello = {
    view() {
        return m('div', Store.message());
    }
};

module.exports = Hello;


/***/ }),
/* 8 */
/***/ (function(module, exports) {

var Counter = {
    down: value => {
        Store.count(Store.count - value);
    },
    up: value => {
        Store.count(Store.count + value);
    },
    view: () => {
          return m("div", [
            m("h1", Store.count),
            m("button", { onclick: () => Counter.down(1) }, "-"),
            m("button", { onclick: () => Counter.up(1) }, "+"),
            m("button", { onclick: () => Store.hello('aloha') }, "Aloha"),
            m("button", { onclick: () => m.router.go('/hello') }, "<"),
            m("button", { onclick: () => m.router.go(-1) }, "-1"),
            m("button", { onclick: () => m.router.back() }, "back"),
            m("button", { onclick: () => m.router.forward() }, "forward"),
            m([
                Store.count() === 2 ? m(2) : '',
                m('br'),
                m(true),
                m('br'),
                m('Ok'),
                m('br'),
                m({},{}),
                m('br'),
                m(null),
                m('br'),
                m(undefined),
                m('br'),
                m(function(){
                    return m('h1','ok2');
                })
            ])
        ]);
    }
};

module.exports = Counter;


/***/ })
/******/ ]);