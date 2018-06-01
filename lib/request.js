let Request = function (baseUrl = '', options = {}) {
    let url = baseUrl.replace(/\/$/gi, '').trim(),
        opts = Object.assign({}, options),
        isNode = typeof window === 'undefined',
        Fetch = isNode ? require('node-fetch') : fetch.bind(window),
        parseUrl;

    let methods = ['get', 'post', 'put', 'patch', 'delete'];

    function serialize(obj, prefix) {
        let e = encodeURIComponent;
        return '?' + Object.keys(obj).map(k => {
            if (prefix !== undefined) {
                k = prefix + "[" + k + "]";
            }

            return typeof obj[k] === 'object' ?
                serialize(obj[k], k) :
                e(k) + '=' + e(obj[k]);
        }).join('&');
    };

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

        return Fetch(parseUrl(url), opts)
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

    parseUrl = function parseUrl(url) {
        let u = (request.baseUrl + '/' + url).trim().replace(/^\/\//gi, '/').trim();
        if (
            isNode &&
            typeof request.nodeUrl === 'string'
        ) {
            request.nodeUrl = request.nodeUrl.replace(/\/$/gi, '').trim();

            if (/^http/gi.test(u) && typeof request.apiUrl === 'string') {
                request.apiUrl = request.apiUrl.replace(/\/$/gi, '').trim();
                u = u.replace(request.apiUrl, request.nodeUrl);
            }

            if (!/^http/gi.test(u)) {
                u = request.nodeUrl + u;
            }
        }
        return u;
    };

    request.new = function (baseUrl, options) {
        let url = request.baseUrl + '/' + baseUrl,
            opts = Object.assign({}, request.options, options);
        return Request(url, opts);
    };

    request.apiUrl = undefined;
    request.nodeUrl = undefined;
    request.options = opts;
    request.baseUrl = url;

    methods.forEach(method =>
        request[method] = (url, data, options) => request(method, url, data, options)
    );

    return request;
};

export default Request();
