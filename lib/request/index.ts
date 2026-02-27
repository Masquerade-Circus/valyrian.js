import { isNodeJs } from "valyrian.js";
import { createContextScope, getContext, isServerContextActive, setContext } from "valyrian.js/context";
import { get, isObject, isString, set } from "valyrian.js/utils";

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
  // eslint-disable-next-line no-unused-vars
  (method: string, url: string, data?: Record<string, any> | null, options?: Partial<SendOptions>): any | Response;
  // eslint-disable-next-line no-unused-vars
  new: (baseUrl: string, options?: RequestOptions) => RequestInterface;
  // eslint-disable-next-line no-unused-vars
  use: (plugin: RequestPlugin) => number;
  // eslint-disable-next-line no-unused-vars
  eject: (pluginId: number) => void;
  // eslint-disable-next-line no-unused-vars
  setOption: (key: string, value: any) => RequestOptions;
  // eslint-disable-next-line no-unused-vars
  setOptions: (values: Record<string, any>) => RequestOptions;
  // eslint-disable-next-line no-unused-vars
  getOption: (key: string) => any;
  // eslint-disable-next-line no-unused-vars
  getOptions: (key?: string) => RequestOptions | void;
  // eslint-disable-next-line no-unused-vars
  get: (url: string, data?: Record<string, any> | null, options?: Record<string, any>) => any | Response;
  // eslint-disable-next-line no-unused-vars
  post: (url: string, data?: Record<string, any> | null, options?: Record<string, any>) => any | Response;
  // eslint-disable-next-line no-unused-vars
  put: (url: string, data?: Record<string, any> | null, options?: Record<string, any>) => any | Response;
  // eslint-disable-next-line no-unused-vars
  patch: (url: string, data?: Record<string, any> | null, options?: Record<string, any>) => any | Response;
  // eslint-disable-next-line no-unused-vars
  delete: (url: string, data?: Record<string, any> | null, options?: Record<string, any>) => any | Response;
  // eslint-disable-next-line no-unused-vars
  head: (url: string, data?: Record<string, any> | null, options?: Record<string, any>) => any | Response;
  // eslint-disable-next-line no-unused-vars
  options: (url: string, data?: Record<string, any> | null, options?: Record<string, any>) => any | Response;
  [key: string | number | symbol]: any;
}

function serialize(obj: any, prefix?: string): URLSearchParams {
  if (obj === null || obj === undefined) {
    return new URLSearchParams();
  }

  const params = new URLSearchParams();
  Object.keys(obj).forEach((prop) => {
    const key = prefix ? `${prefix}[${prop}]` : prop;
    if (typeof obj[prop] === "object" && obj[prop] !== null) {
      const nestedParams = serialize(obj[prop], key);
      nestedParams.forEach((value, nestedKey) => params.append(nestedKey, value));
      return;
    }
    params.append(key, obj[prop]);
  });
  return params;
}

function serializeFormData(data: Record<string, any>): FormData {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v) => fd.append(key, v));
    } else {
      fd.append(key, value);
    }
  });
  return fd;
}

function parseUrl(url: string, options: RequestOptionsWithUrls) {
  const urlWithoutSlash = url.replace(/\/+$/g, "").trim();
  const u = /^https?/gi.test(urlWithoutSlash) ? urlWithoutSlash : `${options.urls.base || ""}${urlWithoutSlash}`;

  if (isNodeJs && isString(options.urls.node)) {
    if (isString(options.urls.api)) {
      return new URL(u.replace(options.urls.api, options.urls.node));
    }
    if (!/^https?/gi.test(u)) {
      return new URL(u, options.urls.node);
    }
  }

  if (/^https?/gi.test(u)) {
    return new URL(u);
  }

  if (!isNodeJs) {
    return new URL(u, window.location.origin);
  }

  return new URL(u);
}

const defaultOptions: RequestOptions = {
  allowedMethods: ["get", "post", "put", "patch", "delete", "head", "options"]
};

