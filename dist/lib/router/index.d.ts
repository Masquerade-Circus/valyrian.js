import { Component, POJOComponent, VnodeComponentInterface } from "valyrian.js";
export interface Request {
    params: Record<string, any>;
    query: Record<string, any>;
    url: string;
    path: string;
    matches: string[];
    redirect: (path: string) => Promise<string | void>;
}
export interface Middleware {
    (req: Request, err?: any): Promise<any | Component | POJOComponent | VnodeComponentInterface> | any | Component | POJOComponent | VnodeComponentInterface;
}
type RouteSnapshot = {
    path: string;
    query: Record<string, any>;
    params: Record<string, any>;
};
type RouteCallback = (nextRoute: RouteSnapshot, currentRoute: RouteSnapshot | null) => boolean | void | Promise<boolean | void>;
export declare const RouterError: {
    new (message?: string): {
        status: number | undefined;
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    new (message?: string, options?: ErrorOptions): {
        status: number | undefined;
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    new (message?: string, options?: ErrorOptions): {
        status: number | undefined;
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    isError(error: unknown): error is Error;
    isError(value: unknown): value is Error;
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;
    prepareStackTrace(err: Error, stackTraces: NodeJS.CallSite[]): any;
    stackTraceLimit: number;
};
type RouteParams = string | Middleware | Router | (string | Middleware | Router | RouteParams)[];
export declare class Router {
    private routeTree;
    container: Element | string | null;
    query: Record<string, string | number>;
    options: Record<string, any>;
    url: string;
    path: string;
    params: Record<string, string | number | any>;
    matches: string[];
    pathPrefix: string;
    private errorHandlers;
    private beforeRouteCallbacks;
    private afterRouteCallbacks;
    private currentRoute;
    constructor(pathPrefix?: string);
    beforeRoute(callback: RouteCallback): () => void;
    afterRoute(callback: RouteCallback): () => void;
    add(...args: RouteParams[]): Router;
    catch(...args: (number | string | Error | typeof Error | Middleware)[]): Router;
    routes(): string[];
    go(path: string, parentComponent?: Component | POJOComponent | VnodeComponentInterface): Promise<string | void>;
    getOnClickHandler(url: string): (e: MouseEvent) => void;
    private getAllRoutes;
    private createRequest;
    private getErrorConditionMiddlewares;
    private handleError;
    private searchComponent;
}
export declare function beforeRoute(callback: RouteCallback): () => void;
export declare function afterRoute(callback: RouteCallback): () => void;
export declare function redirect(url: string, parentComponent?: Component | POJOComponent | VnodeComponentInterface, preventPushState?: boolean): Promise<string | void>;
export declare function mountRouter(elementContainer: string | any, router: Router): void;
export {};
//# sourceMappingURL=index.d.ts.map