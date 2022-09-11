/* eslint-disable no-use-before-define */
import { Component, Valyrian, ValyrianComponent, VnodeComponentInterface } from "Valyrian";

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
  redirect: (path: string, parentComponent?: Component | ValyrianComponent | VnodeComponentInterface) => false;
}

interface Middleware {
  // eslint-disable-next-line no-unused-vars
  (req: Request, res?: any): Promise<any | Component | ValyrianComponent | VnodeComponentInterface>;
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
  use(...args: Middlewares | Router[]): Router;
  routes(): string[];
  // eslint-disable-next-line no-unused-vars
  go(path: string, parentComponent?: Component | ValyrianComponent | VnodeComponentInterface): Promise<string | void>;
}

let localValyrian: Valyrian;

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
): Promise<Component | ValyrianComponent | VnodeComponentInterface | false | void> {
  let response;
  let req: Request = {
    params: router.params,
    query: router.query,
    url: router.url,
    path: router.path,
    matches: router.matches,
    redirect: (path: string, parentComponent?: Component | ValyrianComponent | VnodeComponentInterface) => {
      router.go(path, parentComponent);
      return false;
    }
  };
  let i = 0;

  for (; i < middlewares.length; i++) {
    response = await middlewares[i](req, response);

    if (response !== undefined && localValyrian.isComponent(response)) {
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

  add(path: string, ...args: Middlewares): Router {
    addPath(this, "add", path, args);
    return this;
  }

  use(...args: Middlewares | Router[]): Router {
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
    let routes: string[] = [];
    this.paths.forEach((path) => {
      if (path.method === "add") {
        routes.push(path.path);
      }
    });
    return routes;
  }

  async go(path: string, parentComponent?: Component | ValyrianComponent): Promise<string | void> {
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
        component = localValyrian(parentComponent, {}, childComponent) as VnodeComponentInterface;
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

  getOnClickHandler(url: string) {
    return (e: MouseEvent) => {
      if (typeof url === "string" && url.length > 0) {
        this.go(url);
      }
      e.preventDefault();
    };
  }
}

declare module "Valyrian" {
  // eslint-disable-next-line no-unused-vars
  interface Valyrian {
    // eslint-disable-next-line no-unused-vars
    mountRouter?(container: Element | string, router: Router): string | void;
  }
}

export function plugin(v: Valyrian) {
  localValyrian = v;
  localValyrian.mountRouter = (elementContainer, routerOrComponent) => {
    if (routerOrComponent instanceof Router) {
      routerOrComponent.container = elementContainer;
      localValyrian.redirect = routerOrComponent.go.bind(routerOrComponent);

      // Activate the use of the router
      if (!localValyrian.isNodeJs) {
        function onPopStateGoToRoute() {
          (routerOrComponent as unknown as Router).go(document.location.pathname);
        }
        window.addEventListener("popstate", onPopStateGoToRoute, false);
        onPopStateGoToRoute();
      }

      localValyrian.directive("route", (url, vnode, oldnode) => {
        localValyrian.setAttribute("href", url, vnode, oldnode);
        localValyrian.setAttribute("onclick", routerOrComponent.getOnClickHandler(url), vnode, oldnode);
      });
    }
  };
  return Router;
}