const requestContextScope = createContextScope<RequestInterface>("request");

const isNativeBody = (data: any) =>
  data instanceof FormData ||
  data instanceof URLSearchParams ||
  data instanceof Blob ||
  data instanceof ArrayBuffer ||
  (typeof DataView !== "undefined" && data instanceof DataView) ||
  (typeof ReadableStream !== "undefined" && data instanceof ReadableStream);

function Requester(baseUrl = "", options: RequestOptions = defaultOptions, isRoot = false) {
  const url = baseUrl.replace(/\/$/gi, "").trim();
  if (!options.urls) {
    options.urls = {
      base: "",
      node: null,
      api: null
    };
  }

  if (!options.allowedMethods) {
    options.allowedMethods = defaultOptions.allowedMethods;
  }

  const opts: RequestOptionsWithUrls = {
    ...(options as RequestOptionsWithUrls),
    urls: {
      node: options.urls.node || null,
      api: options.urls.api || null,
      base: options.urls.base ? options.urls.base + url : url
    }
  };

  const plugins = new Map<number, RequestPlugin>();
  let pluginId = 0;

  function getContextualRequest() {
    if (!isRoot || !isNodeJs) {
      return null;
    }

    const contextual = getContext(requestContextScope);
    if (!contextual || contextual === request) {
      return null;
    }

    return contextual;
  }

  const applyRequestPlugins = async (ctx: RequestContext) => {
    let nextCtx = ctx;
    for (const plugin of plugins.values()) {
      if (!plugin.request) {
        continue;
      }
      const maybe = await plugin.request(nextCtx);
      if (maybe) {
        nextCtx = maybe;
      }
    }
    return nextCtx;
  };

  const applyResponsePlugins = async (ctx: ResponseContext) => {
    let nextCtx = ctx;
    for (const plugin of plugins.values()) {
      if (!plugin.response) {
        continue;
      }
      const maybe = await plugin.response(nextCtx);
      if (maybe) {
        nextCtx = maybe;
      }
    }
    return nextCtx;
  };

  const applyErrorPlugins = async (ctx: ErrorContext) => {
    let nextCtx = ctx;
    for (const plugin of plugins.values()) {
      if (!plugin.error) {
        continue;
      }
      const maybe = await plugin.error(nextCtx);
      if (maybe) {
        nextCtx = maybe;
      }
    }
    return nextCtx;
  };

  const request = async function request(
    method: string,
    url: string,
    data?: Record<string, any> | null,
    options: Record<string, any> = {}
  ) {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      return contextualRequest(method, url, data, options);
    }

    const innerOptions: SendOptions = {
      method: method.toUpperCase(),
      headers: {},
      resolveWithFullResponse: false,
      ...opts,
      ...options
    } as SendOptions;

    innerOptions.headers = {
      ...innerOptions.headers,
      ...opts.headers,
      ...options.headers
    };
    if (!innerOptions.headers.Accept) {
      innerOptions.headers.Accept = "application/json";
    }

    if (!innerOptions.allowedMethods.includes(method)) {
      throw new Error(`Method ${method} not allowed. Allowed methods: ${innerOptions.allowedMethods.join(", ")}`);
    }

    let finalUrl: URL;
    try {
      finalUrl = parseUrl(url, opts);
    } catch (error) {
      const err = new Error(`Failed to parse URL: ${url}`, { cause: error });
      err.cause = error;
      throw err;
    }

    let requestContext = await applyRequestPlugins({
      method,
      url: finalUrl,
      data,
      options: innerOptions
    });

    finalUrl = requestContext.url;

    const acceptType = requestContext.options.headers.Accept;
    const contentType =
      requestContext.options.headers["Content-Type"] || requestContext.options.headers["content-type"] || "";

    if (requestContext.data) {
      if (requestContext.options.method === "GET" && typeof requestContext.data === "object") {
        finalUrl.search = serialize(requestContext.data).toString();
      } else if (isNativeBody(requestContext.data) || isString(requestContext.data)) {
        requestContext.options.body = requestContext.data as BodyInit;
      } else {
        const isJson = /json/gi.test(contentType);
        requestContext.options.body = isJson
          ? JSON.stringify(requestContext.data)
          : serializeFormData(requestContext.data);
      }
    }

    try {
      const response = await fetch(finalUrl.toString(), requestContext.options);

      if (!response.ok) {
        const err = new Error(`${response.status}: ${response.statusText}`) as Error & {
          response?: any;
          body?: any;
        };
        err.response = response;
        if (/text/gi.test(acceptType)) {
          err.body = await response.text();
        } else if (/json/gi.test(acceptType)) {
          try {
            err.body = await response.json();
          } catch {
            err.body = null;
          }
        }

        const errorContext = await applyErrorPlugins({
          ...requestContext,
          response,
          body: err.body,
          error: err
        });

        const normalizedError = errorContext.error as any;
        if (isObject(normalizedError)) {
          (normalizedError as any).__requestPluginHandled = true;
        }
        throw normalizedError;
      }

      if (requestContext.options.resolveWithFullResponse) {
        return response;
      }

      let body: any = response;
      if (/text/gi.test(acceptType)) {
        body = await response.text();
      } else if (/json/gi.test(acceptType)) {
        try {
          body = await response.json();
        } catch {
          body = null;
        }
      } else if (/blob/gi.test(acceptType)) {
        body = await response.blob();
      } else if (/arraybuffer/gi.test(acceptType)) {
        body = await response.arrayBuffer();
      }

      const responseContext = await applyResponsePlugins({
        ...requestContext,
        response,
        body
      });

      return responseContext.body;
    } catch (error: any) {
      if (error && (error.response || error.__requestPluginHandled)) {
        throw error;
      }
      const errorContext = await applyErrorPlugins({
        ...requestContext,
        error
      });
      const normalizedError = errorContext.error as any;
      if (isObject(normalizedError)) {
        (normalizedError as any).__requestPluginHandled = true;
      }
      throw normalizedError;
    }
  } as unknown as RequestInterface;

  request.new = (baseUrl: string, options?: RequestOptions) => {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      return contextualRequest.new(baseUrl, options);
    }

    const next = Requester(baseUrl, { ...opts, ...(options || {}) });
    plugins.forEach((plugin) => next.use(plugin));

    if (isRoot && isServerContextActive()) {
      setContext(requestContextScope, next);
    }

    return next;
  };

  request.use = (plugin: RequestPlugin) => {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      return contextualRequest.use(plugin);
    }

    pluginId += 1;
    plugins.set(pluginId, plugin);
    return pluginId;
  };

  request.eject = (id: number) => {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      contextualRequest.eject(id);
      return;
    }

    plugins.delete(id);
  };

  request.setOption = (key: string, value: any) => {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      return contextualRequest.setOption(key, value);
    }

    set(opts, key, value);
    return opts;
  };

  request.setOptions = (values: Record<string, any>) => {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      return contextualRequest.setOptions(values);
    }

    for (const key of Object.keys(values)) {
      set(opts, key, values[key]);
    }
    return opts;
  };

  request.getOption = (key: string) => {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      return contextualRequest.getOption(key);
    }
    return get(opts, key);
  };

  request.getOptions = (key?: string) => {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      return contextualRequest.getOptions(key);
    }

    if (key) {
      return get(opts, key);
    }
    return opts;
  };

  Object.assign(
    request,
    opts.allowedMethods.reduce((acc: Record<string, any>, method) => {
      acc[method] = (url: string, data?: Record<string, any> | null, options?: Record<string, any>) =>
        request(method, url, data, options);
      return acc;
    }, {})
  );

  return request;
}

export const request = Requester("", defaultOptions, true);
