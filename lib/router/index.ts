/* eslint-disable no-console */
/* eslint-disable no-use-before-define */
import {
  Component,
  POJOComponent,
  VnodeComponentInterface,
  VnodeWithDom,
  directive,
  isComponent,
  isNodeJs,
  isVnodeComponent,
  mount,
  setAttribute,
  v
} from "valyrian.js";

export interface Request {
  params: Record<string, any>;
  query: Record<string, any>;
  url: string;
  path: string;
  matches: string[];
  // eslint-disable-next-line no-unused-vars
  redirect: (path: string) => Promise<string | void>;
}

export interface Middleware {
  // eslint-disable-next-line no-unused-vars
  (req: Request, err?: any):
    | Promise<any | Component | POJOComponent | VnodeComponentInterface>
    | any
    | Component
    | POJOComponent
    | VnodeComponentInterface;
}

interface Middlewares extends Array<Middleware> {}

interface RedirectFunction {
  (
    // eslint-disable-next-line no-unused-vars
    path: string,
    // eslint-disable-next-line no-unused-vars
    parentComponent?: Component | POJOComponent | VnodeComponentInterface,
    // eslint-disable-next-line no-unused-vars
    preventPushState?: boolean
  ): Promise<string | void>;
}

function flat(array: any) {
  return Array.isArray(array) ? array.flat(Infinity) : [array];
}

function getPathWithoutPrefix(path: string, prefix: string) {
  return getPathWithoutLastSlash(path.replace(new RegExp(`^${prefix}`), ""));
}

function getPathWithoutLastSlash(path: string) {
  let pathWithoutLastSlash = path.replace(/\/$/, "");
  if (pathWithoutLastSlash === "") {
    pathWithoutLastSlash = "/";
  }
  return pathWithoutLastSlash;
}

// Parse a query string into an object
function parseQuery(queryParts?: string): Record<string, any> {
  const parts = queryParts ? queryParts.split("&") : [];
  const query: Record<string, any> = {};

  for (const nameValue of parts) {
    const [name, value] = nameValue.split("=", 2);
    query[name] =
      isNaN(Number(value)) === false ? Number(value) : value === "true" ? true : value === "false" ? false : value;
  }

  return query;
}

interface RouteNode {
  segment: string;
  children: Map<string, RouteNode>;
  middlewares?: Middlewares;
  paramKey?: string;
  isDynamic: boolean;
}

class RouteTree {
  root: RouteNode = { segment: "", children: new Map(), isDynamic: false };

  addRoute(path: string, middlewares: Middlewares) {
    const segments = path === "/" ? [path] : path.split("/").filter(Boolean); // Divide the path into segments
    let currentNode = this.root;

    for (const segment of segments) {
      const isDynamic = segment.startsWith(":");
      const key = isDynamic ? ":" : segment; // If the segment is dynamic, use ":" as key

      if (!currentNode.children.has(key)) {
        currentNode.children.set(key, {
          segment: segment,
          children: new Map(),
          isDynamic: isDynamic,
          paramKey: isDynamic ? segment.slice(1) : undefined
        });
      }

      currentNode = currentNode.children.get(key)!;
    }

    currentNode.middlewares = middlewares; // Assign the middlewares to the last node
  }

  // Search for a route in the tree
  // eslint-disable-next-line sonarjs/cognitive-complexity
  findRoute(path: string): { middlewares?: Middlewares; params: Record<string, string> } | null {
    const pathWithoutLastSlash = getPathWithoutLastSlash(path);
    const segments =
      pathWithoutLastSlash === "/" ? [pathWithoutLastSlash] : pathWithoutLastSlash.split("/").filter(Boolean);
    let currentNode: RouteNode | null = this.root;
    const params: Record<string, string> = {};

    const wildcardMiddlewares: Middlewares = []; // Middlewares for wildcard routes
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
          params[child.paramKey!] = segment;
          found = true;
          break;
        }

        if (key === ".*" && !found) {
          wildcardMiddlewares.push(...(child.middlewares || []));
        }
      }

      if (!found) {
        if (currentNode.children.has(".*")) {
          return { middlewares: wildcardMiddlewares, params };
        }
        return null;
      }
    }

    // Add the wildcard middlewares to the current node middlewares
    const allMiddlewares = [...wildcardMiddlewares, ...(currentNode.middlewares || [])];

    // If there are no middlewares, return null
    if (allMiddlewares.length === 0) {
      return null;
    }

    // If there are middlewares, return them
    return { middlewares: allMiddlewares, params };
  }
}

export const RouterError = class RouterError extends Error {
  status: number | undefined = 500;
};

type RouteParams = string | Middleware | Router | (string | Middleware | Router | RouteParams)[];

