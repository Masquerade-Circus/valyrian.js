import { isNodeJs } from "valyrian.js";
import { get, set } from "valyrian.js/utils";

interface UrlOptions {
  base?: string; // Used to prefix the url for scoped requests.
  node?: string | null; // Used to redirect local requests to node server for server side rendering.
  api?: string | null; // Used to redirect api requests to node server for server side rendering.
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
  // eslint-disable-next-line no-unused-vars
  (method: string, url: string, data?: Record<string, any> | null, options?: Partial<SendOptions>): any | Response;
  // eslint-disable-next-line no-unused-vars
  new: (baseUrl: string, options?: RequestOptions) => RequestInterface;
  // eslint-disable-next-line no-unused-vars
  setOptions: (key: string, value: any) => void;
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

// This method is used to serialize an object into a query string.
function serialize(obj: Record<string, any>, prefix: string = ""): URLSearchParams {
  const params = new URLSearchParams();

  Object.keys(obj).forEach((prop: string) => {
    const key = prefix ? `${prefix}[${prop}]` : prop;
    if (typeof obj[prop] === "object") {
      params.append(key, serialize(obj[prop], key).toString());
    } else {
      params.append(key, obj[prop]);
    }
  });

  return params;
}

function serializeFormData(data: Record<string, any>): FormData {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === undefined) return; // Ignorar nulos

    if (Array.isArray(value)) {
      value.forEach((v) => fd.append(key, v));
    } else {
      fd.append(key, value);
    }
  });
  return fd;
}

function parseUrl(url: string, options: RequestOptionsWithUrls) {
  const urlWithoutSlash = url.replace(/\/+$/, "").trim();
  const u = /^https?/gi.test(urlWithoutSlash) ? urlWithoutSlash : `${options.urls.base}${urlWithoutSlash}`;

  if (isNodeJs && typeof options.urls.node === "string") {
    if (typeof options.urls.api === "string") {
      return new URL(u.replace(options.urls.api, options.urls.node));
    }

    if (!/^https?/gi.test(u)) {
      return new URL(u, options.urls.node);
    }
  }

  if (/^https?/gi.test(u)) {
    return new URL(u);
  }

  return new URL(u, options.urls.base);
}

const defaultOptions: RequestOptions = { allowedMethods: ["get", "post", "put", "patch", "delete", "head", "options"] };

const isNativeBody = (data: any) =>
  data instanceof FormData ||
  data instanceof URLSearchParams ||
  data instanceof Blob ||
  data instanceof ArrayBuffer ||
  (typeof DataView !== "undefined" && data instanceof DataView) ||
  (typeof ReadableStream !== "undefined" && data instanceof ReadableStream);

// eslint-disable-next-line sonarjs/cognitive-complexity
function Requester(baseUrl = "", options: RequestOptions = defaultOptions) {
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

  // eslint-disable-next-line complexity
  const request = async function request(
    method: string,
    url: string,
    data?: Record<string, any> | null,
    options: Record<string, any> = {}
  ) {
    const innerOptions: SendOptions = {
      method: method.toUpperCase(),
      headers: {},
      resolveWithFullResponse: false,
      ...opts,
      ...options
    } as SendOptions;

    innerOptions.headers = { ...innerOptions.headers, ...opts.headers, ...options.headers };

    if (!innerOptions.headers.Accept) {
      innerOptions.headers.Accept = "application/json";
    }

    const acceptType = innerOptions.headers.Accept;
    const contentType = innerOptions.headers["Content-Type"] || innerOptions.headers["content-type"] || "";

    if (!innerOptions.allowedMethods.includes(method)) {
      throw new Error(`Method ${method} not allowed. Allowed methods: ${innerOptions.allowedMethods.join(", ")}`);
    }

    let finalUrl: URL;
    try {
      finalUrl = parseUrl(url, opts);
    } catch (error) {
      throw new Error(`Failed to parse URL: ${url}`);
    }

    if (data) {
      if (innerOptions.method === "GET" && typeof data === "object") {
        finalUrl.search = serialize(data).toString();
      } else if (isNativeBody(data) || typeof data === "string") {
        innerOptions.body = data as BodyInit;
      } else {
        const isJson = /json/gi.test(contentType);
        if (isJson) {
          innerOptions.body = JSON.stringify(data);
        } else {
          innerOptions.body = serializeFormData(data);
        }
      }
    }

    const response = await fetch(finalUrl.toString(), innerOptions);
    let body = null;
    if (!response.ok) {
      const err = new Error(`${response.status}: ${response.statusText}`) as Error & { response?: any; body?: any };
      err.response = response;
      if (/text/gi.test(acceptType)) {
        err.body = await response.text();
      }

      if (/json/gi.test(acceptType)) {
        try {
          err.body = await response.json();
        } catch (error) {
          err.body = null;
          // eslint-disable-next-line no-console
          console.warn("Failed to parse JSON response:", error);
        }
      }

      throw err;
    }

    if (innerOptions.resolveWithFullResponse) {
      return response;
    }

    if (/text/gi.test(acceptType)) {
      body = await response.text();
    } else if (/json/gi.test(acceptType)) {
      try {
        body = await response.json();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Failed to parse JSON response:", error);
        body = null;
      }
    } else if (/blob/gi.test(acceptType)) {
      body = await response.blob();
    } else if (/arraybuffer/gi.test(acceptType)) {
      body = await response.arrayBuffer();
    } else {
      body = response;
    }

    return body || response;
  } as unknown as RequestInterface;

  request.new = (baseUrl: string, options?: RequestOptions) => Requester(baseUrl, { ...opts, ...(options || {}) });

  request.setOption = (key: string, value: any) => {
    set(opts, key, value);
    return opts;
  };

  request.getOptions = (key?: string) => {
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

export const request = Requester();
