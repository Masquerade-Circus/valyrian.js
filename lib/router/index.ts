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

interface Request {
  params: Record<string, any>;
  query: Record<string, any>;
  url: string;
  path: string;
  matches: string[];
  // eslint-disable-next-line no-unused-vars
  redirect: (path: string, parentComponent?: Component | POJOComponent | VnodeComponentInterface) => false;
}

interface Middleware {
  // eslint-disable-next-line no-unused-vars
  (req: Request, res?: any):
    | Promise<any | Component | POJOComponent | VnodeComponentInterface>
    | any
    | Component
    | POJOComponent
    | VnodeComponentInterface;
}

interface Middlewares extends Array<Middleware> {}

interface Path {
  method: string;
  path: string;
  middlewares: Middlewares;
  params: string[];
  regexp: RegExp;
}

interface RouterInterface {
  paths: Path[];
  container: Element | string | null;
  query: Record<string, string | number>;
  options: Record<string, any>;
  url: string;
  path: string;
  params: Record<string, string | number | any>;
  matches: string[];
  pathPrefix: string;
  // eslint-disable-next-line no-unused-vars
  add(method: string, ...args: Middlewares): Router;
  // eslint-disable-next-line no-unused-vars
  use(...args: (string | Middleware | Router)[]): Router;

  routes(): string[];
  // eslint-disable-next-line no-unused-vars
  go(path: string, parentComponent?: Component | POJOComponent | VnodeComponentInterface): Promise<string | void>;
}

