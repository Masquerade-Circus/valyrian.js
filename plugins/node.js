let fs = require("fs");
let path = require("path");
require("ts-node/register");

let fetch = require("node-fetch");
let FormData = require("form-data");
let treeAdapter = require("./utils/tree-adapter");

let os = require("os");

let rollup = require("rollup");
let commonjs = require("@rollup/plugin-commonjs");
let { nodeResolve } = require("@rollup/plugin-node-resolve");
let includepaths = require("rollup-plugin-includepaths");
let buble = require("@rollup/plugin-buble");
let json = require("@rollup/plugin-json");
let { terser: terserPlugin } = require("rollup-plugin-terser");
let terser = require("terser");
let sourcemaps = require("rollup-plugin-sourcemaps");
let typescript = require("@rollup/plugin-typescript");
let esbuild = require("esbuild");
let esbuildRollup = require("rollup-plugin-esbuild");
let { PurgeCSS } = require("purgecss");
let CleanCSS = require("clean-css");
let csso = require("csso");

let sucrase = require("@rollup/plugin-sucrase");
const tsc = require("tsc-prog");

global.fetch = fetch;
global.FormData = FormData;
global.document = treeAdapter.createDocument();

let errorHandler = (resolve, reject) => (err) => {
  if (err) {
    return reject(err);
  }

  resolve();
};

