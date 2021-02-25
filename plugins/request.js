function serialize(obj, prefix) {
  return Object.keys(obj)
    .map((p) => {
      let k = prefix ? `${prefix}[${p}]` : p;
      return typeof obj[p] === "object" ? serialize(obj[p], k) : `${encodeURIComponent(k)}=${encodeURIComponent(obj[p])}`;
    })
    .join("&");
}

let plugin = function(v) {
  function parseUrl(url, options = {}) {
    let u = /^https?/gi.test(url) ? url : options.urls.base + url;

    let parts = u.split("?");
    u = parts[0]
      .trim()
      .replace(/^\/\//, "/")
      .replace(/\/$/, "")
      .trim();

    if (parts[1]) {
      u += `?${parts[1]}`;
    }

    if (v.isNode && typeof options.urls.node === "string") {
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

  function Request(baseUrl = "", options = {}) {
    let url = baseUrl.replace(/\/$/gi, "").trim();
    options.urls = options.urls || {};
    let opts = {
      methods: ["get", "post", "put", "patch", "delete"],
      ...options,
      urls: {
        node: options.urls.node || null,
        api: options.urls.api || null,
        base: options.urls.base ? options.urls.base + url : url
      }
    };

    async function request(method, url, data, options = {}) {
      let innerOptions = {
        method: method.toLowerCase(),
        headers: {},
        resolveWithFullResponse: false,
        ...opts,
        ...options
      };

      if (!innerOptions.headers.Accept) {
        innerOptions.headers.Accept = "application/json";
      }

      let acceptType = innerOptions.headers.Accept;
      let contentType = innerOptions.headers["Content-Type"] || innerOptions.headers["content-type"] || "";

      if (innerOptions.methods.indexOf(method) === -1) {
        throw new Error("Method not allowed");
      }

      if (data) {
        if (innerOptions.method === "get" && typeof data === "object") {
          url += `?${serialize(data)}`;
        }

        if (innerOptions.method !== "get") {
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

      if (!response.ok) {
        let err = new Error(response.statusText);
        err.response = response;
        throw err;
      }

      if (innerOptions.resolveWithFullResponse) {
        return response;
      }

      if (/text/gi.test(acceptType)) {
        return response.text();
      }

      if (/json/gi.test(acceptType)) {
        return response.json();
      }

      return response;
    }

    request.new = (baseUrl, options) => Request(baseUrl, { ...opts, ...options });

    request.options = (key, value) => {
      let result = opts;

      if (typeof key === "undefined") {
        return result;
      }

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

    opts.methods.forEach((method) => (request[method] = (url, data, options) => request(method, url, data, options)));

    return request;
  }

  v.request = Request();
};

plugin.default = plugin;
module.exports = plugin;
