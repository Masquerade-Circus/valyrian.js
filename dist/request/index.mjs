// lib/request/index.ts
import { isNodeJs } from "valyrian.js";
function serialize(obj, prefix = "") {
  return Object.keys(obj).map((prop) => {
    const k = prefix ? `${prefix}[${prop}]` : prop;
    return typeof obj[prop] === "object" ? serialize(obj[prop], k) : `${encodeURIComponent(k)}=${encodeURIComponent(obj[prop])}`;
  }).join("&");
}
function parseUrl(url, options) {
  let u = /^https?/gi.test(url) ? url : options.urls.base + url;
  const parts = u.split("?");
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
var defaultOptions = { allowedMethods: ["get", "post", "put", "patch", "delete", "head", "options"] };
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
    if (!innerOptions.headers.Accept) {
      innerOptions.headers.Accept = "application/json";
    }
    const acceptType = innerOptions.headers.Accept;
    const contentType = innerOptions.headers["Content-Type"] || innerOptions.headers["content-type"] || "";
    if (innerOptions.allowedMethods.indexOf(method) === -1) {
      throw new Error("Method not allowed");
    }
    if (data) {
      if (innerOptions.method === "GET" && typeof data === "object") {
        url2 += `?${serialize(data)}`;
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
            for (const i in data) {
              formData.append(i, data[i]);
            }
          }
          innerOptions.body = formData;
        }
      }
    }
    const response = await fetch(parseUrl(url2, opts), innerOptions);
    let body = null;
    if (!response.ok) {
      const err = new Error(response.statusText);
      err.response = response;
      if (/text/gi.test(acceptType)) {
        err.body = await response.text();
      }
      if (/json/gi.test(acceptType)) {
        try {
          err.body = await response.json();
        } catch (error) {
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
      }
    }
    return response;
  };
  request2.new = (baseUrl2, options2) => Requester(baseUrl2, { ...opts, ...options2 || {} });
  request2.setOption = (key, value) => {
    let result = opts;
    const parsed = key.split(".");
    let next;
    while (parsed.length) {
      next = parsed.shift();
      const nextIsArray = next.indexOf("[") > -1;
      if (nextIsArray) {
        const idx = next.replace(/\D/gi, "");
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
  request2.getOptions = (key) => {
    if (!key) {
      return opts;
    }
    let result = opts;
    const parsed = key.split(".");
    let next;
    while (parsed.length) {
      next = parsed.shift();
      const nextIsArray = next.indexOf("[") > -1;
      if (nextIsArray) {
        const idx = next.replace(/\D/gi, "");
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
    (method) => request2[method] = (url2, data, options2) => request2(method, url2, data, options2)
  );
  return request2;
}
var request = Requester();
export {
  request
};
