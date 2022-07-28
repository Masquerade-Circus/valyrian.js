/* eslint-disable no-console */
const esbuild = require("esbuild");
const terser = require("terser");
const fs = require("fs");
const zlib = require("zlib");

function convertToUMD(text, globalName) {
  // HACK: convert to UMD - only supports cjs and global var
  const varName = "__EXPORTS__";
  let code = text;

  code = code.replace(/export\s*\{([^{}]+)\}/, (_, inner) => {
    const defaultExport = inner.match(/^(\w+) as default$/);
    return defaultExport != null ? `var ${varName}=${defaultExport[1]}` : `var ${varName}={${inner.replace(/(\w+) as (\w+)/g, "$2:$1")}}`;
  });

  code = code.replace(/export\s*default\s*(\w+)/, (_, name) => {
    return `var ${varName}=${name}`;
  });

  code = code.replace(/module.exports\s*=\s*(\w+)/, (_, name) => {
    return `var ${varName}=${name}`;
  });

  code = `(()=>{${code};typeof module!=='undefined'?module.exports=${varName}:self.${globalName}=${varName}})()`;
  return code;
}

async function build({
  globalName,
  entryPoint,
  outfileName,
  clean = false,
  emitDeclarations = false,
  libCheck = false,
  minify = true,
  minifyAs = "cjs",
  external = []
}) {
  try {
    let header = `\n/*** ${entryPoint} ***/`;
    console.log(header);

    let outdir = outfileName.split("/").slice(0, -1).join("/");
    let outfile = outfileName.split("/").pop();

    // If clean is true, delete the outdir
    if (clean && fs.existsSync(outdir)) {
      fs.rmSync(outdir, { recursive: true });
    }

    // Ensure outdir exists recursively, if not create it
    if (!fs.existsSync(outdir)) {
      fs.mkdirSync(outdir, { recursive: true });
    }

    if ((libCheck || emitDeclarations) && entryPoint.endsWith(".ts")) {
      const tsc = require("tsc-prog");
      let tscProgOptions2 = {
        basePath: __dirname, // always required, used for relative paths
        configFilePath: "tsconfig.json", // config to inherit from (optional)
        files: [entryPoint],
        pretty: true,
        copyOtherToOutDir: false,
        clean: [],
        skipLibCheck: true,
        compilerOptions: {
          declarationMap: emitDeclarations,
          noEmit: !emitDeclarations,
          declaration: emitDeclarations,
          outDir: outdir,
          emitDeclarationOnly: emitDeclarations
        }
      };

      tsc.build(tscProgOptions2);
    }

    let cjs = esbuild.buildSync({
      entryPoints: [entryPoint],
      bundle: true,
      sourcemap: "external",
      write: false,
      minify: false,
      outdir: outdir,
      target: "esnext",
      loader: { ".js": "jsx", ".ts": "tsx", ".mjs": "jsx" },
      format: "cjs",
      metafile: true,
      external
    });

    let esm = esbuild.buildSync({
      entryPoints: [entryPoint],
      bundle: true,
      sourcemap: "external",
      write: false,
      minify: false,
      outdir: outdir,
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
        `import { fileURLToPath } from 'url';const __filename = fileURLToPath(import.meta.url);const __dirname = path.dirname(__filename);` + esmContent;
      if (esmContent.indexOf("import path from") === -1) {
        esmContent = `import path from 'path';` + esmContent;
      }
    }

    fs.writeFileSync(`${outfileName}.mjs`, esmContent);
    fs.writeFileSync(`${outfileName}.js`, cjs.outputFiles[1].text);

    let result2;
    if (minify) {
      let codeToMinify = minifyAs === "esm" ? esm : minifyAs === "cjs" ? cjs : null;
      if (codeToMinify) {
        let code = convertToUMD(codeToMinify.outputFiles[1].text, globalName);
        result2 = await terser.minify(code, {
          sourceMap: {
            content: codeToMinify.outputFiles[0].text.toString()
          },
          compress: {
            booleans_as_integers: false
          },
          output: {
            wrap_func_args: false
          },
          ecma: 2022
        });

        let mapBase64 = Buffer.from(result2.map.toString()).toString("base64");
        let map = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
        fs.writeFileSync(`${outfileName}.min.js`, result2.code + `//# sourceMappingURL=${outfile}.min.js.map`);
        fs.writeFileSync(`${outfileName}.min.js.map`, map);
      }
    }

    function formatBytesToKiloBytes(bytes) {
      return (bytes / 1024).toFixed(2) + "kb";
    }

    let text = await esbuild.analyzeMetafile(esm.metafile, { verbose: true });
    console.log(text);
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
    libCheck: true,
    emitDeclarations: true,
    minifyAs: "esm"
  });

  await build({
    globalName: "ValyrianHooks",
    entryPoint: "./plugins/hooks.ts",
    outfileName: "./dist/plugins/hooks",
    clean: false,
    minify: false
  });

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