function fileMethodFactory() {
  let prop = [];
  return function (file, options = {}) {
    if (!file) {
      return prop;
    }

    let asyncMethod = async () => {
      let contents = "";
      if (typeof file === "string") {
        let ext = file.split(".").pop();
        if (/(js|jsx|mjs|ts|tsx)/.test(ext)) {
          // let inputOptions = options.inputOptions || {};
          // let outputOptions = options.outputOptions || {};
          // let minify = (options.outputOptions || {}).compact === false ? false : true;

          // let defaultPlugins = [
          //   // includepaths({ paths: [process.cwd(), process.cwd() + "/node_modules"] }),
          //   // nodeResolve({
          //   //   mainFields: ["browser", "jsnext", "module", "main"],
          //   //   browser: true,
          //   //   extensions: [".js", ".ts", ".jsx", ".tsx", ".mjs"]
          //   // }),
          //   // json()
          // ];

          // if (/(ts|tsx)/.test(ext)) {
          //   defaultPlugins.push(
          //     typescript({
          //       // target: "ESNext" /* For reference check: https://node.green/#ESNEXT */,
          //       module: "ESNext",
          //       strict: true,
          //       moduleResolution: "node",
          //       esModuleInterop: true,
          //       inlineSourceMap: false,
          //       sourceMap: true,
          //       allowJs: true,
          //       resolveJsonModule: true,
          //       removeComments: true
          //     })
          //   );
          // }

          // defaultPlugins.push(
          //   esbuildRollup({
          //     // All options are optional
          //     include: /\.(js|jsx|mjs|ts|tsx)$/,
          //     exclude: [],
          //     sourceMap: true,
          //     minify,
          //     target: "es2020",
          //     jsxFactory: "v",
          //     jsxFragment: "v",
          //     // Add extra loaders
          //     loader: { ".js": "jsx", ".ts": "tsx", ".mjs": "jsx" }
          //   })
          // );

          // defaultPlugins.push(
          //   commonjs({
          //     sourceMap: true,
          //     transformMixedEsModules: true
          //   })
          // );

          // if (minify) {
          //   defaultPlugins.push(
          //     terserPlugin({
          //       warnings: "verbose",
          //       compress: {
          //         booleans_as_integers: true
          //       },
          //       output: {
          //         wrap_func_args: false
          //       },
          //       ecma: 2020
          //     })
          //   );
          // }

          // defaultPlugins.push(...(inputOptions.plugins || []));

          // inputOptions = {
          //   ...inputOptions,
          //   input: file,
          //   plugins: defaultPlugins
          // };

          // outputOptions = {
          //   compact: minify,
          //   format: "iife",
          //   name: "v" + (0 | (Math.random() * 9e6)).toString(36),
          //   ...outputOptions,
          //   sourcemap: true
          // };

          // const bundle = await rollup.rollup(inputOptions);

          // const { output } = await bundle.generate(outputOptions);

          // for (const chunkOrAsset of output) {
          //   if (chunkOrAsset.type === "chunk") {
          //     let mapBase64 = Buffer.from(chunkOrAsset.map.toString()).toString("base64");
          //     let suffix = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
          //     contents = { raw: chunkOrAsset.code, map: suffix, file };
          //   }
          // }

          if (/(ts|tsx)/.test(ext) && !options.noValidate) {
            tsc.build({
              basePath: process.cwd(), // always required, used for relative paths
              configFilePath: "tsconfig.json", // config to inherit from (optional)
              compilerOptions: {
                rootDir: "./",
                outDir: "dist",
                noEmitOnError: true,
                noEmit: true,
                declaration: false
              },
              files: [file],
              include: ["**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx", "**/*.mjs"],
              exclude: ["test*/**/*", "**/*.test.ts", "**/*.spec.ts"],
              ...(options.tsc || {})
            });
          }

          let result = esbuild.buildSync({
            entryPoints: [file],
            bundle: true,
            sourcemap: "external",
            write: false,
            minify: true,
            outdir: "out",
            target: ["es2020"],
            jsxFactory: "v",
            loader: { ".js": "jsx", ".ts": "tsx", ".mjs": "jsx" },
            ...(options.esbuild || {})
          });

          let result2 = await terser.minify(result.outputFiles[1].text, {
            sourceMap: {
              content: result.outputFiles[0].text.toString()
            },
            compress: {
              booleans_as_integers: true
            },
            output: {
              wrap_func_args: false
            },
            ecma: 2020,
            ...(options.terser || {})
          });

          let mapBase64 = Buffer.from(result2.map.toString()).toString("base64");
          let suffix = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
          contents = { raw: result2.code, map: suffix, file };
        } else if (/(css|scss|styl)/.test(ext)) {
          let result = new CleanCSS({
            sourceMap: true,
            level: {
              1: {
                roundingPrecision: "all=3"
              },
              2: {
                restructureRules: true // controls rule restructuring; defaults to false
              }
            }
          }).minify([file]);

          contents = { raw: result.styles, map: null, file };
        } else {
          contents = { raw: fs.readFileSync(file, "utf8"), map: null, file };
        }
      } else if (typeof file === "object" && "raw" in file) {
        contents = { map: null, ...file };
      }

      prop.push(contents);
      return prop;
    };

    return asyncMethod();
  };
}

async function inline(...args) {
  for (let item of args) {
    let ext = item.split(".").pop();
    if (!inline[ext]) {
      inline[ext] = fileMethodFactory();
    }
    await inline[ext](item);
  }
}

inline.extensions = (...extensions) => {
  for (let ext of extensions) {
    if (!inline[ext]) {
      inline[ext] = fileMethodFactory();
    }
  }
};

inline.css = fileMethodFactory();
inline.js = fileMethodFactory();

inline.uncss = (function () {
  let prop = "";
  return function (renderedHtml, options = {}) {
    if (!renderedHtml) {
      return prop;
    }

    let asyncMethod = async () => {
      let html = await Promise.all(renderedHtml);

      let contents = html.map((item) => {
        return {
          raw: item,
          extension: "html"
        };
      });

      let purgecss = new PurgeCSS();
      let css = inline
        .css()
        .map((item) => item.raw)
        .join("");

      let output = await purgecss.purge({
        fontFace: true,
        keyframes: true,
        variables: true,
        defaultExtractor: (content) => content.match(/[A-Za-z0-9-_/:@]*[A-Za-z0-9-_/:@/]+/g) || [],
        ...options,
        content: contents,
        css: [{ raw: css }]
      });

      prop = new CleanCSS({
        sourceMap: false,
        level: {
          1: {
            roundingPrecision: "all=3"
          },
          2: {
            restructureRules: true // controls rule restructuring; defaults to false
          }
        }
      }).minify(output[0].css).styles;

      return prop;
    };

    return asyncMethod();
  };
})();

