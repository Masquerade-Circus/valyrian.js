
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

        Router.run = async function(url = Router.default) {
            let method = 'get',
                params = {},
                middlewares = [],
                response,
                i = 0,
                l = Router.paths.length;

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
                            m.update(response);
                            return;
                        }
                        m.mount(this.container, response, this.attributes);
                        return;
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
