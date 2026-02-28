"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/request/index.ts
var index_exports = {};
__export(index_exports, {
  request: () => request
});
module.exports = __toCommonJS(index_exports);
var import_valyrian = require("valyrian.js");
var import_context = require("valyrian.js/context");
var import_utils = require("valyrian.js/utils");
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
  if (import_valyrian.isNodeJs && (0, import_utils.isString)(options.urls.node)) {
    if ((0, import_utils.isString)(options.urls.api)) {
      return new URL(u.replace(options.urls.api, options.urls.node));
    }
    if (!/^https?/gi.test(u)) {
      return new URL(u, options.urls.node);
    }
  }
  if (/^https?/gi.test(u)) {
    return new URL(u);
  }
  if (!import_valyrian.isNodeJs) {
    return new URL(u, window.location.origin);
  }
  return new URL(u);
}
var defaultOptions = {
  allowedMethods: ["get", "post", "put", "patch", "delete", "head", "options"]
};
var requestContextScope = (0, import_context.createContextScope)("request");
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
    if (!isRoot || !import_valyrian.isNodeJs) {
      return null;
    }
    const contextual = (0, import_context.getContext)(requestContextScope);
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
        const params = new URLSearchParams(finalUrl.search);
        serialize(requestContext.data).forEach((value, key) => params.append(key, value));
        finalUrl.search = params.toString();
      } else if (isNativeBody(requestContext.data) || (0, import_utils.isString)(requestContext.data)) {
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
        if ((0, import_utils.isObject)(normalizedError)) {
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
      if ((0, import_utils.isObject)(normalizedError)) {
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
    if (isRoot && (0, import_context.isServerContextActive)()) {
      (0, import_context.setContext)(requestContextScope, next);
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
    (0, import_utils.set)(opts, key, value);
    return opts;
  };
  request2.setOptions = (values) => {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      return contextualRequest.setOptions(values);
    }
    for (const key of Object.keys(values)) {
      (0, import_utils.set)(opts, key, values[key]);
    }
    return opts;
  };
  request2.getOption = (key) => {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      return contextualRequest.getOption(key);
    }
    return (0, import_utils.get)(opts, key);
  };
  request2.getOptions = (key) => {
    const contextualRequest = getContextualRequest();
    if (contextualRequest) {
      return contextualRequest.getOptions(key);
    }
    if (key) {
      return (0, import_utils.get)(opts, key);
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
