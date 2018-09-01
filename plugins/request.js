let plugin = function (v) {
    let Request = function (baseUrl = '', options = {}) {
        let url = baseUrl.replace(/\/$/gi, '').trim(),
            opts = Object.assign({
                methods: ['get', 'post', 'put', 'patch', 'delete']
            }, options),
            parseUrl;

        function serialize(obj, prefix) {
            let e = encodeURIComponent;
            return Object.keys(obj)
                .map((p) => {
                    let k = prefix ? prefix + '[' + p + ']' : p;

                    return typeof obj[p] === 'object'
                        ? serialize(obj[p], k)
                        : e(k) + '=' + e(obj[p]);
                })
                .join('&');
        }

        function request(method, url, data, options = {}) {
            let opts = Object.assign({
                    method: method.toLowerCase(),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }, request.options, options),
                type = opts.headers.Accept;

            if (data !== undefined) {
                if (opts.method === 'get' && typeof data === 'object') {
                    url += data = serialize(data);
                }

                if (opts.method !== 'get') {
                    opts.body = JSON.stringify(data);
                }
            }

            return fetch(parseUrl(url), opts)
                .then(response => {
                    if (response.status < 200 || response.status > 300) {
                        let err = new Error(response.statusText);
                        err.response = response;
                        throw err;
                    }

                    if (/text/gi.test(type)) {
                        return response.text();
                    }

                    if (/json/gi.test(type)) {
                        return response.json();
                    }

                    return response;
                });
        };

        parseUrl = function (url) {
            let u = /^https?/gi.test(url)
                ? url
                : (request.baseUrl + '/' + url).trim().replace(/^\/\//gi, '/').trim();

            if (
                v.is.node &&
                typeof request.nodeUrl === 'string'
            ) {
                request.nodeUrl = request.nodeUrl.replace(/\/$/gi, '').trim();

                if (/^https?/gi.test(u) && typeof request.apiUrl === 'string') {
                    request.apiUrl = request.apiUrl.replace(/\/$/gi, '').trim();
                    u = u.replace(request.apiUrl, request.nodeUrl);
                }

                if (!/^https?/gi.test(u)) {
                    u = request.nodeUrl + u;
                }
            }

            return u;
        };

        request.new = function (baseUrl, options) {
            return Request(baseUrl, options);
        };

        // Change this to  request.urls.api etc...
        request.apiUrl = undefined;
        request.nodeUrl = undefined;
        request.options = opts;
        request.baseUrl = url;

        opts.methods.forEach(method =>
            request[method] = (url, data, options) => request(method, url, data, options)
        );

        return request;
    };

    v.request = Request();
};

// module.exports = plugin;
export default plugin;
