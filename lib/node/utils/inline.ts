import * as tsc from "tsc-prog";

import CleanCSS from "clean-css";
import { PurgeCSS } from "purgecss";
import esbuild from "esbuild";
/* eslint-disable sonarjs/cognitive-complexity */
import fs from "fs";

// eslint-disable-next-line complexity
export async function inline(
  file: string | { raw: string; map?: string | null; file: string },
  options: Record<string, any> = {}
) {
  if (typeof file === "string") {
    let ext = file.split(".").pop();
    if (ext && /(js|cjs|jsx|mjs|ts|tsx)/.test(ext)) {
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
        bundle: "bundle" in options ? options.bundle : true,
        sourcemap: "external",
        write: false,
        minify: options.compact,
        outdir: "out",
        target: "esnext",
        jsxFactory: "v",
        jsxFragment: "v.fragment",
        loader: {
          ".js": "jsx",
          ".cjs": "jsx",
          ".mjs": "jsx",
          ".ts": "tsx"
        },
        ...(options.esbuild || {})
      };

      let result = await esbuild.build(esbuildOptions);
      if (result.outputFiles?.length !== 2) {
        throw new Error(result.errors.join("\n"));
      }

      if (options.compact) {
        const terser = await import("terser");
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
          ecma: 2022,
          ...(options.terser || {})
        });

        if (!result2.code || !result2.map) {
          throw new Error("Unknown error");
        }

        let mapBase64 = Buffer.from(result2.map.toString()).toString("base64");
        let suffix = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
        return { raw: result2.code, map: suffix, file };
      } else {
        let mapBase64 = Buffer.from(result.outputFiles[0].text.toString()).toString("base64");
        let suffix = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
        return { raw: result.outputFiles[1].text, map: suffix, file };
      }
    } else if (ext && /(css|scss|styl)/.test(ext)) {
      let result = await new CleanCSS({
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

inline.uncss = async function (
  renderedHtml: (string | Promise<string>)[],
  css: string,
  options: Record<string, any> = {}
) {
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

  let cleanCss = await new CleanCSS({
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
  }).minify(output[0].css);

  return cleanCss.styles;
};
