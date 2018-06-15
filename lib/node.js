import swTpl from './sw.tpl.js';

let VNodeHelpersFactory = function (v) {
    let fs = require('fs'),
        uncss = require('uncss'),
        errorHandler = (resolve, reject) => err => {
            if (err) {
                return reject(err);
            }

            resolve();
        };

    function fileMethodFactory() {
        let prop = '';
        return function (file) {
            if (!file) {
                return prop;
            }

            if (/^https?:\/\//gi.test(file)) {
                return v.request.get(file, {}, {
                    headers: {
                        'Accept': 'text/plain',
                        'Content-Type': 'text/plain'
                    }
                })
                    .then(contents => {
                        prop += contents;
                    });
            }

            return new Promise((resolve, reject) => {
                fs.readFile(file, 'utf8', (err, contents) => {
                    if (err) {
                        return reject(err);
                    }

                    prop += contents;
                    resolve(prop);
                });
            });
        };
    };

    v.inline = function (...args) {
        let promises = args.map(item => {
            let ext = item.split('.').pop();
            if (!v.inline[ext]) {
                v.inline[ext] = fileMethodFactory();
            }
            return v.inline[ext](item);
        });

        return Promise.all(promises);
    };

    v.inline.uncss = (function () {
        let prop = '';
        return function (renderedHtml, options = {}) {
            options.raw = v.inline.css();
            if (!renderedHtml) {
                return prop;
            }

            return Promise.all(renderedHtml)
                .then(html => {
                    html.forEach((item, index) => {
                        html[index] = item.replace(/<script [^>]*><\/script>/gi, '');
                    });

                    return new Promise((resolve, reject) => {
                        uncss(html, options, (err, output) => {
                            if (err) {
                                reject(err);
                            }
                            prop = output;
                            resolve(output);
                        });
                    });
                });
        };
    }());


    v.sw = function (file, options = {}) {
        let opt = Object.assign({
                version: 'v1::',
                name: 'Valyrian.js',
                urls: ['/'],
                debug: false
            }, options),
            contents = swTpl
                .replace('v1::', 'v' + opt.version + '::')
                .replace('Valyrian.js', opt.name)
                .replace('[\'/\']', '["' + opt.urls.join('","') + '"]');

        if (!opt.debug) {
            contents = contents.replace('console.log', '() => {}');
        }

        return new Promise((resolve, reject) => {
            fs.writeFile(file, contents, 'utf8', errorHandler(resolve, reject));
        });
    };


    v.icons = function (source, configuration = {}) {
        let favicons = require('favicons'),
            html2hs = require('html2hs'),
            options = Object.assign({}, v.icons.options, configuration);

        if (options.iconsPath) {
            options.iconsPath = options.iconsPath.replace(/\/$/gi, '') + '/';
        }

        if (options.iconsPath) {
            options.linksViewPath = options.linksViewPath.replace(/\/$/gi, '') + '/';
        }

        return new Promise((resolve, reject) => {
            favicons(source, options, (err, response) => {
                if (err) {
                    process.stdout.write(err.status + '\n'); // HTTP error code (e.g. `200`) or `null`
                    process.stdout.write(err.name + '\n'); // Error name e.g. "API Error"
                    process.stdout.write(err.message + '\n'); // Error description e.g. "An unknown error has occurred"

                    return reject(err);
                }

                let promises = [];

                if (options.iconsPath) {
                    for (let i in response.images) {
                        promises.push(new Promise((resolve, reject) => {
                            fs.writeFile(options.iconsPath + response.images[i].name, response.images[i].contents, errorHandler(resolve, reject));
                        }));
                    }

                    for (let i in response.files) {
                        promises.push(new Promise((resolve, reject) => {
                            fs.writeFile(options.iconsPath + response.files[i].name, response.files[i].contents, errorHandler(resolve, reject));
                        }));
                    }
                }

                if (options.linksViewPath) {
                    let html = 'export default { \n    view(){ \n        return [';
                    for (let i in response.html) {
                        html += '\n            ' + html2hs(response.html[i]) + ',';
                    }
                    html = html.replace(/,$/gi, '').replace(/h\("/gi, 'v("') + '\n        ];\n    }\n};';

                    promises.push(new Promise((resolve, reject) => {
                        fs.writeFile(`${options.linksViewPath}/links.js`, html, errorHandler(resolve, reject));
                    }));
                }

                Promise.all(promises)
                    .then(() => {
                        resolve(response);
                    })
                    .catch(reject);
            });
        });
    };

    v.icons.options = {
        iconsPath: null, // Path to the generated icons
        linksViewPath: null, // Path to the generated links file

        // favicons options
        path: '', // Path for overriding default icons path. `string`
        appName: null, // Your application's name. `string`
        appDescription: null, // Your application's description. `string`
        developerName: null, // Your (or your developer's) name. `string`
        developerURL: null,
        dir: 'auto',
        lang: 'en-US',
        background: '#fff', // Background colour for flattened icons. `string`
        theme_color: '#fff',
        display: "standalone", // Android display: "browser" or "standalone". `string`
        orientation: "any", // Android orientation: "any" "portrait" or "landscape". `string`
        start_url: "/", // Android start application's URL. `string`
        version: '1.0', // Your application's version number. `number`
        logging: false, // Print logs to console? `boolean`
        icons: {
            android: true, // Create Android homescreen icon. `boolean`
            appleIcon: true, // Create Apple touch icons. `boolean` or `{ offset: offsetInPercentage }`
            appleStartup: true, // Create Apple startup images. `boolean`
            coast: false, // Create Opera Coast icon with offset 25%. `boolean` or `{ offset: offsetInPercentage }`
            favicons: true, // Create regular favicons. `boolean`
            firefox: false, // Create Firefox OS icons. `boolean` or `{ offset: offsetInPercentage }`
            windows: true, // Create Windows 8 tile icons. `boolean`
            yandex: false // Create Yandex browser icon. `boolean`
        }
    };
};

module.exports = VNodeHelpersFactory;