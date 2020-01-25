let plugin = function (v) {
  let Request = function (baseUrl = '', options = {}) {
    let url = baseUrl.replace(/\/$/gi, '').trim(),
      opts = Object.assign(
        {
          methods: ['get', 'post', 'put', 'patch', 'delete']
        },
        options
      ),
      parseUrl;

    function serialize(obj, prefix) {
      let e = encodeURIComponent;
      return Object.keys(obj)
        .map((p) => {
          let k = prefix ? prefix + '[' + p + ']' : p;

          if (typeof obj[p] === 'object') {
            return serialize(obj[p], k);
          }

          return e(k) + '=' + e(obj[p]);
        })
        .join('&');
    }

    async function request(method, url, data, options = {}) {
      let opts = Object.assign(
        {
          method: method.toLowerCase(),
          headers: {},
          resolveWithFullResponse: false
        },
        request.options,
        options
      );

      if (!opts.headers.Accept) {
        opts.headers.Accept = 'application/json';
      }

      let acceptType = opts.headers.Accept;
      let contentType = opts.headers['Content-Type'] || opts.headers['content-type'] || '';

      if (opts.methods.indexOf(method) === -1) {
        throw new Error('Method not allowed');
      }

      if (data) {
        if (opts.method === 'get' && typeof data === 'object') {
          url += '?' + serialize(data);
        }

        if (opts.method !== 'get') {
          if (/json/gi.test(contentType)) {
            opts.body = JSON.stringify(data);
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
            opts.body = formData;
          }
        }
      }

      let response = await fetch(parseUrl(url), opts);

      if (!response.ok) {
        let err = new Error(response.statusText);
        err.response = response;
        throw err;
      }

      if (opts.resolveWithFullResponse) {
        return response;
      }

      if (/text/gi.test(acceptType)) {
        response.text();
      }

      if (/json/gi.test(acceptType)) {
        return response.json();
      }

      return response;
    }

    parseUrl = function (url) {
      let u = /^https?/gi.test(url)
        ? url
        : (request.urls.base + url)
          .trim()
          .replace(/^\/\//gi, '/')
          .trim();

      if (v.isNode && typeof request.urls.node === 'string') {
        request.urls.node = request.urls.node.replace(/\/$/gi, '').trim();

        if (typeof request.urls.api === 'string') {
          request.urls.api = request.urls.api.replace(/\/$/gi, '').trim();
          u = u.replace(request.urls.api, request.urls.node);
        }

        if (!/^https?/gi.test(u)) {
          u = request.urls.node + u;
        }
      }

      return u;
    };

    request.new = function (baseUrl, options) {
      return Request(baseUrl, options);
    };

    request.urls = {};
    request.urls.api = undefined;
    request.urls.node = undefined;
    request.urls.base = url;
    request.options = opts;

    opts.methods.forEach((method) => (request[method] = (url, data, options) => request(method, url, data, options)));

    return request;
  };

  v.request = Request();
};

export default plugin;
