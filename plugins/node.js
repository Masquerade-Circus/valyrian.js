let fs = require('fs');
let path = require('path');

let cssnano = require('cssnano');
let CleanCSS = require('clean-css');
let {PurgeCSS} = require('purgecss');
let fetch = require('node-fetch');
let FormData = require('form-data');

let {Document, parseHtml} = require('./utils/dom');
let treeAdapter = require('./utils/tree-adapter');
let requestPlugin = require('./request').default;

global.fetch = fetch;
global.FormData = FormData;
global.document = new Document();


let errorHandler = (resolve, reject) => (err) => {
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

    if (typeof file === 'string') {
      if (/^https?:\/\//gi.test(file)) {
        return v.request
          .get(
            file,
            {},
            {
              headers: {
                Accept: 'text/plain',
                'Content-Type': 'text/plain'
              }
            }
          )
          .then((contents) => {
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
    }

    if (typeof file === 'object' && 'raw' in file) {
      return prop += file.raw;
    }
  };
}

function inline(...args) {
  let promises = args.map((item) => {
    let ext = item.split('.').pop();
    if (!inline[ext]) {
      inline[ext] = fileMethodFactory();
    }
    return inline[ext](item);
  });

  return Promise.all(promises);
}

inline.css = fileMethodFactory();
inline.js = fileMethodFactory();

inline.uncss = (function () {
  let prop = '';
  return async function (renderedHtml, options = {}) {
    if (!renderedHtml) {
      return prop;
    }

    let opt = Object.assign(
      {
        minify: true,
        purgecssOptions: {},
        cleanCssOptions: {}
      },
      options
    );

    opt.raw = inline.css();

    let html = await Promise.all(renderedHtml);

    let contents = html.map((item) => {
      return {
        raw: item.replace(/<script [^>]*><\/script>/gi, ''),
        extension: 'html'
      };
    });

    let purgecss = new PurgeCSS();
    let output = await purgecss.purge({
      content: contents,
      css: [{raw: opt.raw}],
      ...opt.purgecssOptions
    });

    prop = output[0].css;
    if (!opt.minify) {
      return prop;
    }

    prop = new CleanCSS({
      level: {
        1: {
          // rounds pixel values to `N` decimal places; `false` disables rounding; defaults to `false`
          roundingPrecision: 'all=3',
          specialComments: 'none' // denotes a number of /*! ... */ comments preserved; defaults to `all`
        },
        2: {
          restructureRules: true // controls rule restructuring; defaults to false
        }
      },
      compatibility: 'ie11',
      ...opt.cleanCssOptions
    }).minify(prop).styles;

    prop = (await cssnano.process(prop, {from: undefined})).css;
    return prop;
  };
}());

function sw(file, options = {}) {
  let swfiletemplate = path.resolve(__dirname, './node.sw.tpl.js');
  let swTpl = fs.readFileSync(swfiletemplate, 'utf8');
  let opt = Object.assign(
    {
      version: 'v1::',
      name: 'Valyrian.js',
      urls: ['/'],
      debug: false
    },
    options
  );
  let contents = swTpl
    .replace('v1::', 'v' + opt.version + '::')
    .replace('Valyrian.js', opt.name)
    .replace("['/']", '["' + opt.urls.join('","') + '"]');

  if (!opt.debug) {
    contents = contents.replace('console.log', '() => {}');
  }

  return new Promise((resolve, reject) => {
    fs.writeFile(file, contents, 'utf8', errorHandler(resolve, reject));
  });
}

function parseDom(childNodes, depth = 1) {
  let spaces = '';
  for (let i = 0; i < depth; i++) {
    spaces += '  ';
  }

  return childNodes
    .map((item) => {
      if (item.nodeType === 3) {
        return `\n${spaces}"${item.nodeValue}"`;
      } else {
        let str = `\n${spaces}v("${item.nodeName}", `;

        if (item.attributes) {
          let attrs = {};
          for (let i = 0, l = item.attributes.length; i < l; i++) {
            let attr = item.attributes[i];
            attrs[attr.nodeName] = attr.nodeValue;
          }
          str += JSON.stringify(attrs);
        } else {
          str += '{}';
        }

        str += ', [';
        if (item.childNodes && item.childNodes.length > 0) {
          str += `${parseDom(item.childNodes, depth + 1)}\n${spaces}`;
        }

        str += `])`;
        return str;
      }
    })
    .join(',');
}


function htmlToHyperscript(html) {
  return '[' + parseDom(parseHtml(html, {treeAdapter: treeAdapter})) + '\n]';
}

function icons(source, configuration = {}) {
  let favicons = require('favicons'),
    options = Object.assign({}, icons.options, configuration);

  if (options.iconsPath) {
    options.iconsPath = options.iconsPath.replace(/\/$/gi, '') + '/';
  }

  if (options.linksViewPath) {
    options.linksViewPath = options.linksViewPath.replace(/\/$/gi, '') + '/';
  }

  async function processResponse(response, options) {
    let promises = [];
    if (options.iconsPath) {
      for (let i in response.images) {
        promises.push(
          new Promise((resolve, reject) => {
            fs.writeFile(
              options.iconsPath + response.images[i].name,
              response.images[i].contents,
              errorHandler(resolve, reject)
            );
          })
        );
      }

      for (let i in response.files) {
        promises.push(
          new Promise((resolve, reject) => {
            fs.writeFile(
              options.iconsPath + response.files[i].name,
              response.files[i].contents,
              errorHandler(resolve, reject)
            );
          })
        );
      }
    }

    if (options.linksViewPath) {
      let html = 'export default function(){ \n    return ';
      html += htmlToHyperscript(response.html.join(''));
      html += ';\n    \n};';

      promises.push(
        new Promise((resolve, reject) => {
          fs.writeFile(`${options.linksViewPath}/links.js`, html, errorHandler(resolve, reject));
        })
      );
    }

    return Promise.all(promises);
  }

  return new Promise((resolve, reject) => {
    favicons(source, options, (err, response) => {
      if (err) {
        process.stdout.write(err.status + '\n'); // HTTP error code (e.g. `200`) or `null`
        process.stdout.write(err.name + '\n'); // Error name e.g. "API Error"
        process.stdout.write(err.message + '\n'); // Error description e.g. "An unknown error has occurred"

        return reject(err);
      }

      processResponse(response, options)
        .then(() => {
          resolve(response);
        })
        .catch(reject);
    });
  });
}

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
  display: 'standalone', // Android display: "browser" or "standalone". `string`
  orientation: 'any', // Android orientation: "any" "portrait" or "landscape". `string`
  start_url: '/', // Android start application's URL. `string`
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
  v.usePlugin(requestPlugin);
  v.inline = inline;
  v.sw = sw;
  v.icons = icons;
  v.htmlToHyperscript = htmlToHyperscript;
};

module.exports = plugin;
module.exports.default = module.exports;
