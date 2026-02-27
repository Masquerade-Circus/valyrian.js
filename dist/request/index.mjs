// lib/request/index.ts
import { isNodeJs } from "valyrian.js";
import { createContextScope, getContext, isServerContextActive, setContext } from "valyrian.js/context";
import { get, isObject, isString, set } from "valyrian.js/utils";
function serialize(obj, prefix) {
  if (obj === null || obj === void 0) {
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
function serializeFormData(data) {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === void 0) {
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
function parseUrl(url, options) {
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
var defaultOptions = {
  allowedMethods: ["get", "post", "put", "patch", "delete", "head", "options"]
};
var requestContextScope = createContextScope("request");
var isNativeBody = (data) => data instanceof FormData || data instanceof URLSearchParams || data instanceof Blob || data instanceof ArrayBuffer || typeof DataView !== "undefined" && data instanceof DataView || typeof ReadableStream !== "undefined" && data instanceof ReadableStream;
function Requester(baseUrl = "", options = defaultOptions, isRoot = false) {
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
  const opts = {
    ...options,
    urls: {
      node: options.urls.node || null,
      api: options.urls.api || null,
      base: options.urls.base ? options.urls.base + url : url
    }
  };
  const plugins = /* @__PURE__ */ new Map();
  let pluginId = 0;
  function getContextualRequest() {
    if (!isRoot || !isNodeJs) {
      return null;
    }
    const contextual = getContext(requestContextScope);
    if (!contextual || contextual === request2) {
      return null;
    }
    return contextual;
  }
  const applyRequestPlugins = async (ctx) => {
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
  const applyResponsePlugins = async (ctx) => {
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
  const applyErrorPlugins = async (ctx) => {
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
  const request2 = async function request3(method, url2, data, options2 = {}) {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      return contextualRequest(method, url2, data, options2);
    }
    const innerOptions = {
      method: method.toUpperCase(),
      headers: {},
      resolveWithFullResponse: false,
      ...opts,
      ...options2
    };
    innerOptions.headers = {
      ...innerOptions.headers,
      ...opts.headers,
      ...options2.headers
    };
    if (!innerOptions.headers.Accept) {
      innerOptions.headers.Accept = "application/json";
    }
    if (!innerOptions.allowedMethods.includes(method)) {
      throw new Error(`Method ${method} not allowed. Allowed methods: ${innerOptions.allowedMethods.join(", ")}`);
    }
    let finalUrl;
    try {
      finalUrl = parseUrl(url2, opts);
    } catch (error) {
      const err = new Error(`Failed to parse URL: ${url2}`, { cause: error });
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
    const contentType = requestContext.options.headers["Content-Type"] || requestContext.options.headers["content-type"] || "";
    if (requestContext.data) {
      if (requestContext.options.method === "GET" && typeof requestContext.data === "object") {
        finalUrl.search = serialize(requestContext.data).toString();
      } else if (isNativeBody(requestContext.data) || isString(requestContext.data)) {
        requestContext.options.body = requestContext.data;
      } else {
        const isJson = /json/gi.test(contentType);
        requestContext.options.body = isJson ? JSON.stringify(requestContext.data) : serializeFormData(requestContext.data);
      }
    }
    try {
      const response = await fetch(finalUrl.toString(), requestContext.options);
      if (!response.ok) {
        const err = new Error(`${response.status}: ${response.statusText}`);
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
        const normalizedError = errorContext.error;
        if (isObject(normalizedError)) {
          normalizedError.__requestPluginHandled = true;
        }
        throw normalizedError;
      }
      if (requestContext.options.resolveWithFullResponse) {
        return response;
      }
      let body = response;
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
    } catch (error) {
      if (error && (error.response || error.__requestPluginHandled)) {
        throw error;
      }
      const errorContext = await applyErrorPlugins({
        ...requestContext,
        error
      });
      const normalizedError = errorContext.error;
      if (isObject(normalizedError)) {
        normalizedError.__requestPluginHandled = true;
      }
      throw normalizedError;
    }
  };
  request2.new = (baseUrl2, options2) => {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      return contextualRequest.new(baseUrl2, options2);
    }
    const next = Requester(baseUrl2, { ...opts, ...options2 || {} });
    plugins.forEach((plugin) => next.use(plugin));
    if (isRoot && isServerContextActive()) {
      setContext(requestContextScope, next);
    }
    return next;
  };
  request2.use = (plugin) => {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      return contextualRequest.use(plugin);
    }
    pluginId += 1;
    plugins.set(pluginId, plugin);
    return pluginId;
  };
  request2.eject = (id) => {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      contextualRequest.eject(id);
      return;
    }
    plugins.delete(id);
  };
  request2.setOption = (key, value) => {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      return contextualRequest.setOption(key, value);
    }
    set(opts, key, value);
    return opts;
  };
  request2.setOptions = (values) => {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      return contextualRequest.setOptions(values);
    }
    for (const key of Object.keys(values)) {
      set(opts, key, values[key]);
    }
    return opts;
  };
  request2.getOption = (key) => {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      return contextualRequest.getOption(key);
    }
    return get(opts, key);
  };
  request2.getOptions = (key) => {
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
    request2,
    opts.allowedMethods.reduce((acc, method) => {
      acc[method] = (url2, data, options2) => request2(method, url2, data, options2);
      return acc;
    }, {})
  );
  return request2;
}
var request = Requester("", defaultOptions, true);
export {
  request
};