export class Router {
  private routeTree = new RouteTree();
  container: Element | string | null = null;
  query: Record<string, string | number> = {};
  options: Record<string, any> = {};
  url: string = "";
  path: string = "";
  params: Record<string, string | number | any> = {};
  matches: string[] = [];
  pathPrefix: string = "";

  private errorHandlers: Map<number | string | Error | "generic", Middlewares> = new Map();

  constructor(pathPrefix: string = "") {
    this.pathPrefix = pathPrefix;
  }

  add(...args: RouteParams[]): Router {
    const flatArgs = flat(args);
    const path = getPathWithoutLastSlash(
      `${this.pathPrefix}${typeof flatArgs[0] === "string" ? flatArgs.shift() : "/.*"}`
    );

    // If the first argument is a Router, add all its routes
    if (flatArgs.length === 1 && flatArgs[0] instanceof Router) {
      const subrouter = flatArgs[0] as Router;
      for (const subroute of subrouter.routes()) {
        const subroutePath = `${path}${subroute}`;
        this.routeTree.addRoute(subroutePath, subrouter.routeTree.findRoute(subroute)!.middlewares || []);
      }
    } else {
      // Verify that no middlewares are added when a subrouter is added
      if (flatArgs.some((item) => item instanceof Router)) {
        throw new RouterError("You cannot add middlewares when adding a subrouter.");
      }

      // Verify that all middlewares are functions
      if (flatArgs.some((item) => typeof item !== "function")) {
        throw new RouterError("All middlewares must be functions.");
      }

      this.routeTree.addRoute(path, flatArgs as Middlewares);
    }

    return this;
  }

  catch(...args: (number | string | Error | typeof Error | Middleware)[]): Router {
    const condition =
      typeof args[0] === "number" || typeof args[0] === "string" || args[0].name.includes("Error")
        ? (args.shift() as number | string | Error)
        : "generic";

    if (typeof condition !== "number" && typeof condition !== "string" && !condition.name.includes("Error")) {
      throw new RouterError("The condition must be a number, string or an instance of Error.");
    }

    // Verify that all middlewares are functions
    if (args.some((item) => typeof item !== "function")) {
      throw new RouterError("All middlewares must be functions.");
    }

    let handlers = this.errorHandlers.get(condition);
    if (!handlers) {
      handlers = [];
      this.errorHandlers.set(condition, handlers);
    }

    handlers.push(...(args as Middlewares));
    return this;
  }

  routes(): string[] {
    return this.getAllRoutes(this.routeTree.root, "");
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  async go(
    path: string,
    parentComponent?: Component | POJOComponent | VnodeComponentInterface
  ): Promise<string | void> {
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
      // If the route is not found, search for a wildcard route
      const finalPathParts = finalPath.split("/"); // Divide the path into segments

      while (finalPathParts.length > 0) {
        finalPathParts.pop(); // Remove the last segment
        const wildcardRoute = this.routeTree.findRoute(finalPathParts.join("/") + "/.*"); // Search for a wildcard route
        if (wildcardRoute) {
          route = wildcardRoute;
          break;
        }
      }

      // If no route is found, return a 404 error
      if (!route || !route.middlewares) {
        const error = new RouterError(`The URL ${constructedPath} was not found in the router's registered paths.`);
        (error as any).status = 404;
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
      const childComponent = isVnodeComponent(component) ? component : v(component as Component, {});
      if (isVnodeComponent(parentComponent)) {
        parentComponent.children.push(childComponent);
        component = parentComponent;
      } else {
        component = v(parentComponent, {}, childComponent) as VnodeComponentInterface;
      }
    }

    if (!isNodeJs && window.location.pathname + window.location.search !== constructedPath) {
      window.history.pushState(null, "", constructedPath);
    }

    if (this.container) {
      return mount(this.container, component);
    }
  }

  getOnClickHandler(url: string) {
    return (e: MouseEvent) => {
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.defaultPrevented) {
        return;
      }

      if (typeof url === "string" && url.length > 0) {
        this.go(url);
      }
      e.preventDefault();
    };
  }

  private getAllRoutes(node: RouteNode, prefix: string): string[] {
    const routes: string[] = [];

    for (const [key, child] of node.children) {
      // eslint-disable-next-line sonarjs/no-nested-template-literals
      const newPrefix = `${prefix}/${child.isDynamic ? `:${child.paramKey}` : key}`.replace(/\/$/, "");
      if (child.middlewares) {
        routes.push(newPrefix);
      }
      routes.push(...this.getAllRoutes(child, newPrefix));
    }

    return routes;
  }