function sw(file, options = {}) {
  let swfiletemplate = path.resolve(__dirname, "./node.sw.tpl.js");
  let swTpl = fs.readFileSync(swfiletemplate, "utf8");
  let opt = Object.assign(
    {
      version: "v1::",
      name: "Valyrian.js",
      urls: ["/"],
      debug: false
    },
    options
  );
  let contents = swTpl
    .replace("v1::", "v" + opt.version + "::")
    .replace("Valyrian.js", opt.name)
    .replace("['/']", '["' + opt.urls.join('","') + '"]');

  if (!opt.debug) {
    contents = contents.replace("console.log", "() => {}");
  }

  return new Promise((resolve, reject) => {
    fs.writeFile(file, contents, "utf8", errorHandler(resolve, reject));
  });
}

function icons(source, configuration = {}) {
  let favicons = require("favicons"),
    options = Object.assign({}, icons.options, configuration);

  if (options.iconsPath) {
    options.iconsPath = options.iconsPath.replace(/\/$/gi, "") + "/";
  }

  if (options.linksViewPath) {
    options.linksViewPath = options.linksViewPath.replace(/\/$/gi, "") + "/";
  }

  async function processResponse(response, options) {
    let promises = [];
    if (options.iconsPath) {
      for (let i in response.images) {
        promises.push(
          new Promise((resolve, reject) => {
            fs.writeFile(options.iconsPath + response.images[i].name, response.images[i].contents, errorHandler(resolve, reject));
          })
        );
      }

      for (let i in response.files) {
        promises.push(
          new Promise((resolve, reject) => {
            fs.writeFile(options.iconsPath + response.files[i].name, response.files[i].contents, errorHandler(resolve, reject));
          })
        );
      }
    }

    if (options.linksViewPath) {
      let html = `
function Links(){
  return ${treeAdapter.htmlToHyperscript(response.html.join(""))};
}

Links.default = Links;
module.exports = Links;
      `;

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
        process.stdout.write(err.status + "\n"); // HTTP error code (e.g. `200`) or `null`
        process.stdout.write(err.name + "\n"); // Error name e.g. "API Error"
        process.stdout.write(err.message + "\n"); // Error description e.g. "An unknown error has occurred"

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
  path: "", // Path for overriding default icons path. `string`
  appName: null, // Your application's name. `string`
  appDescription: null, // Your application's description. `string`
  developerName: null, // Your (or your developer's) name. `string`
  developerURL: null,
  dir: "auto",
  lang: "en-US",
  background: "#fff", // Background colour for flattened icons. `string`
  theme_color: "#fff",
  display: "standalone", // Android display: "browser" or "standalone". `string`
  orientation: "any", // Android orientation: "any" "portrait" or "landscape". `string`
  start_url: "/", // Android start application's URL. `string`
  version: "1.0", // Your application's version number. `number`
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
  v.htmlToDom = treeAdapter.htmlToDom;
  v.domToHtml = treeAdapter.domToHtml;
  v.domToHyperscript = treeAdapter.domToHyperscript;
  v.htmlToHyperscript = treeAdapter.htmlToHyperscript;
  v.hyperscriptToHtml = (...args) => v.mount("div", () => args);
};

plugin.inline = inline;
plugin.sw = sw;
plugin.icons = icons;
plugin.htmlToDom = treeAdapter.htmlToDom;
plugin.domToHtml = treeAdapter.domToHtml;
plugin.domToHyperscript = treeAdapter.domToHyperscript;
plugin.htmlToHyperscript = treeAdapter.htmlToHyperscript;
plugin.hyperscriptToHtml = (...args) => v.mount("div", () => args);

plugin.default = plugin;
module.exports = plugin;
