export = Router;
declare class Router {
    paths: any[];
    container: null;
    url: string;
    query: {};
    options: {};
    current: string;
    params: {};
    matches: any[];
    get(path: any, ...args: any[]): Router;
    use(...args: any[]): Router;
    routes(): any[];
    go(path: any, parentComponent: any): Promise<any>;
    mount(elementContainer: any): void;
}
declare namespace Router {
    export { Router as default };
}
