// lib/router/index.ts
import {
  directive,
  isComponent,
  isNodeJs,
  isVnodeComponent,
  mount,
  setAttribute,
  v
} from "valyrian.js";
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
    if (response !== void 0 && (isComponent(response) || isVnodeComponent(response))) {
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
  pathPrefix = "";
  constructor(pathPrefix = "") {
    this.pathPrefix = pathPrefix;
  }
  add(path, ...args) {
    addPath(this, "add", `${this.pathPrefix}${path}`, args);
    return this;
  }
  use(...args) {
    let path = `${this.pathPrefix}${typeof args[0] === "string" ? args.shift() : "/"}`;
    let item;
    let subpath;
    for (let i = 0; i < args.length; i++) {
      if (args[i] instanceof Router) {
        let subrouter = args[i];
        for (let k = 0; k < subrouter.paths.length; k++) {
          item = subrouter.paths[k];
          subpath = `${path}${item.path}`.replace(/^\/\//, "/");
          addPath(this, item.method, subpath, item.middlewares);
        }
        continue;
      }
      if (typeof args[i] === "function") {
        addPath(this, "use", `${path}.*`, [args[i]]);
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
    let constructedPath = `${this.pathPrefix}${path}`;
    let parts = constructedPath.split("?", 2);
    let urlParts = parts[0].replace(/(.+)\/$/, "$1");
    let queryParts = parts[1];
    this.url = constructedPath;
    this.query = parseQuery(queryParts);
    let middlewares = searchMiddlewares(this, urlParts);
    let component = await searchComponent(this, middlewares);
    if (component === false) {
      return;
    }
    if (!component) {
      throw new Error(`The url ${constructedPath} requested wasn't found`);
    }
    if (isComponent(parentComponent) || isVnodeComponent(parentComponent)) {
      let childComponent = isVnodeComponent(component) ? component : v(component, {});
      if (isVnodeComponent(parentComponent)) {
        parentComponent.children.push(childComponent);
        component = parentComponent;
      } else {
        component = v(parentComponent, {}, childComponent);
      }
    }
    if (!isNodeJs) {
      window.history.pushState(null, "", constructedPath);
    }
    if (this.container) {
      return mount(this.container, component);
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
var localRedirect;
function redirect(url) {
  if (!localRedirect) {
    throw new Error("router.redirect.not.found");
  }
  return localRedirect(url);
}
function mountRouter(elementContainer, router) {
  router.container = elementContainer;
  localRedirect = router.go.bind(router);
  if (!isNodeJs) {
    let onPopStateGoToRoute = function() {
      router.go(document.location.pathname);
    };
    window.addEventListener("popstate", onPopStateGoToRoute, false);
    onPopStateGoToRoute();
  }
  directive("route", (url, vnode, oldnode) => {
    setAttribute("href", url, vnode, oldnode);
    setAttribute("onclick", router.getOnClickHandler(url), vnode, oldnode);
  });
}
export {
  Router,
  mountRouter,
  redirect
};