  private createRequest(): Request {
    return {
      params: this.params,
      query: this.query,
      url: this.url,
      path: this.path,
      matches: this.matches,
      redirect: (path: string) => this.go(path)
    };
  }

  private getErrorConditionMiddlewares(error: any): Middlewares | false {
    // Search first for class and name errors
    for (const [condition, middlewares] of this.errorHandlers) {
      if (
        typeof condition !== "number" &&
        typeof condition !== "string" &&
        error instanceof (condition as any) &&
        error.name === condition.name
      ) {
        return middlewares;
      }
    }

    // then for code errors
    for (const [condition, middlewares] of this.errorHandlers) {
      if (typeof condition === "number" && (error.status === condition || error.code === condition)) {
        return middlewares;
      }
    }

    // and then for message errors
    for (const [condition, middlewares] of this.errorHandlers) {
      if (typeof condition === "string" && (error.name === condition || error.message.includes(condition))) {
        return middlewares;
      }
    }

    // If no specific error handler is found, return the generic one
    return this.errorHandlers.get("generic") || false;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private async handleError(
    error: Error,
    parentComponent?: Component | POJOComponent | VnodeComponentInterface
  ): Promise<void | string> {
    const request: Request = this.createRequest();
    let component = null;
    const middlewares = this.getErrorConditionMiddlewares(error);

    // If no error handler is found, throw the error
    if (middlewares === false) {
      throw error;
    }

    let response;
    try {
      for (const middleware of middlewares) {
        response = await middleware(request, error);

        // If the response is a component or vnode, return it for rendering
        if (response !== undefined && (isComponent(response) || isVnodeComponent(response))) {
          component = response;
          break;
        }

        // If the response is false, stop the middleware chain
        if (response === false) {
          return;
        }
      }
    } catch (err) {
      // If an error occurs during the error handling, we handle it recursively
      (err as Error).cause = error;

      let errorCauseCount = 0;
      while ((err as Error).cause) {
        errorCauseCount++;
      }

      if (errorCauseCount > 20) {
        throw new RouterError("Too many error causes. Possible circular error handling.");
      }

      return this.handleError(err as Error, parentComponent);
    }

    if (component) {
      // If there is an error middleware that returns a component, we return it
      if (isComponent(parentComponent) || isVnodeComponent(parentComponent)) {
        const childComponent = isVnodeComponent(component) ? component : v(component as Component, {});
        if (isVnodeComponent(parentComponent)) {
          parentComponent.children.push(childComponent);
          component = parentComponent;
        } else {
          component = v(parentComponent, {}, childComponent) as VnodeComponentInterface;
        }
      }

      // If we are in the browser, we update the URL
      if (!isNodeJs && window.location.pathname + window.location.search !== this.url) {
        window.history.pushState(null, "", this.url);
      }

      // If there is a container, we mount the component
      if (this.container) {
        return mount(this.container, component);
      }
    }

    // If there is no component to render, we throw the error
    throw error;
  }

  private async searchComponent(
    middlewares: Middlewares,
    parentComponent?: Component | POJOComponent | VnodeComponentInterface
  ) {
    const request: Request = this.createRequest();

    let response;

    for (const middleware of middlewares) {
      try {
        response = await middleware(request);
      } catch (error) {
        return this.handleError(error as Error, parentComponent);
      }

      // If the response is a component or vnode, return it for rendering
      if (response !== undefined && (isComponent(response) || isVnodeComponent(response))) {
        return response;
      }

      // If the response is false, stop the middleware chain
      if (response === false) {
        return false;
      }
    }

    return response;
  }
}

let localRedirect: RedirectFunction;

export async function redirect(
  url: string,
  parentComponent?: Component | POJOComponent | VnodeComponentInterface,
  preventPushState = false
): Promise<string | void> {
  if (!localRedirect) {
    // eslint-disable-next-line no-console
    console.warn("Redirect function is not initialized. Please mount the router first.");
    return;
  }
  return localRedirect(url, parentComponent, preventPushState);
}

export function mountRouter(elementContainer: string | any, router: Router): void {
  router.container = elementContainer;
  localRedirect = router.go.bind(router);

  if (!isNodeJs) {
    function onPopStateGoToRoute(): void {
      const pathWithoutPrefix = getPathWithoutPrefix(document.location.pathname, router.pathPrefix);
      (router as unknown as Router).go(pathWithoutPrefix);
    }
    window.addEventListener("popstate", onPopStateGoToRoute, false);
    onPopStateGoToRoute();
  }

  directive("route", (url: string, vnode: VnodeWithDom): void => {
    setAttribute("href", url, vnode);
    setAttribute("onclick", router.getOnClickHandler(url), vnode);
  });
}
