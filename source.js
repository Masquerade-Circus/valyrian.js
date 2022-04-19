const esbuild = require("esbuild");
const terser = require("terser");
const tsc = require("tsc-prog");
const fs = require("fs");
const zlib = require("zlib");

function convertToUMD(text, globalName) {
  // HACK: convert to UMD - only supports cjs and global var
  const varName = "__EXPORTS__";
  let code = text;
  code = code.replace(/export\s*\{([^{}]+)\}/, (_, inner) => {
    const defaultExport = inner.match(/(\w+) as default/);
    return defaultExport != null ? `var ${varName}=${defaultExport[1]}` : `var ${varName}={${inner.replace(/(\w+) as (\w+)/g, "$2:$1")}}`;
  });
  code = `(()=>{${code};typeof module!=='undefined'?module.exports=${varName}:self.${globalName}=${varName}})()`;
  return code;
}

function getSourceMap(contents) {
  let mapBase64 = Buffer.from(contents.toString()).toString("base64");
  return `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
}

async function build({ globalName, entryPoint, outfileName, clean = false, minify = true, external = [], bundle = true }) {
  try {
    let header = `/************ ${entryPoint} ************/`;
    console.log("");
    console.log(header);

    let tscProgOptions2 = {
      basePath: process.cwd(), // always required, used for relative paths
      configFilePath: "tsconfig.json", // config to inherit from (optional)
      files: [entryPoint],
      pretty: true,
      copyOtherToOutDir: false,
      clean: clean ? ["dist"] : [],
      compilerOptions: {
        rootDir: "./",
        declaration: true,
        declarationDir: "./dist/@types",
        emitDeclarationOnly: true
      }
    };

    tsc.build(tscProgOptions2);
    let cjs = esbuild.buildSync({
      entryPoints: [entryPoint],
      bundle,
      sourcemap: "external",
      write: false,
      minify: false,
      outdir: "out",
      target: "esnext",
      loader: { ".js": "jsx", ".ts": "tsx", ".mjs": "jsx" },
      format: "cjs",
      metafile: true,
      external
    });

    let esm = esbuild.buildSync({
      entryPoints: [entryPoint],
      bundle,
      sourcemap: "external",
      write: false,
      minify: false,
      outdir: "out",
      target: "esnext",
      loader: { ".js": "jsx", ".ts": "tsx", ".mjs": "jsx" },
      format: "esm",
      metafile: true,
      external
    });

    let esmContent = esm.outputFiles[1].text;

    // HACK: simulate __dirname and __filename for esm
    if (esmContent.indexOf("__dirname") !== -1 || esmContent.indexOf("__filename") !== -1) {
      esmContent =
        `import { fileURLToPath } from 'url'; const __filename = fileURLToPath(import.meta.url); const __dirname = path.dirname(__filename); ` + esmContent;
      if (esmContent.indexOf("import path from") === -1) {
        esmContent = `import path from 'path'; ` + esmContent;
      }
    }

    // ensure outdir exists or create it
    let outdir = outfileName.split("/").slice(0, -1).join("/");
    if (!fs.existsSync(outdir)) {
      fs.mkdirSync(outdir, { recursive: true });
    }

    fs.writeFileSync(`${outfileName}.mjs`, esmContent);
    // fs.writeFileSync(`${outfileName}.mjs.map`, getSourceMap(esm.outputFiles[0].text));
    fs.writeFileSync(`${outfileName}.cjs`, cjs.outputFiles[1].text);
    // fs.writeFileSync(`${outfileName}.js.map`, getSourceMap(cjs.outputFiles[0].text));

    let text = await esbuild.analyzeMetafile(esm.metafile, { verbose: true });
    console.log(text);

    let result2;
    if (minify) {
      let code = convertToUMD(esm.outputFiles[1].text, globalName);
      result2 = await terser.minify(code, {
        sourceMap: {
          content: esm.outputFiles[0].text.toString()
        },
        compress: {
          booleans_as_integers: false
        },
        output: {
          wrap_func_args: false
        },
        ecma: 2020
      });

      fs.writeFileSync(`${outfileName}.min.js`, result2.code);
      fs.writeFileSync(`${outfileName}.min.js.map`, getSourceMap(result2.map));
    }

    function formatBytesToKiloBytes(bytes) {
      return (bytes / 1024).toFixed(2) + "kb";
    }

    console.log("Esm", formatBytesToKiloBytes(esm.outputFiles[1].text.length));
    if (minify) {
      console.log("Minified:", formatBytesToKiloBytes(result2.code.length));
      // Get the size using gzip compression
      const gzip = zlib.gzipSync(result2.code);
      console.log("Gzip:", formatBytesToKiloBytes(gzip.length));
      // Get the size using brotli algorithm
      const brotli = zlib.brotliCompressSync(result2.code);
      console.log("Brotli:", formatBytesToKiloBytes(brotli.length));
    }
    console.log(`/${Array(header.length).fill("*").join("")}/`);
  } catch (e) {
    console.error(e);
  }
}

(async () => {
  await build({
    globalName: "Valyrian",
    entryPoint: "./lib/index.ts",
    outfileName: "./dist/index",
    clean: true,
    minify: true,
    bundle: true
  });

  // await build({
  //   globalName: "ValyrianHooks",
  //   entryPoint: "./plugins/hooks.ts",
  //   outfileName: "./dist/hooks",
  //   clean: false,
  //   minify: false
  // });

  // await build({
  //   globalName: "ValyrianRequest",
  //   entryPoint: "./plugins/request.js",
  //   outfileName: "./dist/request",
  //   clean: false,
  //   minify: false
  // });

  // await build({
  //   globalName: "ValyrianRouter",
  //   entryPoint: "./plugins/router.js",
  //   outfileName: "./dist/router",
  //   clean: false,
  //   minify: false
  // });

  // await build({
  //   globalName: "ValyrianSignals",
  //   entryPoint: "./plugins/signals.js",
  //   outfileName: "./dist/signals",
  //   clean: false,
  //   minify: false
  // });

  // await build({
  //   globalName: "ValyrianStore",
  //   entryPoint: "./plugins/store.js",
  //   outfileName: "./dist/store",
  //   clean: false,
  //   minify: false
  // });

  // await build({
  //   globalName: "ValyrianSw",
  //   entryPoint: "./plugins/sw.js",
  //   outfileName: "./dist/sw",
  //   clean: false,
  //   minify: false
  // });

  // await build({
  //   globalName: 'ValyrianSignals',
  //   entryPoint: './plugins/signals.js',
  //   outfileName: './dist/signals',
  //   clean: false,
  //   minify: false,
  //   external: ['child_process', 'fs', 'os', 'path']
  // });
})();
