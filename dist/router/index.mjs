// lib/router/index.ts
import {
  current,
  directive,
  isComponent,
  isNodeJs,
  isVnodeComponent,
  mount,
  setAttribute,
  v
} from "valyrian.js";
import { createContextScope, getContext, runWithContext } from "valyrian.js/context";
import { isFunction, isNumber, isString } from "valyrian.js/utils";
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
function isErrorClassLike(value) {
  return Boolean(value) && isString(value.name) && value.name.includes("Error");
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
function createRouteCallbackCollection() {
  return {
    before: /* @__PURE__ */ new Set(),
    after: /* @__PURE__ */ new Set()
  };
}
var activeRouter = null;
var routeDirectiveRegistered = false;
var routerContextScope = createContextScope("router");
function resolveRouterFromContext() {
  return getContext(routerContextScope) || activeRouter;
}
function ensureRouteDirective() {
  if (routeDirectiveRegistered) {
    return;
  }
  directive("route", (url, vnode) => {
    setAttribute("href", url, vnode);
    const router = resolveRouterFromContext();
    if (router) {
      setAttribute("onclick", router.getOnClickHandler(url), vnode);
    }
  });
  routeDirectiveRegistered = true;
}
function areEqualShallow(a, b) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }
  for (const key of aKeys) {
    if (String(a[key]) !== String(b[key])) {
      return false;
    }
  }
  return true;
}
function hasRouteChanged(nextRoute, currentRoute) {
  if (!currentRoute) {
    return true;
  }
  return nextRoute.path !== currentRoute.path || !areEqualShallow(nextRoute.query, currentRoute.query) || !areEqualShallow(nextRoute.params, currentRoute.params);
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
  activeRouteCallbacks = createRouteCallbackCollection();
  pendingRouteCallbacks = null;
  callbackRegistrationTarget = "active";
  currentRoute = null;
  constructor(pathPrefix = "") {
    this.pathPrefix = pathPrefix;
  }
  getRegistrationCallbacks() {
    if (this.callbackRegistrationTarget === "pending" && this.pendingRouteCallbacks) {
      return this.pendingRouteCallbacks;
    }
    return this.activeRouteCallbacks;
  }
  beginPendingRouteCallbacksCollection() {
    this.pendingRouteCallbacks = createRouteCallbackCollection();
    this.callbackRegistrationTarget = "pending";
  }
  commitPendingRouteCallbacksCollection() {
    this.activeRouteCallbacks = this.pendingRouteCallbacks || createRouteCallbackCollection();
    this.pendingRouteCallbacks = null;
    this.callbackRegistrationTarget = "active";
  }
  rollbackPendingRouteCallbacksCollection() {
    this.pendingRouteCallbacks = null;
    this.callbackRegistrationTarget = "active";
  }
  beforeRoute(callback) {
    this.getRegistrationCallbacks().before.add(callback);
    return () => {
      this.activeRouteCallbacks.before.delete(callback);
      this.pendingRouteCallbacks?.before.delete(callback);
    };
  }
  afterRoute(callback) {
    this.getRegistrationCallbacks().after.add(callback);
    return () => {
      this.activeRouteCallbacks.after.delete(callback);
      this.pendingRouteCallbacks?.after.delete(callback);
    };
  }
  add(...args) {
    const flatArgs = flat(args);
    const path = getPathWithoutLastSlash(`${this.pathPrefix}${isString(flatArgs[0]) ? flatArgs.shift() : "/.*"}`);
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
      if (flatArgs.some((item) => !isFunction(item))) {
        throw new RouterError("All middlewares must be functions.");
      }
      this.routeTree.addRoute(path, flatArgs);
    }
    return this;
  }
  catch(...args) {
    const firstArg = args[0];
    const condition = isNumber(firstArg) || isString(firstArg) || isErrorClassLike(firstArg) ? args.shift() : "generic";
    if (!isNumber(condition) && !isString(condition) && !isErrorClassLike(condition)) {
      throw new RouterError("The condition must be a number, string or an instance of Error.");
    }
    if (args.some((item) => !isFunction(item))) {
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
    const nextQuery = parseQuery(parts[1]);
    const finalPath = parts[0].replace(/(.+)\/$/, "$1").split("#")[0];
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
    return runWithContext(routerContextScope, this, async () => {
      const nextRoute = {
        path: getPathWithoutLastSlash(path),
        query: nextQuery,
        params
      };
      const routeChanged = hasRouteChanged(nextRoute, this.currentRoute);
      if (routeChanged) {
        for (const callback of this.activeRouteCallbacks.before) {
          const result = await callback(nextRoute, this.currentRoute);
          if (result === false) {
            return;
          }
        }
        this.beginPendingRouteCallbacksCollection();
      } else {
        this.callbackRegistrationTarget = "active";
      }
      let routeTransitionCompleted = false;
      try {
        this.url = constructedPath;
        this.query = nextQuery;
        this.path = path;
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
        let mountedResult = void 0;
        if (this.container) {
          mountedResult = mount(this.container, component);
        } else if (isNodeJs) {
          mountedResult = mount("body", component);
        } else {
          return this.handleError(new RouterError("No container found for mounting the component."), parentComponent);
        }
        if (routeChanged) {
          const previousRoute = this.currentRoute;
          const previousAfterCallbacks = this.activeRouteCallbacks.after;
          this.currentRoute = nextRoute;
          this.commitPendingRouteCallbacksCollection();
          routeTransitionCompleted = true;
          for (const callback of previousAfterCallbacks) {
            await callback(nextRoute, previousRoute);
          }
        }
        return mountedResult;
      } finally {
        if (routeChanged && !routeTransitionCompleted) {
          this.rollbackPendingRouteCallbacksCollection();
        }
      }
    });
  }
  getOnClickHandler(url) {
    return (e) => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.defaultPrevented) {
        return;
      }
      if (isString(url) && url.length > 0) {
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
      if (!isNumber(condition) && !isString(condition) && error instanceof condition && error.name === condition.name) {
        return middlewares;
      }
    }
    for (const [condition, middlewares] of this.errorHandlers) {
      if (isNumber(condition) && (error.status === condition || error.code === condition)) {
        return middlewares;
      }
    }
    for (const [condition, middlewares] of this.errorHandlers) {
      if (isString(condition) && (error.name === condition || error.message.includes(condition))) {
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
      const nextError = err instanceof Error ? err : new RouterError(String(err));
      if (nextError === error) {
        throw new RouterError("Too many error causes. Possible circular error handling.");
      }
      if (!nextError.cause) {
        nextError.cause = error;
      }
      let errorCauseCount = 0;
      const seen = /* @__PURE__ */ new Set();
      let currentError = nextError;
      while (currentError instanceof Error && currentError.cause) {
        if (seen.has(currentError)) {
          throw new RouterError("Too many error causes. Possible circular error handling.");
        }
        seen.add(currentError);
        errorCauseCount++;
        if (errorCauseCount > 20) {
          throw new RouterError("Too many error causes. Possible circular error handling.");
        }
        currentError = currentError.cause;
      }
      return this.handleError(nextError, parentComponent);
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
function beforeRoute(callback) {
  const router = resolveRouterFromContext();
  if (!router) {
    throw new RouterError("Router is not mounted. Call mountRouter(...) before registering route callbacks.");
  }
  if (!current.vnode) {
    throw new RouterError("beforeRoute must be called inside a component context.");
  }
  return router.beforeRoute(callback);
}
function afterRoute(callback) {
  const router = resolveRouterFromContext();
  if (!router) {
    throw new RouterError("Router is not mounted. Call mountRouter(...) before registering route callbacks.");
  }
  if (!current.vnode) {
    throw new RouterError("afterRoute must be called inside a component context.");
  }
  return router.afterRoute(callback);
}
async function redirect(url, parentComponent, preventPushState = false) {
  const router = resolveRouterFromContext();
  if (!router) {
    console.warn("Redirect function is not initialized. Please mount the router first.");
    return;
  }
  return router.go(url, parentComponent);
}
function mountRouter(elementContainer, router) {
  ensureRouteDirective();
  router.container = elementContainer;
  activeRouter = router;
  if (!isNodeJs) {
    let onPopStateGoToRoute2 = function() {
      const pathWithoutPrefix = getPathWithoutPrefix(document.location.pathname, router.pathPrefix);
      router.go(pathWithoutPrefix);
    };
    var onPopStateGoToRoute = onPopStateGoToRoute2;
    window.addEventListener("popstate", onPopStateGoToRoute2, false);
    onPopStateGoToRoute2();
  }
}
ensureRouteDirective();
export {
  Router,
  RouterError,
  afterRoute,
  beforeRoute,
  mountRouter,
  redirect
};
