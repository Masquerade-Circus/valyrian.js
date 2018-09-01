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
            continue;
        }

        array.push(middlewares[i]);
    }
    return array;
};

/**
 * @description Adds a path to a router
 * @method addPath
 * @param  {Router} router              The router in which to add the path
 * @param  {String} method              The method that will handle this path
 * @param  {Array} args                The mixed params (String|Function|Array)
 * @returns {Router}                    The router
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
        args[0].paths &&
        args[0].regexpList
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
            if (path) {
                subpath = path + (subpath || '*');
            }

            // If there is a subpath set it as the first element
            // on the submiddlewares array
            if (subpath) {
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
        if (path && router.regexpList[path] === undefined) {
            // Remove the last slash
            path = path.replace(/\/(\?.*)?$/gi, '$1');

            // Find the express like params
            let params = path.match(/:(\w+)?/gi) || [];

            // Set the names of the params found
            for (let i in params) {
                params[i] = params[i].slice(1);
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
                regexp: new RegExp('^' + regexpPath + '/?(\\?.*)?$', 'gi'),
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
     * @param  {String}    url     The path to call
     * @return {Any}           The final response
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
                parseMiddlewares(path.middlewares, middlewares);
                continue;
            }

            let reg = Router.regexpList[path.path];
            let matches = reg.regexp.exec(url);
            reg.regexp.lastIndex = -1;
            if (Array.isArray(matches)) {
                matches.shift();
                let regparams = reg.params;
                let l = regparams.length;
                for (; l--;) {
                    if (params[regparams[l]] === undefined) {
                        params[regparams[l]] = matches[l];
                    }
                }
                parseMiddlewares(path.middlewares, middlewares);
            }
        }

        Router.params = params;

        if (middlewares.length > 0) {
            let i = 0, l = middlewares.length;
            // call sequentially every middleware
            for (; i < l; i++) {
                response = await middlewares[i](params);
                // If there is a response
                // break the for block
                if (response) {
                    return response;
                }
            }
        }

        if (Router.throwNotFound) {
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

    // For each accepted method, add the method to the router
    Router.get = function () {
        return addPath(Router, 'get', v.utils.flat(arguments));
    };
    Router.use = function () {
        return addPath(Router, 'use', v.utils.flat(arguments));
    };

    /**
     * Return the new router
     * @type {Router}
     */
    return Router;
};


let plugin = function (v) {
    let mainRouter;
    let RoutesContainer;
    function runRoute(parentComponent, url, args) {
        return mainRouter(url)
            .then(response => {
                if (typeof response !== 'object') {
                    throw new Error('v.router.component.required');
                }

                if (!response.isComponent && typeof response.view === 'function') {
                    Object.assign(response, {isComponent: true});
                }

                if (!response.isComponent) {
                    throw new Error('v.router.component.required');
                }

                if (parentComponent) {
                    args.unshift(v(response, args));
                    response = parentComponent;
                }

                args.unshift(response);

                if (v.is.node || !v.is.mounted) {
                    args.unshift(RoutesContainer);
                    return v.mount.apply(v, args);
                }

                return v.update.apply(v, args);
            });
    };

    v.routes = function (elementContainer, router) {
        if (elementContainer && router) {
            mainRouter = router;
            RoutesContainer = elementContainer;
            // Activate the use of the router
            if (v.is.browser) {
                function onPopStateGoToRoute() {
                    v.routes.go(document.location.pathname);
                }
                window.addEventListener('popstate', onPopStateGoToRoute, false);
                onPopStateGoToRoute();
            }
        }
    };

    v.routes.get = function () {
        let routes = [];
        mainRouter.paths.forEach(path => {
            if (path.method === 'get') {
                routes.push(path.path === '' ? '/' : path.path);
            }
        });
        return routes;
    };

    v.routes.current = '/';
    v.routes.params = {};

    v.routes.go = function () {
        let args = v.utils.flat(arguments);
        let parentComponent;
        let url;

        if (typeof args[0] === 'object') {
            if (!args[0].isComponent && typeof args[0].view === 'function') {
                args[0] = Object.assign(args[0], {isComponent: true});
            }

            if (args[0].isComponent) {
                parentComponent = args.shift();
            }
        }

        if (typeof args[0] === 'string') {
            url = args.shift();
        }

        if (!url) {
            throw new Error('v.router.url.required');
        }

        if (v.is.browser) {
            window.history.pushState({}, '', url);
        }

        return runRoute(parentComponent, url, args);
    };

    v.Router = RouterFactory;
};

// module.exports = plugin;
export default plugin;
