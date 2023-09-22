import { isNodeJs } from "valyrian.js";

interface UrlOptions {
  base: string; // Used to prefix the url for scoped requests.
  node: string | null; // Used to redirect local requests to node server for server side rendering.
  api: string | null; // Used to redirect api requests to node server for server side rendering.
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
  (method: string, url: string, data?: Record<string, any>, options?: Partial<SendOptions>): any | Response;
  // eslint-disable-next-line no-unused-vars
  new: (baseUrl: string, options?: RequestOptions) => RequestInterface;
  // eslint-disable-next-line no-unused-vars
  setOptions: (key: string, value: any) => void;
  // eslint-disable-next-line no-unused-vars
  getOptions: (key?: string) => RequestOptions | void;
  // eslint-disable-next-line no-unused-vars
  get: (url: string, data?: Record<string, any>, options?: Record<string, any>) => any | Response;
  // eslint-disable-next-line no-unused-vars
  post: (url: string, data?: Record<string, any>, options?: Record<string, any>) => any | Response;
  // eslint-disable-next-line no-unused-vars
  put: (url: string, data?: Record<string, any>, options?: Record<string, any>) => any | Response;
  // eslint-disable-next-line no-unused-vars
  patch: (url: string, data?: Record<string, any>, options?: Record<string, any>) => any | Response;
  // eslint-disable-next-line no-unused-vars
  delete: (url: string, data?: Record<string, any>, options?: Record<string, any>) => any | Response;
  // eslint-disable-next-line no-unused-vars
  head: (url: string, data?: Record<string, any>, options?: Record<string, any>) => any | Response;
  // eslint-disable-next-line no-unused-vars
  options: (url: string, data?: Record<string, any>, options?: Record<string, any>) => any | Response;
  [key: string | number | symbol]: any;
}

// This method is used to serialize an object into a query string.
function serialize(obj: Record<string, any>, prefix: string = ""): string {
  return Object.keys(obj)
    .map((prop: string) => {
      let k = prefix ? `${prefix}[${prop}]` : prop;
      return typeof obj[prop] === "object"
        ? serialize(obj[prop], k)
        : `${encodeURIComponent(k)}=${encodeURIComponent(obj[prop])}`;
    })
    .join("&");
}

function parseUrl(url: string, options: RequestOptionsWithUrls) {
  let u = /^https?/gi.test(url) ? url : options.urls.base + url;

  let parts = u.split("?");
  u = parts[0].trim().replace(/^\/\//, "/").replace(/\/$/, "").trim();

  if (parts[1]) {
    u += `?${parts[1]}`;
  }

  if (isNodeJs && typeof options.urls.node === "string") {
    options.urls.node = options.urls.node;

    if (typeof options.urls.api === "string") {
      options.urls.api = options.urls.api.replace(/\/$/gi, "").trim();
      u = u.replace(options.urls.api, options.urls.node);
    }

    if (!/^https?/gi.test(u)) {
      u = options.urls.node + u;
    }
  }

  return u;
}

const defaultOptions: RequestOptions = { allowedMethods: ["get", "post", "put", "patch", "delete", "head", "options"] };

// eslint-disable-next-line sonarjs/cognitive-complexity
function Requester(baseUrl = "", options: RequestOptions = defaultOptions) {
  let url = baseUrl.replace(/\/$/gi, "").trim();
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

  let opts: RequestOptionsWithUrls = {
    ...(options as RequestOptionsWithUrls),
    urls: {
      node: options.urls.node || null,
      api: options.urls.api || null,
      base: options.urls.base ? options.urls.base + url : url
    }
  };

  const request = async function request(method: string, url: string, data?: Record<string, any>, options = {}) {
    let innerOptions: SendOptions = {
      method: method.toUpperCase(),
      headers: {},
      resolveWithFullResponse: false,
      ...opts,
      ...options
    } as SendOptions;

    if (!innerOptions.headers.Accept) {
      innerOptions.headers.Accept = "application/json";
    }

    let acceptType = innerOptions.headers.Accept;
    let contentType = innerOptions.headers["Content-Type"] || innerOptions.headers["content-type"] || "";

    if (innerOptions.allowedMethods.indexOf(method) === -1) {
      throw new Error("Method not allowed");
    }

    if (data) {
      if (innerOptions.method === "GET" && typeof data === "object") {
        url += `?${serialize(data)}`;
      }

      if (innerOptions.method !== "GET") {
        if (/json/gi.test(contentType)) {
          innerOptions.body = JSON.stringify(data);
        } else {
          let formData;
          if (data instanceof FormData) {
            formData = data;
          } else {
            formData = new FormData();
            for (let i in data) {
              formData.append(i, data[i]);
            }
          }
          innerOptions.body = formData;
        }
      }
    }

    let response = await fetch(parseUrl(url, opts), innerOptions);
    let body = null;
    if (!response.ok) {
      let err = new Error(response.statusText) as Error & { response?: any; body?: any };
      err.response = response;
      if (/text/gi.test(acceptType)) {
        err.body = await response.text();
      }

      if (/json/gi.test(acceptType)) {
        try {
          err.body = await response.json();
        } catch (error) {
          // ignore
        }
      }

      throw err;
    }

    if (innerOptions.resolveWithFullResponse) {
      return response;
    }

    if (/text/gi.test(acceptType)) {
      body = await response.text();
      return body;
    }

    if (/json/gi.test(acceptType)) {
      try {
        body = await response.json();
        return body;
      } catch (error) {
        // ignore
      }
    }

    return response;
  } as unknown as RequestInterface;

  request.new = (baseUrl: string, options?: RequestOptions) => Requester(baseUrl, { ...opts, ...(options || {}) });

  request.setOption = (key: string, value: any) => {
    let result = opts;

    let parsed = key.split(".");
    let next;

    while (parsed.length) {
      next = parsed.shift() as string;

      let nextIsArray = next.indexOf("[") > -1;
      if (nextIsArray) {
        let idx = next.replace(/\D/gi, "");
        next = next.split("[")[0];
        parsed.unshift(idx);
      }

      if (parsed.length > 0 && typeof result[next] !== "object") {
        result[next] = nextIsArray ? [] : {};
      }

      if (parsed.length === 0 && typeof value !== "undefined") {
        result[next] = value;
      }

      result = result[next];
    }

    return result;
  };

  request.getOptions = (key?: string) => {
    if (!key) {
      return opts;
    }

    let result = opts;
    let parsed = key.split(".");
    let next;

    while (parsed.length) {
      next = parsed.shift() as string;

      let nextIsArray = next.indexOf("[") > -1;
      if (nextIsArray) {
        let idx = next.replace(/\D/gi, "");
        next = next.split("[")[0];
        parsed.unshift(idx);
      }

      if (parsed.length > 0 && typeof result[next] !== "object") {
        return null;
      }

      if (parsed.length === 0) {
        return result[next];
      }

      result = result[next];
    }
  };

  opts.allowedMethods.forEach(
    (method) =>
      (request[method] = (url: string, data?: Record<string, any>, options?: Record<string, any>) =>
        request(method, url, data, options))
  );

  return request;
}

export const request = Requester();
