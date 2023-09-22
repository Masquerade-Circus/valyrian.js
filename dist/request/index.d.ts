interface UrlOptions {
    base: string;
    node: string | null;
    api: string | null;
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
export interface RequestInterface {
    (method: string, url: string, data?: Record<string, any>, options?: Partial<SendOptions>): any | Response;
    new: (baseUrl: string, options?: RequestOptions) => RequestInterface;
    setOptions: (key: string, value: any) => void;
    getOptions: (key?: string) => RequestOptions | void;
    get: (url: string, data?: Record<string, any>, options?: Record<string, any>) => any | Response;
    post: (url: string, data?: Record<string, any>, options?: Record<string, any>) => any | Response;
    put: (url: string, data?: Record<string, any>, options?: Record<string, any>) => any | Response;
    patch: (url: string, data?: Record<string, any>, options?: Record<string, any>) => any | Response;
    delete: (url: string, data?: Record<string, any>, options?: Record<string, any>) => any | Response;
    head: (url: string, data?: Record<string, any>, options?: Record<string, any>) => any | Response;
    options: (url: string, data?: Record<string, any>, options?: Record<string, any>) => any | Response;
    [key: string | number | symbol]: any;
}
export declare const request: RequestInterface;
export {};
//# sourceMappingURL=index.d.ts.map