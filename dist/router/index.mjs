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
function parseQuery(queryParts) {
  const parts = queryParts ? queryParts.split("&") : [];
  const query = {};
  for (const nameValue of parts) {
    const [name, value] = nameValue.split("=", 2);
    query[name] = isNaN(Number(value)) === false ? Number(value) : value === "true" ? true : value === "false" ? false : value;
  }
  return query;
}
var RouteTree = class {
  root = { segment: "", children: /* @__PURE__ */ new Map(), isDynamic: false };
  addRoute(path, middlewares) {
    const segments = path === "/" ? [path] : path.split("/").filter(Boolean);
    let currentNode = this.root;
    for (const segment of segments) {
      const isDynamic = segment.startsWith(":");
      const key = isDynamic ? ":" : segment;
      if (!currentNode.children.has(key)) {
        currentNode.children.set(key, {
          segment,
          children: /* @__PURE__ */ new Map(),
          isDynamic,
          paramKey: isDynamic ? segment.slice(1) : void 0
        });
      }
      currentNode = currentNode.children.get(key);
    }
    currentNode.middlewares = middlewares;
  }
  // Search for a route in the tree
  // eslint-disable-next-line sonarjs/cognitive-complexity
  findRoute(path) {
    const pathWithoutLastSlash = getPathWithoutLastSlash(path);
    const segments = pathWithoutLastSlash === "/" ? [pathWithoutLastSlash] : pathWithoutLastSlash.split("/").filter(Boolean);
    let currentNode = this.root;
    const params = {};
    const wildcardMiddlewares = [];
    const segmentsLength = segments.length;
    for (let i = 0; i < segmentsLength; i++) {
      if (!currentNode) {
        break;
      }
      const segment = segments[i];
      let found = false;
      for (const [key, child] of currentNode.children) {
        if (key === segment) {
          currentNode = child;
          found = true;
          break;
        }
        if (segment !== ".*" && key === ":") {
          currentNode = child;
          params[child.paramKey] = segment;
          found = true;
          break;
        }
        if (key === ".*" && !found) {
          wildcardMiddlewares.push(...child.middlewares || []);
        }
      }
      if (!found) {
        if (currentNode.children.has(".*")) {
          return { middlewares: wildcardMiddlewares, params };
        }
        return null;
      }
    }
    const allMiddlewares = [...wildcardMiddlewares, ...currentNode.middlewares || []];
    if (allMiddlewares.length === 0) {
      return null;
    }
    return { middlewares: allMiddlewares, params };
  }
};
var RouterError = class RouterError2 extends Error {
  status = 500;
};
var Router = class _Router {
  routeTree = new RouteTree();
  container = null;
  query = {};
  options = {};
  url = "";
  path = "";
  params = {};
  matches = [];
  pathPrefix = "";
  errorHandlers = /* @__PURE__ */ new Map();
  constructor(pathPrefix = "") {
    this.pathPrefix = pathPrefix;
  }
  add(...args) {
    const flatArgs = flat(args);
    const path = getPathWithoutLastSlash(
      `${this.pathPrefix}${typeof flatArgs[0] === "string" ? flatArgs.shift() : "/.*"}`
    );
    if (flatArgs.length === 1 && flatArgs[0] instanceof _Router) {
      const subrouter = flatArgs[0];
      for (const subroute of subrouter.routes()) {
        const subroutePath = `${path}${subroute}`;
        this.routeTree.addRoute(subroutePath, subrouter.routeTree.findRoute(subroute).middlewares || []);
      }
    } else {
      if (flatArgs.some((item) => item instanceof _Router)) {
        throw new RouterError("You cannot add middlewares when adding a subrouter.");
      }
      if (flatArgs.some((item) => typeof item !== "function")) {
        throw new RouterError("All middlewares must be functions.");
      }
      this.routeTree.addRoute(path, flatArgs);
    }
    return this;
  }
  catch(...args) {
    const condition = typeof args[0] === "number" || typeof args[0] === "string" || args[0].name.includes("Error") ? args.shift() : "generic";
    if (typeof condition !== "number" && typeof condition !== "string" && !condition.name.includes("Error")) {
      throw new RouterError("The condition must be a number, string or an instance of Error.");
    }
    if (args.some((item) => typeof item !== "function")) {
      throw new RouterError("All middlewares must be functions.");
    }
    let handlers = this.errorHandlers.get(condition);
    if (!handlers) {
      handlers = [];
      this.errorHandlers.set(condition, handlers);
    }
    handlers.push(...args);
    return this;
  }
  routes() {
    return this.getAllRoutes(this.routeTree.root, "");
  }
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async go(path, parentComponent) {
    if (!path) {
      return this.handleError(new RouterError("The URL is empty."), parentComponent);
    }
    if (/%[^0-9A-Fa-f]{2}/.test(path)) {
      return this.handleError(new RouterError(`The URL ${path} is malformed.`));
    }
    const constructedPath = getPathWithoutLastSlash(`${this.pathPrefix}${path}`);
    const parts = constructedPath.split("?", 2);
    this.url = constructedPath;
    this.query = parseQuery(parts[1]);
    const finalPath = parts[0].replace(/(.+)\/$/, "$1").split("#")[0];
    this.path = path;
    let route = this.routeTree.findRoute(finalPath);
    if (!route || !route.middlewares) {
      const finalPathParts = finalPath.split("/");
      while (finalPathParts.length > 0) {
        finalPathParts.pop();
        const wildcardRoute = this.routeTree.findRoute(finalPathParts.join("/") + "/.*");
        if (wildcardRoute) {
          route = wildcardRoute;
          break;
        }
      }
      if (!route || !route.middlewares) {
        const error = new RouterError(`The URL ${constructedPath} was not found in the router's registered paths.`);
        error.status = 404;
        return this.handleError(error, parentComponent);
      }
    }
    const { middlewares, params } = route;
    this.params = params;
    let component = await this.searchComponent(middlewares, parentComponent);
    if (component === false) {
      return;
    }
    if (!component) {
      return this.handleError(
        new RouterError(`The URL ${constructedPath} did not return a valid component.`),
        parentComponent
      );
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
    if (!isNodeJs && window.location.pathname + window.location.search !== constructedPath) {
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
  getAllRoutes(node, prefix) {
    const routes = [];
    for (const [key, child] of node.children) {
      const newPrefix = `${prefix}/${child.isDynamic ? `:${child.paramKey}` : key}`.replace(/\/$/, "");
      if (child.middlewares) {
        routes.push(newPrefix);
      }
      routes.push(...this.getAllRoutes(child, newPrefix));
    }
    return routes;
  }
  createRequest() {
    return {
      params: this.params,
      query: this.query,
      url: this.url,
      path: this.path,
      matches: this.matches,
      redirect: (path) => this.go(path)
    };
  }
  getErrorConditionMiddlewares(error) {
    for (const [condition, middlewares] of this.errorHandlers) {
      if (typeof condition !== "number" && typeof condition !== "string" && error instanceof condition && error.name === condition.name) {
        return middlewares;
      }
    }
    for (const [condition, middlewares] of this.errorHandlers) {
      if (typeof condition === "number" && (error.status === condition || error.code === condition)) {
        return middlewares;
      }
    }
    for (const [condition, middlewares] of this.errorHandlers) {
      if (typeof condition === "string" && (error.name === condition || error.message.includes(condition))) {
        return middlewares;
      }
    }
    return this.errorHandlers.get("generic") || false;
  }
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async handleError(error, parentComponent) {
    const request = this.createRequest();
    let component = null;
    const middlewares = this.getErrorConditionMiddlewares(error);
    if (middlewares === false) {
      throw error;
    }
    let response;
    try {
      for (const middleware of middlewares) {
        response = await middleware(request, error);
        if (response !== void 0 && (isComponent(response) || isVnodeComponent(response))) {
          component = response;
          break;
        }
        if (response === false) {
          return;
        }
      }
    } catch (err) {
      err.cause = error;
      let errorCauseCount = 0;
      while (err.cause) {
        errorCauseCount++;
      }
      if (errorCauseCount > 20) {
        throw new RouterError("Too many error causes. Possible circular error handling.");
      }
      return this.handleError(err, parentComponent);
    }
    if (component) {
      if (isComponent(parentComponent) || isVnodeComponent(parentComponent)) {
        const childComponent = isVnodeComponent(component) ? component : v(component, {});
        if (isVnodeComponent(parentComponent)) {
          parentComponent.children.push(childComponent);
          component = parentComponent;
        } else {
          component = v(parentComponent, {}, childComponent);
        }
      }
      if (!isNodeJs && window.location.pathname + window.location.search !== this.url) {
        window.history.pushState(null, "", this.url);
      }
      if (this.container) {
        return mount(this.container, component);
      }
    }
    throw error;
  }
  async searchComponent(middlewares, parentComponent) {
    const request = this.createRequest();
    let response;
    for (const middleware of middlewares) {
      try {
        response = await middleware(request);
      } catch (error) {
        return this.handleError(error, parentComponent);
      }
      if (response !== void 0 && (isComponent(response) || isVnodeComponent(response))) {
        return response;
      }
      if (response === false) {
        return false;
      }
    }
    return response;
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
      router.go(pathWithoutPrefix);
    };
    var onPopStateGoToRoute = onPopStateGoToRoute2;
    window.addEventListener("popstate", onPopStateGoToRoute2, false);
    onPopStateGoToRoute2();
  }
  directive("route", (url, vnode) => {
    setAttribute("href", url, vnode);
    setAttribute("onclick", router.getOnClickHandler(url), vnode);
  });
}
export {
  Router,
  RouterError,
  mountRouter,
  redirect
};
