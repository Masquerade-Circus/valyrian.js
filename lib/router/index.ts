/* eslint-disable no-use-before-define */
import {
  Component,
  POJOComponent,
  VnodeComponentInterface,
  directive,
  isComponent,
  isNodeJs,
  isVnodeComponent,
  mount,
  setAttribute,
  v
} from "valyrian.js";

interface Path {
  method: string;
  path: string;
  middlewares: Middlewares;
  params: string[];
  regexp: RegExp;
}

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

interface RouterInterface {
  paths: Path[];
  container: Element | string | null;
  query: Record<string, string | number>;
  options: Record<string, any>;
  url: string;
  path: string;
  params: Record<string, string | number | any>;
  matches: string[];
  // eslint-disable-next-line no-unused-vars
  add(method: string, ...args: Middlewares): Router;
  // eslint-disable-next-line no-unused-vars
  use(...args: string[] | Middlewares | Router[]): Router;

  routes(): string[];
  // eslint-disable-next-line no-unused-vars
  go(path: string, parentComponent?: Component | POJOComponent | VnodeComponentInterface): Promise<string | void>;
}

function flat(array: any) {
  return Array.isArray(array) ? array.flat(Infinity) : [array];
}

let addPath = (router: Router, method: string, path: string, middlewares: any[]) => {
  if (middlewares.length === 0) {
    return;
  }

  let realpath = path.replace(/(\S)(\/+)$/, "$1");

  // Find the express like params
  let params = realpath.match(/:(\w+)?/gi) || [];

  // Set the names of the params found
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

function parseQuery(queryParts?: string) {
  let parts = queryParts ? queryParts.split("&", 20) : [];
  let query: Record<string, any> = {};
  let i = 0;
  let nameValue;

  for (; i < parts.length; i++) {
    nameValue = parts[i].split("=", 2);
    query[nameValue[0]] = nameValue[1];
  }

  return query;
}

function searchMiddlewares(router: RouterInterface, path: string): Middlewares {
  let i;
  let k;
  let item;
  let match;
  let key;
  let middlewares: Middlewares = [];
  let params: Record<string, any> = {};
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
      middlewares.push(...item.middlewares);
      match.shift();

      // Parse params
      for (k = 0; k < item.params.length; k++) {
        key = item.params[k];
        params[key] = match.shift();
      }

      while (match.length) {
        matches.push(match.shift() as string);
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

async function searchComponent(
  router: RouterInterface,
  middlewares: Middlewares
): Promise<Component | VnodeComponentInterface | false | void> {
  let response;
  let req: Request = {
    params: router.params,
    query: router.query,
    url: router.url,
    path: router.path,
    matches: router.matches,
    redirect: (path: string, parentComponent?: Component) => {
      router.go(path, parentComponent);
      return false;
    }
  };
  let i = 0;

  for (; i < middlewares.length; i++) {
    response = await middlewares[i](req, response);

    if (response !== undefined && (isComponent(response) || isVnodeComponent(response))) {
      return response;
    }

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

  add(path: string, ...args: Middlewares): Router {
    addPath(this, "add", `${this.pathPrefix}${path}`, args);
    return this;
  }

  use(...args: Middlewares | Router[] | string[]): Router {
    let path = `${this.pathPrefix}${typeof args[0] === "string" ? args.shift() : "/"}`;
    let item;
    let subpath;

    for (let i = 0; i < args.length; i++) {
      if (args[i] instanceof Router) {
        let subrouter = args[i] as Router;
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
    let routes: string[] = [];
    this.paths.forEach((path) => {
      if (path.method === "add") {
        routes.push(path.path);
      }
    });
    return routes;
  }

  async go(path: string, parentComponent?: Component): Promise<string | void> {
    if (!path) {
      throw new Error("router.url.required");
    }

    let constructedPath = `${this.pathPrefix}${path}`;
    let parts = constructedPath.split("?", 2);
    let urlParts = parts[0].replace(/(.+)\/$/, "$1");
    let queryParts = parts[1];
    this.url = constructedPath;
    this.query = parseQuery(queryParts);

    let middlewares = searchMiddlewares(this as RouterInterface, urlParts);

    let component = await searchComponent(this as RouterInterface, middlewares);

    if (component === false) {
      return;
    }

    if (!component) {
      throw new Error(`The url ${constructedPath} requested wasn't found`);
    }

    if (isComponent(parentComponent) || isVnodeComponent(parentComponent)) {
      let childComponent = isVnodeComponent(component) ? component : v(component as Component, {});
      if (isVnodeComponent(parentComponent)) {
        parentComponent.children.push(childComponent);
        component = parentComponent;
      } else {
        component = v(parentComponent, {}, childComponent) as VnodeComponentInterface;
      }
    }

    if (!isNodeJs) {
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

let localRedirect;
export function redirect(url: string) {
  if (!localRedirect) {
    throw new Error("router.redirect.not.found");
  }
  return localRedirect(url);
}

export function mountRouter(elementContainer, router) {
  router.container = elementContainer;
  localRedirect = router.go.bind(router);

  // Activate the use of the router
  if (!isNodeJs) {
    function onPopStateGoToRoute() {
      (router as unknown as Router).go(document.location.pathname);
    }
    window.addEventListener("popstate", onPopStateGoToRoute, false);
    onPopStateGoToRoute();
  }

  directive("route", (url, vnode, oldnode) => {
    setAttribute("href", url, vnode, oldnode);
    setAttribute("onclick", router.getOnClickHandler(url), vnode, oldnode);
  });
}
