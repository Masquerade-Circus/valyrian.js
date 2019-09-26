

let plugin = function (v) {
  function flat(array) {
    return Array.isArray(array) ? array.flat(Infinity) : [array];
  }

  let addPath = (router, method, path, middlewares, i) => {
    if (middlewares.length === 0) {
      return;
    }

    let realpath = path.replace(/(\S)(\/+)$/, '$1');

    // Find the express like params
    let params = realpath.match(/:(\w+)?/gi) || [];

    // Set the names of the params found
    for (i in params) {
      params[i] = params[i].slice(1);
    }

    let regexpPath = '^' + realpath
      .replace(/:(\w+)/gi, '([^\\/\\s]+)')
      + '$';

    router.paths.push({
      method,
      path: realpath,
      middlewares: flat(middlewares),
      params,
      regexp: new RegExp(regexpPath, 'i')
    });
  };

  function parseQuery(queryParts) {
    let parts = queryParts ? queryParts.split('&', 20) : [];
    let query = {};
    let i = 0;
    let nameValue;

    for (; i < parts.length; i++) {
      nameValue = parts[i].split('=', 2);
      query[nameValue[0]] = nameValue[1];
    }

    return query;
  }

  function searchMiddlewares(router, path) {
    let i;
    let k;
    let item;
    let match;
    let key;
    let middlewares = [];
    let params = {};
    let matches = [];
    router.params = {};
    router.path = '';
    router.matches = [];

    // Search for middlewares
    for (i = 0; i < router.paths.length; i++) {
      item = router.paths[i];

      match = item.regexp.exec(path);
      // If we found middlewares
      if (Array.isArray(match)) {
        middlewares.push.apply(middlewares, item.middlewares);
        match.shift();

        // Parse params
        for (k = 0; k < item.params.length; k++) {
          key = item.params[k];
          params[key] = match.shift();
        }

        while (match.length) {
          matches.push(match.shift());
        }

        if (item.method === 'get') {
          router.path = item.path;
          break;
        }
      }
    }

    router.params = params;
    router.matches = matches;

    return middlewares;
  }

  async function searchComponent(router, middlewares) {
    let response;
    let item = false;
    let req = {
      params: router.params,
      query: router.query,
      url: router.url,
      path: router.path,
      matches: router.matches
    };
    let i = 0;

    for (; i < middlewares.length; i++) {
      response = await middlewares[i](req, response);

      if (response !== undefined) {
        if (!response.view && typeof response === 'function') {
          response.view = response;
        }

        if (response.view) {
          item = response;
          break;
        }
      }
    }
    return item;
  }

  v.Router = function () {
    const router = {
      paths: [],
      get(path, ...args) {
        addPath(router, 'get', path, args);
        return router;
      },
      use(...args) {
        let path = typeof args[0] === 'string' ? args.shift() : '/';
        let i;
        let k;
        let subrouter;
        let item;
        let subpath;

        for (i = 0; i < args.length; i++) {
          subrouter = args[i];
          if (typeof subrouter === 'function') {
            addPath(router, 'use', `${path}.*`, [subrouter]);
          } else if (subrouter.paths) {
            for (k = 0; k < subrouter.paths.length; k++) {
              item = subrouter.paths[k];
              subpath = `${path}${item.path}`.replace(/^\/\//, '/');
              addPath(router, item.method, subpath, item.middlewares);
            }
          }
        }

        return router;
      },
      async go(path) {
        let parts = path.split('?', 2);
        let urlParts = parts[0];
        let queryParts = parts[1];
        router.url = path;

        router.query = parseQuery(queryParts);

        let middlewares = searchMiddlewares(router, urlParts);

        let component = await searchComponent(router, middlewares);

        if (!component || !component.view) {
          throw new Error(`The url ${path} requested wasn't found`);
        }

        return component;
      }
    };
    return router;
  };

  let mainRouter;
  let RoutesContainer;
  async function runRoute(parentComponent, url, args) {
    let response = await mainRouter.go(url);

    if (parentComponent) {
      args.unshift(v(response, ...args));
      args.unshift({});
      response = parentComponent;
    }

    args.unshift(response);

    v.routes.params = mainRouter.params;
    v.routes.query = mainRouter.query;
    v.routes.url = mainRouter.url;
    v.routes.path = mainRouter.path;
    v.routes.matches = mainRouter.matches;

    if (!v.isNode) {
      window.history.pushState(null, null, url);
    }

    args.unshift(RoutesContainer);
    return v.mount.apply(v, args);
  }

  v.routes = function (elementContainer, router) {
    if (elementContainer && router) {
      mainRouter = router;
      RoutesContainer = elementContainer;
      // Activate the use of the router
      if (!v.isNode) {
        function onPopStateGoToRoute() {
          v.routes.go(document.location.pathname);
        }
        window.addEventListener('popstate', onPopStateGoToRoute, false);
        onPopStateGoToRoute();
      }
    }
  };

  v.routes.url = '';
  v.routes.params = {};
  v.routes.query = {};
  v.routes.path = '';
  v.routes.matches = [];

  v.routes.go = function (...args) {
    let parentComponent;
    let url;

    if (args[0]) {
      if (!args[0].view && typeof args[0] === 'function') {
        args[0].view = args[0];
      }

      if (args[0].view) {
        parentComponent = args.shift();
      }
    }

    if (typeof args[0] === 'string') {
      url = args.shift();
    }

    if (!url) {
      throw new Error('v.router.url.required');
    }

    return runRoute(parentComponent, url, args);
  };

  v.routes.get = function () {
    let routes = [];
    mainRouter.paths.forEach((path) => {
      if (path.method === 'get') {
        routes.push(path.path);
      }
    });
    return routes;
  };

  v.routes.link = function (e) {
    let url = (e.target.getAttribute('href') || '').trim();
    let current;
    if (url.length > 0) {
      if (url.charAt(0) !== '/') {
        current = v.routes.current
          .split('?', 2)
          .shift()
          .split('/');
        current.pop();
        url = `${current.join('/')}/${url}`;
      }

      v.routes.go(url);
    }
    e.preventDefault();
  };

};

export default plugin;
