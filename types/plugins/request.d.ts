export = request;
declare function request(method: any, url: any, data: any, options?: {}): Promise<any>;
declare namespace request {
    export { request as default };
}