interface RedirectFunction {
  // eslint-disable-next-line no-unused-vars
  (url: string, parentComponent?: Component, preventPushState?: boolean): string | void;
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

const addPath = ({
  router,
  method,
  path,
  middlewares
}: {
  router: Router;
  method: string;
  path: string;
  middlewares: Middleware[];
}): void => {
  if (!method || !path || !Array.isArray(middlewares) || middlewares.length === 0) {
    throw new Error(`Invalid route input: ${method} ${path} ${middlewares}`);
  }

  // Trim trailing slashes from the path
  let realpath = path.replace(/(\S)(\/+)$/, "$1");

  // Find the express-like params in the path
  let params = (realpath.match(/:(\w+)?/gi) || [])
    // Set the names of the params found
    .map((param) => param.slice(1));

  // Generate a regular expression to match the path
  let regexpPath = "^" + realpath.replace(/:(\w+)/gi, "([^\\/\\s]+)") + "$";

  router.paths.push({
    method,
    path: realpath,
    middlewares: flat(middlewares),
    params,
    regexp: new RegExp(regexpPath, "i")
  });
};

// Parse a query string into an object
function parseQuery(queryParts?: string): Record<string, string> {
  // Split the query string into an array of name-value pairs
  let parts = queryParts ? queryParts.split("&") : [];
  let query: Record<string, string> = {};

  // Iterate over the name-value pairs and add them to the query object
  for (let nameValue of parts) {
    let [name, value] = nameValue.split("=", 2);
    query[name] = value || "";
  }

  return query;
}

// Search for middlewares that match a given path
function searchMiddlewares(router: RouterInterface, path: string): Middlewares {
  let middlewares: Middlewares = [];
  let params: Record<string, any> = {};
  let matches = [];

  // Search for middlewares
  for (let item of router.paths) {
    let match = item.regexp.exec(path);

    // If we found middlewares
    if (Array.isArray(match)) {
      middlewares.push(...item.middlewares);
      match.shift();

      // Parse params
      for (let [index, key] of item.params.entries()) {
        params[key] = match[index];
      }

      // Add remaining matches to the array
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

async function searchComponent(
  router: RouterInterface,
  middlewares: Middlewares
): Promise<Component | VnodeComponentInterface | false | void> {
  // Define request object with default values
  const request: Request = {
    params: router.params,
    query: router.query,
    url: router.url,
    path: router.path,
    matches: router.matches,
    redirect: (path: string, parentComponent?: Component) => {
      router.go(path, parentComponent);
      // Return false to stop the middleware chain
      return false;
    }
  };

  // Initialize response variable
  let response;

  // Iterate through middlewares
  for (const middleware of middlewares) {
    // Invoke middleware and update response
    response = await middleware(request, response);

    // Return response if it's a valid component
    if (response !== undefined && (isComponent(response) || isVnodeComponent(response))) {
      return response;
    }

    // Return false if response is explicitly false to stop the middleware chain
    if (response === false) {
      return false;
    }
  }
}

export class Router implements RouterInterface {
  paths: Path[] = [];
  container: Element | string | null = null;
  query: Record<string, string | number> = {};
  options: Record<string, any> = {};
  url: string = "";
  path: string = "";
  params: Record<string, string | number | any> = {};
  matches: string[] = [];
  pathPrefix: string = "";

  constructor(pathPrefix: string = "") {
    this.pathPrefix = pathPrefix;
  }

  add(path: string, ...middlewares: Middlewares): Router {
    let pathWithoutLastSlash = getPathWithoutLastSlash(`${this.pathPrefix}${path}`);
    addPath({ router: this, method: "add", path: pathWithoutLastSlash, middlewares });
    return this;
  }

  use(...middlewares: Middlewares | Router[] | string[]): Router {
    let path = getPathWithoutLastSlash(
      `${this.pathPrefix}${typeof middlewares[0] === "string" ? middlewares.shift() : "/"}`
    );

    for (const item of middlewares) {
      if (item instanceof Router) {
        const subrouter = item as Router;
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
        addPath({ router: this, method: "use", path: `${path}.*`, middlewares: [item as Middleware] });
      }
    }

    return this;
  }

  routes(): string[] {
    return this.paths.filter((path) => path.method === "add").map((path) => path.path);
  }

  async go(path: string, parentComponent?: Component, preventPushState = false): Promise<string | void> {
    if (!path) {
      throw new Error("router.url.required");
    }

    let constructedPath = getPathWithoutLastSlash(`${this.pathPrefix}${path}`);
    const parts = constructedPath.split("?", 2);
    this.url = constructedPath;
    this.query = parseQuery(parts[1]);

    const middlewares = searchMiddlewares(this as RouterInterface, parts[0].replace(/(.+)\/$/, "$1").split("#")[0]);
    let component = await searchComponent(this as RouterInterface, middlewares);

    if (component === false) {
      return;
    }

    if (!component) {
      throw new Error(`The url ${constructedPath} requested wasn't found`);
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

    if (!isNodeJs && !preventPushState) {
      window.history.pushState(null, "", constructedPath);
    }

    if (this.container) {
      return mount(this.container, component);
    }
  }

  getOnClickHandler(url: string) {
    return (e: MouseEvent) => {
      if (typeof url === "string" && url.length > 0) {
        this.go(url);
      }
      e.preventDefault();
    };
  }
}

let localRedirect: RedirectFunction;

export function redirect(url: string, parentComponent?: Component, preventPushState = false): string | void {
  if (!localRedirect) {
    throw new Error("router.redirect.not.found");
  }
  return localRedirect(url, parentComponent, preventPushState);
}

export function mountRouter(elementContainer: string | any, router: Router): void {
  router.container = elementContainer;
  localRedirect = router.go.bind(router);

  if (!isNodeJs) {
    function onPopStateGoToRoute(): void {
      let pathWithoutPrefix = getPathWithoutPrefix(document.location.pathname, router.pathPrefix);
      (router as unknown as Router).go(pathWithoutPrefix, undefined, true);
    }
    window.addEventListener("popstate", onPopStateGoToRoute, false);
    onPopStateGoToRoute();
  }

  directive("route", (url: string, vnode: VnodeWithDom, oldnode?: VnodeWithDom): void => {
    setAttribute("href", url, vnode, oldnode);
    setAttribute("onclick", router.getOnClickHandler(url), vnode, oldnode);
  });
}
