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

export default RouterFactory;
