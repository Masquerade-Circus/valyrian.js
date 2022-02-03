import { isComponent, isNodeJs, isVnodeComponent, mount, updateProperty, v } from "../lib";

function flat(array) {
  return Array.isArray(array) ? array.flat(Infinity) : [array];
}

let addPath = (router, method, path, middlewares, i) => {
  if (middlewares.length === 0) {
    return;
  }

  let realpath = path.replace(/(\S)(\/+)$/, "$1");

  // Find the express like params
  let params = realpath.match(/:(\w+)?/gi) || [];

  // Set the names of the params found
  for (i in params) {
    params[i] = params[i].slice(1);
  }

  let regexpPath = "^" + realpath.replace(/:(\w+)/gi, "([^\\/\\s]+)") + "$";

  router.paths.push({
    method,
    path: realpath,
    middlewares: flat(middlewares),
    params,
    regexp: new RegExp(regexpPath, "i")
  });
};

function parseQuery(queryParts) {
  let parts = queryParts ? queryParts.split("&", 20) : [];
  let query = {};
  let i = 0;
  let nameValue;

  for (; i < parts.length; i++) {
    nameValue = parts[i].split("=", 2);
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
  router.path = "";
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

      if (item.method === "get") {
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

    if (response !== undefined && (isComponent(response) || isVnodeComponent(response))) {
      return response;
    }
  }
}

class Router {
  paths = [];
  container = null;
  url = "";
  query = {};
  options = {};
  current = "";
  params = {};
  matches = [];

  get(path, ...args) {
    addPath(this, "get", path, args);
    return this;
  }

  use(...args) {
    let path = typeof args[0] === "string" ? args.shift() : "/";
    let i;
    let k;
    let subrouter;
    let item;
    let subpath;

    for (i = 0; i < args.length; i++) {
      subrouter = args[i];
      if (typeof subrouter === "function") {
        addPath(this, "use", `${path}.*`, [subrouter]);
      } else if (subrouter.paths) {
        for (k = 0; k < subrouter.paths.length; k++) {
          item = subrouter.paths[k];
          subpath = `${path}${item.path}`.replace(/^\/\//, "/");
          addPath(this, item.method, subpath, item.middlewares);
        }
      }
    }

    return this;
  }

  routes() {
    let routes = [];
    this.paths.forEach((path) => {
      if (path.method === "get") {
        routes.push(path.path);
      }
    });
    return routes;
  }

  async go(path, parentComponent) {
    if (!path) {
      throw new Error("router.url.required");
    }

    let parts = path.split("?", 2);
    let urlParts = parts[0].replace(/(.+)\/$/, "$1");
    let queryParts = parts[1];
    this.url = path;
    this.query = parseQuery(queryParts);

    let middlewares = searchMiddlewares(this, urlParts);

    let component = await searchComponent(this, middlewares);

    if (!component) {
      throw new Error(`The url ${path} requested wasn't found`);
    }

    if (parentComponent) {
      let childComponent = isVnodeComponent(component) ? component : v(component, {});
      if (isVnodeComponent(parentComponent)) {
        parentComponent.children.push(childComponent);
      } else {
        parentComponent = v(parentComponent, {}, childComponent);
      }
      component = parentComponent;
    }

    if (!isNodeJs) {
      window.history.pushState(null, null, url);
    }

    return mount(this.container, component);
  }

  mount(elementContainer, options = {}) {
    if (elementContainer) {
      this.container = elementContainer;
      this.options = { ...options };
      this.options.directives = {
        ...(this.options.directives || {}),
        route: (url, vnode, oldnode) => {
          vnode.props.href = url;
          vnode.props.onclick = (e) => {
            if (typeof url === "string" && url.length > 0) {
              if (url.charAt(0) !== "/") {
                let current = this.current.split("?", 2).shift().split("/");
                current.pop();
                url = `${current.join("/")}/${url}`;
              }

              this.go(url);
            }
            e.preventDefault();
          };

          updateProperty("href", vnode, oldnode);
          updateProperty("onclick", vnode, oldnode);
        }
      };

      // Activate the use of the router
      if (!isNodeJs) {
        function onPopStateGoToRoute() {
          this.go(document.location.pathname);
        }
        window.addEventListener("popstate", onPopStateGoToRoute.bind(this), false);
        onPopStateGoToRoute();
      }
    }
  }
}

Router.default = Router;
module.exports = Router;
