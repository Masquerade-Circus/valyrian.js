/* eslint-disable no-console */
const esbuild = require("esbuild");
const terser = require("terser");
const fs = require("fs");
const zlib = require("zlib");
const { hrtime } = require("process");

function convertToUMD(text, globalName) {
  // HACK: convert to UMD - only supports cjs and global var
  const varName = "__EXPORTS__";
  let code = text;

  code = code.replace(/export\s*\{([^{}]+)\}/, (_, inner) => {
    const defaultExport = inner.match(/^(\w+) as default$/);
    return defaultExport != null
      ? `var ${varName}=${defaultExport[1]}`
      : `var ${varName}={${inner.replace(/(\w+) as (\w+)/g, "$2:$1")}}`;
  });

  code = code.replace(/export\s*default\s*(\w+)/, (_, name) => {
    return `var ${varName}=${name}`;
  });

  code = code.replace(/module.exports\s*=\s*(\w+)/, (_, name) => {
    return `var ${varName}=${name}`;
  });

  if (code.includes("__EXPORTS__")) {
    code = `(()=>{${code};typeof module!=='undefined'?module.exports=${varName}:self.${globalName}=${varName}})()`;
  }
  return code;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
async function build({
  globalName,
  entryPoint,
  outfileName,
  clean = false,
  emitDeclarations = false,
  libCheck = false,
  minify = "cjs",
  embedSourceMap = false,
  external = []
}) {
  try {
    external.push("node:async_hooks");

    const header = `\n/*** ${entryPoint} ***/`;
    console.log(header);

    const outdir = outfileName.split("/").slice(0, -1).join("/");
    const outfile = outfileName.split("/").pop();

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
      const tscProgOptions2 = {
        basePath: __dirname, // always required, used for relative paths
        configFilePath: "tsconfig.prod.json", // config to inherit from (optional)
        files: [entryPoint],
        pretty: true,
        copyOtherToOutDir: false,
        clean: [],
        skipLibCheck: true,
        compilerOptions: {
          declarationMap: emitDeclarations,
          noEmit: !emitDeclarations,
          declaration: emitDeclarations,
          composite: emitDeclarations,
          outDir: outdir,
          emitDeclarationOnly: emitDeclarations
        }
      };

      tsc.build(tscProgOptions2);
    }

    const cjs = esbuild.buildSync({
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

    const esm = esbuild.buildSync({
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
        `import { fileURLToPath } from 'url';const __filename = fileURLToPath(import.meta.url);const __dirname = path.dirname(__filename);` +
        esmContent;
      if (esmContent.indexOf("import path from") === -1) {
        esmContent = `import path from 'path';` + esmContent;
      }
    }

    fs.writeFileSync(`${outfileName}.mjs`, esmContent);
    fs.writeFileSync(`${outfileName}.mjs.map`, esm.outputFiles[0].text);
    fs.writeFileSync(`${outfileName}.js`, cjs.outputFiles[1].text);
    fs.writeFileSync(`${outfileName}.js.map`, cjs.outputFiles[0].text);

    let result2;
    if (minify) {
      const codeToMinify = minify === "esm" ? esm : cjs;
      if (codeToMinify) {
        const code =
          codeToMinify === "esm"
            ? codeToMinify.outputFiles[1].text
            : convertToUMD(codeToMinify.outputFiles[1].text, globalName);
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

        const mapBase64 = Buffer.from(result2.map.toString()).toString("base64");
        const map = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
        if (embedSourceMap) {
          fs.writeFileSync(`${outfileName}.min.js`, result2.code + map);
        } else {
          fs.writeFileSync(`${outfileName}.min.js`, result2.code + `//# sourceMappingURL=${outfile}.min.js.map`);
          fs.writeFileSync(`${outfileName}.min.js.map`, map);
        }
      }
    }

    function formatBytesToKiloBytes(bytes) {
      return (bytes / 1024).toFixed(2) + "kb";
    }

    const text = await esbuild.analyzeMetafile(esm.metafile, { verbose: true });
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

// eslint-disable-next-line no-unused-vars
async function copy({ entryPoint, outfileName }) {
  const outdir = outfileName.split("/").slice(0, -1).join("/");
  const outfile = outfileName.split("/").pop();
  console.log(`\Coping ${entryPoint} to ${outfileName}`);
  console.log(`Using ${outdir} as output directory`);
  console.log(`Using ${outfile} as output file`);

  if (!fs.existsSync(outdir)) {
    fs.mkdirSync(outdir, { recursive: true });
  }
  // Copy the file to the outdir
  fs.copyFileSync(entryPoint, `${outdir}/${outfile}`);
  console.log(`Moved ${entryPoint} to ${outfileName}`);
}

(async () => {
  const isDev = process.env.NODE_ENV === "development";
  const libCheck = !isDev;
  const emitDeclarations = !isDev;
  const clean = !isDev;
  const minify = isDev ? false : "esm";

  const args = process.argv.slice(2);
  const onlyMain = args.includes("--only-main");

  const buildStart = hrtime();

  const otherModules = [
    "hooks",
    "request",
    "sw",
    "flux-store",
    "pulses",
    "router",
    "utils",
    "suspense",
    "native-store",
    "translate"
  ];

  await build({
    globalName: "Valyrian",
    entryPoint: "./lib/index.ts",
    outfileName: "./dist/index",
    clean,
    minify,
    libCheck,
    emitDeclarations,
    external: [...otherModules.map((m) => `valyrian.js/${m}`)]
  });

  if (!onlyMain) {
    for (const module of otherModules) {
      const firstCaseName = module
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("");
      const globalName = `Valyrian${firstCaseName}`;
      const entryPoint = `./lib/${module}/index.ts`;
      const outfileName = `./dist/${module}/index`;
      await build({
        globalName,
        entryPoint,
        outfileName,
        clean: false,
        minify: true,
        libCheck,
        external: ["valyrian.js", ...otherModules.map((m) => `valyrian.js/${m}`)]
      });
    }

    await build({
      globalName: "ValyrianNode",
      entryPoint: "./lib/node/index.ts",
      outfileName: "./dist/node/index",
      clean: false,
      minify: false,
      libCheck,
      external: [
        "fs",
        "path",
        "esbuild",
        "terser",
        "favicons",
        "purgecss",
        "tsc-prog",
        "sharp",
        "clean-css",
        "form-data",
        "valyrian.js",
        ...otherModules.map((m) => `valyrian.js/${m}`)
      ]
    });

    copy({
      entryPoint: "./lib/node/utils/node.sw.js",
      outfileName: "./dist/node/utils/node.sw.js"
    });

    copy({
      entryPoint: "./lib/node/utils/node.sw.js",
      outfileName: "./dist/node/node.sw.js"
    });
  }

  const buildEnd = hrtime(buildStart);

  // Log the build time in seconds with two decimal places
  console.log("\n-------------------------------------");
  console.log(`Build time: ${(buildEnd[0] + buildEnd[1] / 1e9).toFixed(2)} seconds`);
  console.log("-------------------------------------");
})();
