// lib/request/index.ts
import { isNodeJs } from "valyrian.js";
import { get, set } from "valyrian.js/utils";
function serialize(obj, prefix = "") {
  const params = new URLSearchParams();
  Object.keys(obj).forEach((prop) => {
    const key = prefix ? `${prefix}[${prop}]` : prop;
    if (typeof obj[prop] === "object") {
      params.append(key, serialize(obj[prop], key).toString());
    } else {
      params.append(key, obj[prop]);
    }
  });
  return params;
}
function serializeFormData(data) {
  const fd = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value === null || value === void 0) return;
    if (Array.isArray(value)) {
      value.forEach((v) => fd.append(key, v));
    } else {
      fd.append(key, value);
    }
  });
  return fd;
}
function parseUrl(url, options) {
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
var defaultOptions = { allowedMethods: ["get", "post", "put", "patch", "delete", "head", "options"] };
var isNativeBody = (data) => data instanceof FormData || data instanceof URLSearchParams || data instanceof Blob || data instanceof ArrayBuffer || typeof DataView !== "undefined" && data instanceof DataView || typeof ReadableStream !== "undefined" && data instanceof ReadableStream;
function Requester(baseUrl = "", options = defaultOptions) {
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
  const request2 = async function request3(method, url2, data, options2 = {}) {
    const innerOptions = {
      method: method.toUpperCase(),
      headers: {},
      resolveWithFullResponse: false,
      ...opts,
      ...options2
    };
    innerOptions.headers = { ...innerOptions.headers, ...opts.headers, ...options2.headers };
    if (!innerOptions.headers.Accept) {
      innerOptions.headers.Accept = "application/json";
    }
    const acceptType = innerOptions.headers.Accept;
    const contentType = innerOptions.headers["Content-Type"] || innerOptions.headers["content-type"] || "";
    if (!innerOptions.allowedMethods.includes(method)) {
      throw new Error(`Method ${method} not allowed. Allowed methods: ${innerOptions.allowedMethods.join(", ")}`);
    }
    let finalUrl;
    try {
      finalUrl = parseUrl(url2, opts);
    } catch (error) {
      throw new Error(`Failed to parse URL: ${url2}`);
    }
    if (data) {
      if (innerOptions.method === "GET" && typeof data === "object") {
        finalUrl.search = serialize(data).toString();
      } else if (isNativeBody(data) || typeof data === "string") {
        innerOptions.body = data;
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
      const err = new Error(`${response.status}: ${response.statusText}`);
      err.response = response;
      if (/text/gi.test(acceptType)) {
        err.body = await response.text();
      }
      if (/json/gi.test(acceptType)) {
        try {
          err.body = await response.json();
        } catch (error) {
          err.body = null;
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
  };
  request2.new = (baseUrl2, options2) => Requester(baseUrl2, { ...opts, ...options2 || {} });
  request2.setOption = (key, value) => {
    set(opts, key, value);
    return opts;
  };
  request2.getOptions = (key) => {
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
var request = Requester();
export {
  request
};
