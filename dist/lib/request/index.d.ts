interface UrlOptions {
    base?: string;
    node?: string | null;
    api?: string | null;
}
interface RequestOptions {
    allowedMethods?: string[];
    urls?: UrlOptions;
    [key: string | number | symbol]: any;
}
interface RequestOptionsWithUrls extends RequestOptions {
    urls: UrlOptions;
    allowedMethods: string[];
}
interface SendOptions extends RequestOptionsWithUrls, RequestInit {
    allowedMethods: string[];
    method: string;
    headers: Record<string, string>;
    resolveWithFullResponse?: boolean;
}
export interface RequestPlugin {
    name?: string;
    request?: (ctx: RequestContext) => RequestContext | Promise<RequestContext | void> | void;
    response?: (ctx: ResponseContext) => ResponseContext | Promise<ResponseContext | void> | void;
    error?: (ctx: ErrorContext) => ErrorContext | Promise<ErrorContext | void> | void;
}
export interface RequestContext {
    method: string;
    url: URL;
    data?: Record<string, any> | null;
    options: SendOptions;
}
export interface ResponseContext extends RequestContext {
    response: Response;
    body: any;
}
export interface ErrorContext extends RequestContext {
    response?: Response;
    error: any;
    body?: any;
}
export interface RequestInterface {
    (method: string, url: string, data?: Record<string, any> | null, options?: Partial<SendOptions>): any | Response;
    new: (baseUrl: string, options?: RequestOptions) => RequestInterface;
    use: (plugin: RequestPlugin) => number;
    eject: (pluginId: number) => void;
    setOption: (key: string, value: any) => RequestOptions;
    setOptions: (values: Record<string, any>) => RequestOptions;
    getOption: (key: string) => any;
    getOptions: (key?: string) => RequestOptions | void;
    get: (url: string, data?: Record<string, any> | null, options?: Record<string, any>) => any | Response;
    post: (url: string, data?: Record<string, any> | null, options?: Record<string, any>) => any | Response;
    put: (url: string, data?: Record<string, any> | null, options?: Record<string, any>) => any | Response;
    patch: (url: string, data?: Record<string, any> | null, options?: Record<string, any>) => any | Response;
    delete: (url: string, data?: Record<string, any> | null, options?: Record<string, any>) => any | Response;
    head: (url: string, data?: Record<string, any> | null, options?: Record<string, any>) => any | Response;
    options: (url: string, data?: Record<string, any> | null, options?: Record<string, any>) => any | Response;
    [key: string | number | symbol]: any;
}
export declare const request: RequestInterface;
export {};
//# sourceMappingURL=index.d.ts.map