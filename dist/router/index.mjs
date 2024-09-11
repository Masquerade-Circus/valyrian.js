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
  const realpath = path.replace(/(\S)(\/+)$/, "$1");
  const params = (realpath.match(/:(\w+)?/gi) || []).map((param) => param.slice(1));
  const regexpPath = "^" + realpath.replace(/:([\w-]+)/gi, "([^\\/\\s]+)") + "$";
  router.paths.push({
    method,
    path: realpath,
    middlewares: flat(middlewares),
    params,
    regexp: new RegExp(regexpPath, "i")
  });
};
function parseQuery(queryParts) {
  const parts = queryParts ? queryParts.split("&") : [];
  const query = {};
  for (const nameValue of parts) {
    const [name, value] = nameValue.split("=", 2);
    query[name] = isNaN(Number(value)) === false ? Number(value) : value === "true" ? true : value === "false" ? false : value;
  }
  return query;
}
function searchMiddlewares(router, path) {
  const middlewares = [];
  const params = {};
  const matches = [];
  for (const item of router.paths) {
    const match = item.regexp.exec(path);
    if (Array.isArray(match)) {
      middlewares.push(...item.middlewares);
      match.shift();
      for (const [index, key] of item.params.entries()) {
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
    try {
      response = await middleware(request, response);
    } catch (error) {
      console.error(`Error in middleware: ${error.message}`);
      return false;
    }
    if (response !== void 0 && (isComponent(response) || isVnodeComponent(response))) {
      return response;
    }
    if (response === false) {
      return false;
    }
  }
}
var Router = class _Router {
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
    const pathWithoutLastSlash = getPathWithoutLastSlash(`${this.pathPrefix}${path}`);
    addPath({ router: this, method: "add", path: pathWithoutLastSlash, middlewares });
    return this;
  }
  use(...middlewares) {
    const path = getPathWithoutLastSlash(
      `${this.pathPrefix}${typeof middlewares[0] === "string" ? middlewares.shift() : "/"}`
    );
    for (const item of middlewares) {
      if (item instanceof _Router) {
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
    const constructedPath = getPathWithoutLastSlash(`${this.pathPrefix}${path}`);
    const parts = constructedPath.split("?", 2);
    this.url = constructedPath;
    this.query = parseQuery(parts[1]);
    const middlewares = searchMiddlewares(this, parts[0].replace(/(.+)\/$/, "$1").split("#")[0]);
    let component = await searchComponent(this, middlewares);
    if (component === false) {
      return;
    }
    if (!component) {
      throw new Error(`The URL ${constructedPath} was not found in the router's registered paths.`);
    }
    if (isComponent(parentComponent) || isVnodeComponent(parentComponent)) {
      const childComponent = isVnodeComponent(component) ? component : v(component, {});
      if (isVnodeComponent(parentComponent)) {
        parentComponent.children.push(childComponent);
        component = parentComponent;
      } else {
        component = v(parentComponent, {}, childComponent);
      }
    }
    if (!isNodeJs && !preventPushState && window.location.pathname + window.location.search !== constructedPath) {
      window.history.pushState(null, "", constructedPath);
    }
    if (this.container) {
      return mount(this.container, component);
    }
  }
  getOnClickHandler(url) {
    return (e) => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.defaultPrevented) {
        return;
      }
      if (typeof url === "string" && url.length > 0) {
        this.go(url);
      }
      e.preventDefault();
    };
  }
};
var localRedirect;
async function redirect(url, parentComponent, preventPushState = false) {
  if (!localRedirect) {
    console.warn("Redirect function is not initialized. Please mount the router first.");
    return;
  }
  return localRedirect(url, parentComponent, preventPushState);
}
function mountRouter(elementContainer, router) {
  router.container = elementContainer;
  localRedirect = router.go.bind(router);
  if (!isNodeJs) {
    let onPopStateGoToRoute2 = function() {
      const pathWithoutPrefix = getPathWithoutPrefix(document.location.pathname, router.pathPrefix);
      router.go(pathWithoutPrefix, void 0, true);
    };
    var onPopStateGoToRoute = onPopStateGoToRoute2;
    window.addEventListener("popstate", onPopStateGoToRoute2, false);
    onPopStateGoToRoute2();
  }
  directive("route", (vnode) => {
    const url = vnode.props["v-route"];
    setAttribute("href", url, vnode);
    setAttribute("onclick", router.getOnClickHandler(url), vnode);
  });
}
export {
  Router,
  mountRouter,
  redirect
};
