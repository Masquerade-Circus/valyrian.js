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
    redirect: (path: string, parentComponent?: Component | ValyrianComponent | VnodeComponentInterface) => false;
}
interface Middleware {
    (req: Request, res?: any): Promise<any | Component | ValyrianComponent | VnodeComponentInterface>;
}
interface Middlewares extends Array<Middleware> {
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
    add(method: string, ...args: Middlewares): Router;
    use(...args: Middlewares | Router[]): Router;
    routes(): string[];
    go(path: string, parentComponent?: Component | ValyrianComponent | VnodeComponentInterface): Promise<string | void>;
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
    add(path: string, ...args: Middlewares): Router;
    use(...args: Middlewares | Router[]): Router;
    routes(): string[];
    go(path: string, parentComponent?: Component | ValyrianComponent): Promise<string | void>;
    getOnClickHandler(url: string): (e: MouseEvent) => void;
}
declare module "Valyrian" {
    interface Valyrian {
        mountRouter?(container: Element | string, router: Router): string | void;
    }
}
export declare function plugin(v: Valyrian): typeof Router;
export {};
//# sourceMappingURL=index.d.ts.map