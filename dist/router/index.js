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
function getPathWithoutPrefix(path, prefix) {
  return getPathWithoutLastSlash(path.replace(new RegExp(`^${prefix}`), ""));
}
function getPathWithoutLastSlash(path) {
  let pathWithoutLastSlash = path.replace(/\/$/, "");
  if (pathWithoutLastSlash === "") {
    pathWithoutLastSlash = "/";
  }
  return pathWithoutLastSlash;
}
var addPath = ({
  router,
  method,
  path,
  middlewares
}) => {
  if (!method || !path || !Array.isArray(middlewares) || middlewares.length === 0) {
    throw new Error(`Invalid route input: ${method} ${path} ${middlewares}`);
  }
  let realpath = path.replace(/(\S)(\/+)$/, "$1");
  let params = (realpath.match(/:(\w+)?/gi) || []).map((param) => param.slice(1));
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
  let parts = queryParts ? queryParts.split("&") : [];
  let query = {};
  for (let nameValue of parts) {
    let [name, value] = nameValue.split("=", 2);
    query[name] = value || "";
  }
  return query;
}
function searchMiddlewares(router, path) {
  let middlewares = [];
  let params = {};
  let matches = [];
  for (let item of router.paths) {
    let match = item.regexp.exec(path);
    if (Array.isArray(match)) {
      middlewares.push(...item.middlewares);
      match.shift();
      for (let [index, key] of item.params.entries()) {
        params[key] = match[index];
      }
      matches.push(...match);
      if (item.method === "add") {
        router.path = getPathWithoutPrefix(item.path, router.pathPrefix);
        break;
      }
    }
  }
  router.params = params;
  router.matches = matches;
  return middlewares;
}
async function searchComponent(router, middlewares) {
  const request = {
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
  let response;
  for (const middleware of middlewares) {
    response = await middleware(request, response);
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
  pathPrefix = "";
  constructor(pathPrefix = "") {
    this.pathPrefix = pathPrefix;
  }
  add(path, ...middlewares) {
    let pathWithoutLastSlash = getPathWithoutLastSlash(`${this.pathPrefix}${path}`);
    addPath({ router: this, method: "add", path: pathWithoutLastSlash, middlewares });
    return this;
  }
  use(...middlewares) {
    let path = getPathWithoutLastSlash(
      `${this.pathPrefix}${typeof middlewares[0] === "string" ? middlewares.shift() : "/"}`
    );
    for (const item of middlewares) {
      if (item instanceof Router) {
        const subrouter = item;
        for (const subpath of subrouter.paths) {
          addPath({
            router: this,
            method: subpath.method,
            path: `${path}${subpath.path}`.replace(/^\/\//, "/"),
            middlewares: subpath.middlewares
          });
        }
        continue;
      }
      if (typeof item === "function") {
        addPath({ router: this, method: "use", path: `${path}.*`, middlewares: [item] });
      }
    }
    return this;
  }
  routes() {
    return this.paths.filter((path) => path.method === "add").map((path) => path.path);
  }
  async go(path, parentComponent, preventPushState = false) {
    if (!path) {
      throw new Error("router.url.required");
    }
    let constructedPath = getPathWithoutLastSlash(`${this.pathPrefix}${path}`);
    const parts = constructedPath.split("?", 2);
    this.url = constructedPath;
    this.query = parseQuery(parts[1]);
    const middlewares = searchMiddlewares(this, parts[0].replace(/(.+)\/$/, "$1").split("#")[0]);
    let component = await searchComponent(this, middlewares);
    if (component === false) {
      return;
    }
    if (!component) {
      throw new Error(`The url ${constructedPath} requested wasn't found`);
    }
    if ((0, import_valyrian.isComponent)(parentComponent) || (0, import_valyrian.isVnodeComponent)(parentComponent)) {
      const childComponent = (0, import_valyrian.isVnodeComponent)(component) ? component : (0, import_valyrian.v)(component, {});
      if ((0, import_valyrian.isVnodeComponent)(parentComponent)) {
        parentComponent.children.push(childComponent);
        component = parentComponent;
      } else {
        component = (0, import_valyrian.v)(parentComponent, {}, childComponent);
      }
    }
    if (!import_valyrian.isNodeJs && !preventPushState) {
      window.history.pushState(null, "", constructedPath);
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
function redirect(url, parentComponent, preventPushState = false) {
  if (!localRedirect) {
    throw new Error("router.redirect.not.found");
  }
  return localRedirect(url, parentComponent, preventPushState);
}
function mountRouter(elementContainer, router) {
  router.container = elementContainer;
  localRedirect = router.go.bind(router);
  if (!import_valyrian.isNodeJs) {
    let onPopStateGoToRoute = function() {
      let pathWithoutPrefix = getPathWithoutPrefix(document.location.pathname, router.pathPrefix);
      router.go(pathWithoutPrefix, void 0, true);
    };
    window.addEventListener("popstate", onPopStateGoToRoute, false);
    onPopStateGoToRoute();
  }
  (0, import_valyrian.directive)("route", (url, vnode, oldnode) => {
    (0, import_valyrian.setAttribute)("href", url, vnode, oldnode);
    (0, import_valyrian.setAttribute)("onclick", router.getOnClickHandler(url), vnode, oldnode);
  });
}
