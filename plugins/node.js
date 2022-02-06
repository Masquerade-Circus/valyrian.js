/* eslint-disable sonarjs/cognitive-complexity */
const { mount, unmount } = require("../lib");
let fs = require("fs");
let path = require("path");

let fetch = require("node-fetch");
let FormData = require("form-data");
let treeAdapter = require("./utils/tree-adapter");

let terser = require("terser");
let esbuild = require("esbuild");
let { PurgeCSS } = require("purgecss");
let CleanCSS = require("clean-css");

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

async function inline(file, options = {}) {
  if (typeof file === "string") {
    let ext = file.split(".").pop();
    if (/(js|cjs|jsx|mjs|ts|tsx)/.test(ext)) {
      if (/(ts|tsx)/.test(ext) && !options.noValidate) {
        let declarationDir = options.declarationDir;
        let emitDeclaration = !!declarationDir;

        let tscProgOptions = {
          basePath: process.cwd(), // always required, used for relative paths
          configFilePath: "tsconfig.json", // config to inherit from (optional)
          files: [file],
          include: ["**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx", "**/*.mjs"],
          exclude: ["test*/**/*", "**/*.test.ts", "**/*.spec.ts", "dist/**"],
          pretty: true,
          copyOtherToOutDir: false,
          clean: emitDeclaration ? [declarationDir] : [],
          ...(options.tsc || {}),
          compilerOptions: {
            rootDir: "./",
            outDir: "dist",
            noEmitOnError: true,
            noEmit: !emitDeclaration,
            declaration: emitDeclaration,
            declarationDir,
            emitDeclarationOnly: emitDeclaration,
            allowJs: true,
            esModuleInterop: true,
            inlineSourceMap: true,
            resolveJsonModule: true,
            removeComments: true,
            ...(options.tsc || {}).compilerOptions
          },
          jsxFactory: "v",
          jsxFragment: "v.fragment"
        };

        // eslint-disable-next-line no-console
        console.log("tsc", tscProgOptions);

        tsc.build(tscProgOptions);
      }

      let esbuildOptions = {
        entryPoints: [file],
        bundle: true,
        sourcemap: "external",
        write: false,
        minify: options.compact,
        outdir: "out",
        target: "esnext",
        jsxFactory: "v",
        jsxFragment: "v.fragment",
        loader: { ".js": "jsx", ".ts": "tsx", ".mjs": "jsx" },
        ...(options.esbuild || {})
      };

      let result = esbuild.buildSync(esbuildOptions);

      if (options.compact) {
        let result2 = await terser.minify(result.outputFiles[1].text, {
          sourceMap: {
            content: result.outputFiles[0].text.toString()
          },
          compress: {
            booleans_as_integers: false
          },
          output: {
            wrap_func_args: false
          },
          ecma: 2020,
          ...(options.terser || {})
        });

        let mapBase64 = Buffer.from(result2.map.toString()).toString("base64");
        let suffix = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
        return { raw: result2.code, map: suffix, file };
      } else {
        let mapBase64 = Buffer.from(result.outputFiles[0].text.toString()).toString("base64");
        let suffix = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
        return { raw: result.outputFiles[1].text, map: suffix, file };
      }
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
        },
        ...(options.cleanCss || {})
      }).minify([file]);

      return { raw: result.styles, map: null, file };
    } else {
      return { raw: fs.readFileSync(file, "utf8"), map: null, file };
    }
  } else if (typeof file === "object" && "raw" in file) {
    return { map: null, ...file };
  }
}

inline.uncss = async function (renderedHtml, css, options = {}) {
  let html = await Promise.all(renderedHtml);

  let contents = html.map((item) => {
    return {
      raw: item,
      extension: "html"
    };
  });

  let purgecss = new PurgeCSS();

  let output = await purgecss.purge({
    fontFace: true,
    keyframes: true,
    variables: true,
    defaultExtractor: (content) => content.match(/[A-Za-z0-9-_/:@]*[A-Za-z0-9-_/:@/]+/g) || [],
    ...options,
    content: contents,
    css: [{ raw: css }]
  });

  return new CleanCSS({
    sourceMap: false,
    level: {
      1: {
        roundingPrecision: "all=3"
      },
      2: {
        restructureRules: true // controls rule restructuring; defaults to false
      }
    },
    ...(options.cleanCss || {})
  }).minify(output[0].css).styles;
};

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

let plugin = {
  inline,
  sw,
  icons,
  htmlTDom: treeAdapter.htmlToDom,
  domToHtml: treeAdapter.domToHtml,
  domToHyperscript: treeAdapter.domToHyperscript,
  htmlToHyperscript: treeAdapter.htmlToHyperscript,
  render: (...args) => {
    let Component = () => args;
    let result = mount("div", Component);
    unmount(Component);
    return result;
  }
};

plugin.default = plugin;
module.exports = plugin;
