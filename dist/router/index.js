var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/router/index.ts
var router_exports = {};
__export(router_exports, {
  Router: () => Router,
  mountRouter: () => mountRouter,
  redirect: () => redirect
});
module.exports = __toCommonJS(router_exports);
var import_valyrian = require("valyrian.js");
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
    if (response !== void 0 && ((0, import_valyrian.isComponent)(response) || (0, import_valyrian.isVnodeComponent)(response))) {
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
    if ((0, import_valyrian.isComponent)(parentComponent) || (0, import_valyrian.isVnodeComponent)(parentComponent)) {
      let childComponent = (0, import_valyrian.isVnodeComponent)(component) ? component : (0, import_valyrian.v)(component, {});
      if ((0, import_valyrian.isVnodeComponent)(parentComponent)) {
        parentComponent.children.push(childComponent);
        component = parentComponent;
      } else {
        component = (0, import_valyrian.v)(parentComponent, {}, childComponent);
      }
    }
    if (!import_valyrian.isNodeJs) {
      window.history.pushState(null, "", path);
    }
    if (this.container) {
      return (0, import_valyrian.mount)(this.container, component);
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
  if (!import_valyrian.isNodeJs) {
    let onPopStateGoToRoute = function() {
      router.go(document.location.pathname);
    };
    window.addEventListener("popstate", onPopStateGoToRoute, false);
    onPopStateGoToRoute();
  }
  (0, import_valyrian.directive)("route", (url, vnode, oldnode) => {
    (0, import_valyrian.setAttribute)("href", url, vnode, oldnode);
    (0, import_valyrian.setAttribute)("onclick", router.getOnClickHandler(url), vnode, oldnode);
  });
}
