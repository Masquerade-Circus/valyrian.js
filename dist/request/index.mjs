// lib/request/index.ts
var localValyrian = {
  isNodeJs: Boolean(typeof process !== "undefined" && process.versions && process.versions.node)
};
function serialize(obj, prefix = "") {
  return Object.keys(obj).map((prop) => {
    let k = prefix ? `${prefix}[${prop}]` : prop;
    return typeof obj[prop] === "object" ? serialize(obj[prop], k) : `${encodeURIComponent(k)}=${encodeURIComponent(obj[prop])}`;
  }).join("&");
}
function parseUrl(url, options) {
  let u = /^https?/gi.test(url) ? url : options.urls.base + url;
  let parts = u.split("?");
  u = parts[0].trim().replace(/^\/\//, "/").replace(/\/$/, "").trim();
  if (parts[1]) {
    u += `?${parts[1]}`;
  }
  if (localValyrian.isNodeJs && typeof options.urls.node === "string") {
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
var defaultOptions = { allowedMethods: ["get", "post", "put", "patch", "delete"] };
function Requester(baseUrl = "", options = defaultOptions) {
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
  let opts = {
    ...options,
    urls: {
      node: options.urls.node || null,
      api: options.urls.api || null,
      base: options.urls.base ? options.urls.base + url : url
    }
  };
  const request2 = async function request3(method, url2, data, options2 = {}) {
    let innerOptions = {
      method: method.toUpperCase(),
      headers: {},
      resolveWithFullResponse: false,
      ...opts,
      ...options2
    };
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
            for (let i in data) {
              formData.append(i, data[i]);
            }
          }
          innerOptions.body = formData;
        }
      }
    }
    let response = await fetch(parseUrl(url2, opts), innerOptions);
    let body = null;
    if (!response.ok) {
      let err = new Error(response.statusText);
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
  request2.new = (baseUrl2, options2) => Requester(baseUrl2, { ...opts, ...options2 });
  request2.setOption = (key, value) => {
    let result = opts;
    let parsed = key.split(".");
    let next;
    while (parsed.length) {
      next = parsed.shift();
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
  request2.getOptions = (key) => {
    if (!key) {
      return opts;
    }
    let result = opts;
    let parsed = key.split(".");
    let next;
    while (parsed.length) {
      next = parsed.shift();
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
    (method) => request2[method] = (url2, data, options2) => request2(method, url2, data, options2)
  );
  return request2;
}
var request = Requester();
var plugin = (v) => {
  localValyrian = v;
  v.request = request;
  return request;
};
export {
  plugin,
  request
};
