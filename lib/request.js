let Request = function (baseUrl = '', options = {}) {
    let url = baseUrl.replace(/\/$/gi, '').trim(),
        opts = Object.assign({}, options);

    let methods = ['get', 'post', 'put', 'patch', 'delete'];

    let r = function (baseUrl, options) {
        let url = r.baseUrl + '/' + baseUrl,
            opts = Object.assign({}, r.options, options);
        return Request(url, opts);
    };

    r.apiUrl = undefined;
    r.nodeUrl = undefined;
    r.isNode = typeof window === 'undefined';
    r.options = opts;
    r.baseUrl = url;
    let Fetch = r.isNode ? require('node-fetch') : fetch.bind(window);

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

    function parseUrl (url) {
        let u = (r.baseUrl + '/' + url).trim().replace(/^\/\//gi, '/').trim();
        if (
            r.isNode &&
            typeof r.nodeUrl === 'string'
        ) {
            r.nodeUrl = r.nodeUrl.replace(/\/$/gi, '').trim();

            if (/^http/gi.test(u) && typeof r.apiUrl === 'string') {
                r.apiUrl = r.apiUrl.replace(/\/$/gi, '').trim();
                u = u.replace(r.apiUrl, r.nodeUrl);
            }

            if (!/^http/gi.test(u)) {
                u = r.nodeUrl + u;
            }
        }
        return u;
    };

    function request(method, url, data, options = {}) {
        let opts = Object.assign({
            method: method.toLowerCase(),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }, r.options, options),
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

    methods.forEach(method =>
        r[method] = (url, data, options) => request(method, url, data, options)
    );

    return r;
};

export default Request();
