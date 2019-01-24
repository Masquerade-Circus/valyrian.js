import swTpl from './sw.tpl.js';
import undom from 'undom';
let cssnano = require('cssnano');
let CleanCSS = require('clean-css');

global.fetch = require('node-fetch');
global.document = undom();

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

function inline(...args) {
    let promises = args.map(item => {
        let ext = item.split('.').pop();
        if (!inline[ext]) {
            inline[ext] = fileMethodFactory();
        }
        return inline[ext](item);
    });

    return Promise.all(promises);
};

inline.uncss = (function () {
    let prop = '';
    return function (renderedHtml, options = {}) {
        if (!renderedHtml) {
            return prop;
        }

        let opt = Object.assign({
            minify: true
        }, options);

        opt.raw = inline.css();
        return Promise.all(renderedHtml)
            .then(html => {
                html.forEach((item, index) => {
                    html[index] = item.replace(/<script [^>]*><\/script>/gi, '');
                });

                return new Promise((resolve, reject) => {
                    uncss(html, opt, (err, output) => {
                        if (err) {
                            return reject(err);
                        }

                        if (!opt.minify) {
                            prop = output;
                            return resolve(output);
                        }

                        output = new CleanCSS({
                            level: {
                                1: {
                                    roundingPrecision: 'all=3', // rounds pixel values to `N` decimal places; `false` disables rounding; defaults to `false`
                                    specialComments: 'none' // denotes a number of /*! ... */ comments preserved; defaults to `all`
                                },
                                2: {
                                    restructureRules: true // controls rule restructuring; defaults to false
                                }
                            },
                            compatibility: 'ie11'
                        }).minify(output).styles;

                        cssnano.process(output).then(result => {
                            prop = result.css;
                            resolve(prop);
                        });
                    });
                });
            });
    };
}());


function sw(file, options = {}) {
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


function icons(source, configuration = {}) {
    let favicons = require('favicons'),
        html2hs = require('html2hs'),
        options = Object.assign({}, icons.options, configuration);

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

icons.options = {
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

let plugin = function (v) {
    v.inline = inline;
    v.sw = sw;
    v.icons = icons;
};

export default plugin;
