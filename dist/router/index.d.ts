import { Component, POJOComponent, VnodeComponentInterface } from "valyrian.js";
interface Request {
    params: Record<string, any>;
    query: Record<string, any>;
    url: string;
    path: string;
    matches: string[];
    redirect: (path: string, parentComponent?: Component | POJOComponent | VnodeComponentInterface) => false;
}
interface Middleware {
    (req: Request, res?: any): Promise<any | Component | POJOComponent | VnodeComponentInterface> | any | Component | POJOComponent | VnodeComponentInterface;
}
interface Middlewares extends Array<Middleware> {
}
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
    add(method: string, ...args: Middlewares): Router;
    use(...args: (string | Middleware | Router)[]): Router;
    routes(): string[];
    go(path: string, parentComponent?: Component | POJOComponent | VnodeComponentInterface): Promise<string | void>;
}
export declare class Router implements RouterInterface {
    paths: Path[];
    container: Element | string | null;
    query: Record<string, string | number>;
    options: Record<string, any>;
    url: string;
    path: string;
    params: Record<string, string | number | any>;
    matches: string[];
    pathPrefix: string;
    constructor(pathPrefix?: string);
    add(path: string, ...middlewares: Middlewares): Router;
    use(...middlewares: Middlewares | Router[] | string[]): Router;
    routes(): string[];
    go(path: string, parentComponent?: Component | POJOComponent | VnodeComponentInterface, preventPushState?: boolean): Promise<string | void>;
    getOnClickHandler(url: string): (e: MouseEvent) => void;
}
export declare function redirect(url: string, parentComponent?: Component | POJOComponent | VnodeComponentInterface, preventPushState?: boolean): Promise<string | void>;
export declare function mountRouter(elementContainer: string | any, router: Router): void;
export {};
//# sourceMappingURL=index.d.ts.map