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

interface Request {
  params: Record<string, any>;
  query: Record<string, any>;
  url: string;
  path: string;
  matches: string[];
  // eslint-disable-next-line no-unused-vars
  redirect: (path: string) => Promise<string | void>;
}

interface Middleware {
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
  // eslint-disable-next-line no-unused-vars
  (
    path: string,
    parentComponent?: Component | POJOComponent | VnodeComponentInterface,
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
    const segments = path === "/" ? [path] : path.split("/").filter(Boolean); // Divide el path en segmentos
    let currentNode = this.root;

    for (const segment of segments) {
      const isDynamic = segment.startsWith(":");
      const key = isDynamic ? ":" : segment; // Usa ':' como clave para los nodos dinámicos

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

    currentNode.middlewares = flat(middlewares); // Asigna los middlewares a la ruta completa
  }

  // Buscar una ruta en el árbol y extraer los parámetros si es necesario
  // Buscar una ruta en el árbol y extraer los parámetros si es necesario
  findRoute(path: string): { middlewares?: Middlewares; params: Record<string, string> } | null {
    const pathWithoutLastSlash = getPathWithoutLastSlash(path);
    const segments =
      pathWithoutLastSlash === "/" ? [pathWithoutLastSlash] : pathWithoutLastSlash.split("/").filter(Boolean);
    let currentNode: RouteNode | null = this.root;
    const params: Record<string, string> = {};

    const wildcardMiddlewares: Middlewares = []; // Cambiar para almacenar middlewares comodín
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

    // Añadimos los middlewares comodín a los middlewares específicos de la ruta
    const allMiddlewares = [...wildcardMiddlewares, ...(currentNode.middlewares || [])];

    if (allMiddlewares.length === 0) {
      return null;
    }

    return { middlewares: allMiddlewares, params };
  }
}

interface RouterInterface {
  add(path: string, ...middlewares: Middlewares): Router;
  use(...args: (string | Middleware)[]): Router;
  use(subrouter: Router): Router;
  use(path: string, subrouter: Router): Router;
  routes(): string[];
  go(path: string, parentComponent?: Component | POJOComponent | VnodeComponentInterface): Promise<string | void>;
  getOnClickHandler(url: string): (e: MouseEvent) => void;
}

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

  constructor(pathPrefix: string = "") {
    this.pathPrefix = pathPrefix;
  }

  add(path: string, ...middlewares: Middlewares): Router {
    const pathWithoutLastSlash = getPathWithoutLastSlash(`${this.pathPrefix}${path}`);
    this.routeTree.addRoute(pathWithoutLastSlash, middlewares);
    return this;
  }

  // Ajuste del método use para aceptar múltiples middlewares y subrouters
  use(...args: (string | Middleware | Router)[]): Router {
    let path = "/.*";
    let start = 0;

    // Verificamos si el primer argumento es una ruta (string)
    if (typeof args[0] === "string") {
      path = getPathWithoutLastSlash(`${this.pathPrefix}${args[0]}`);
      start = 1;
    }

    // Procesamos todos los argumentos restantes
    for (let i = start; i < args.length; i++) {
      const item = args[i];

      // Si es un subrouter, agregamos todas sus rutas como subrutas bajo el path
      if (item instanceof Router) {
        const subrouter = item as Router;
        for (const subroute of subrouter.routes()) {
          const subroutePath = `${path}${subroute}`;
          this.routeTree.addRoute(subroutePath, subrouter.routeTree.findRoute(subroute)!.middlewares || []);
        }
        // Si es un middleware, lo añadimos a la ruta correspondiente o como global
      } else if (typeof item === "function") {
        this.routeTree.addRoute(path, [item as Middleware]);
      }
    }

    return this;
  }

  routes(): string[] {
    return this.getAllRoutes(this.routeTree.root, "");
  }

  async go(
    path: string,
    parentComponent?: Component | POJOComponent | VnodeComponentInterface
  ): Promise<string | void> {
    if (!path) {
      return this.handleError(new Error("The URL is empty."), parentComponent);
    }

    // Validación de URL malformada
    if (/%[^0-9A-Fa-f]{2}/.test(path)) {
      return this.handleError(new Error(`The URL ${path} is malformed.`));
    }

    const constructedPath = getPathWithoutLastSlash(`${this.pathPrefix}${path}`);
    const parts = constructedPath.split("?", 2);
    this.url = constructedPath;
    this.query = parseQuery(parts[1]);

    const finalPath = parts[0].replace(/(.+)\/$/, "$1").split("#")[0];
    this.path = path;

    const route = this.routeTree.findRoute(finalPath);

    if (!route || !route.middlewares) {
      return this.handleError(
        new Error(`The URL ${constructedPath} was not found in the router's registered paths.`),
        parentComponent
      );
    }

    const { middlewares, params } = route;
    this.params = params;

    let component = await this.searchComponent(middlewares, parentComponent);

    if (component === false) {
      return;
    }

    if (!component) {
      return this.handleError(
        new Error(`The URL ${constructedPath} did not return a valid component.`),
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

  private async handleError(error: any, parentComponent?: Component | POJOComponent | VnodeComponentInterface) {
    // Buscar el middleware de error en la ruta "/.*"
    const errorRoute = this.routeTree.findRoute("/.*");

    let component = null;

    if (errorRoute && errorRoute.middlewares) {
      // Recorrer los middlewares de error y ejecutar cada uno
      for (const errorMiddleware of errorRoute.middlewares) {
        try {
          // Llamamos al middleware pasándole el error
          const response = await errorMiddleware(this.createRequest(), error);

          // Si el middleware retorna un componente válido, lo devolvemos
          if (response !== undefined && (isComponent(response) || isVnodeComponent(response))) {
            component = response;
            break;
          }
        } catch (err) {
          // Si hay un error en el middleware de error, lanzamos el error original
          throw error;
        }
      }
    }

    if (component) {
      // Si hay un middleware de error que devuelve un componente, lo devolvemos
      if (isComponent(parentComponent) || isVnodeComponent(parentComponent)) {
        const childComponent = isVnodeComponent(component) ? component : v(component as Component, {});
        if (isVnodeComponent(parentComponent)) {
          parentComponent.children.push(childComponent);
          component = parentComponent;
        } else {
          component = v(parentComponent, {}, childComponent) as VnodeComponentInterface;
        }
      }

      if (!isNodeJs && window.location.pathname + window.location.search !== this.url) {
        window.history.pushState(null, "", this.url);
      }

      if (this.container) {
        return mount(this.container, component);
      }
    }

    // Si no hay un middleware de error o ninguno devuelve un componente, lanzamos el error original
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
        response = await middleware(request, response);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error in middleware: ${(error as any).message}`);

        return this.handleError(error, parentComponent);
      }

      // Si la respuesta es un componente o vnode, lo devolvemos para renderizado
      if (response !== undefined && (isComponent(response) || isVnodeComponent(response))) {
        return response;
      }

      // Si la respuesta es false, detenemos la cadena de middlewares
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

  directive("route", (vnode: VnodeWithDom): void => {
    const url = vnode.props["v-route"];
    setAttribute("href", url, vnode);
    setAttribute("onclick", router.getOnClickHandler(url), vnode);
  });
}
