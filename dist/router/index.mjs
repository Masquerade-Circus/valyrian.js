// lib/router/index.ts
var localValyrian;
function flat(array) {
  return Array.isArray(array) ? array.flat(Infinity) : [array];
}
var addPath = (router, method, path, middlewares) => {
  if (middlewares.length === 0) {
    return;
  }
  let realpath = path.replace(/(\S)(\/+)$/, "$1");
  let params = realpath.match(/:(\w+)?/gi) || [];
  for (let param in params) {
    params[param] = params[param].slice(1);
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
  for (i = 0; i < router.paths.length; i++) {
    item = router.paths[i];
    match = item.regexp.exec(path);
    if (Array.isArray(match)) {
      middlewares.push(...item.middlewares);
      match.shift();
      for (k = 0; k < item.params.length; k++) {
        key = item.params[k];
        params[key] = match.shift();
      }
      while (match.length) {
        matches.push(match.shift());
      }
      if (item.method === "add") {
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
    matches: router.matches,
    redirect: (path, parentComponent) => {
      router.go(path, parentComponent);
      return false;
    }
  };
  let i = 0;
  for (; i < middlewares.length; i++) {
    response = await middlewares[i](req, response);
    if (response !== void 0 && localValyrian.isComponent(response)) {
      return response;
    }
    if (response === false) {
      return false;
    }
  }
}
var Router = class {
  paths = [];
  container = null;
  query = {};
  options = {};
  url = "";
  path = "";
  params = {};
  matches = [];
  add(path, ...args) {
    addPath(this, "add", path, args);
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
      if (path.method === "add") {
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
    if (component === false) {
      return;
    }
    if (!component) {
      throw new Error(`The url ${path} requested wasn't found`);
    }
    if (localValyrian.isComponent(parentComponent)) {
      let childComponent = localValyrian.isVnodeComponent(component) ? component : localValyrian(component, {});
      if (localValyrian.isVnodeComponent(parentComponent)) {
        parentComponent.children.push(childComponent);
        component = parentComponent;
      } else {
        component = localValyrian(parentComponent, {}, childComponent);
      }
    }
    if (!localValyrian.isNodeJs) {
      window.history.pushState(null, "", path);
    }
    if (localValyrian.isMounted && localValyrian.component === component) {
      return localValyrian.update();
    }
    if (this.container) {
      return localValyrian.mount(this.container, component);
    }
  }
  getOnClickHandler(url) {
    return (e) => {
      if (typeof url === "string" && url.length > 0) {
        this.go(url);
      }
      e.preventDefault();
    };
  }
};
function plugin(v) {
  localValyrian = v;
  localValyrian.mountRouter = (elementContainer, routerOrComponent) => {
    if (routerOrComponent instanceof Router) {
      routerOrComponent.container = elementContainer;
      localValyrian.redirect = routerOrComponent.go.bind(routerOrComponent);
      if (!localValyrian.isNodeJs) {
        let onPopStateGoToRoute2 = function() {
          routerOrComponent.go(document.location.pathname);
        };
        var onPopStateGoToRoute = onPopStateGoToRoute2;
        window.addEventListener("popstate", onPopStateGoToRoute2, false);
        onPopStateGoToRoute2();
      }
      localValyrian.directive("route", (url, vnode, oldnode) => {
        localValyrian.setAttribute("href", url, vnode, oldnode);
        localValyrian.setAttribute("onclick", routerOrComponent.getOnClickHandler(url), vnode, oldnode);
      });
    }
  };
  return Router;
}
var router_default = plugin;
export {
  Router,
  router_default as default
};