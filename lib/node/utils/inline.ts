import * as tsc from "tsc-prog";

import CleanCSS from "clean-css";
import { PurgeCSS } from "purgecss";
import esbuild from "esbuild";
import type { BuildOptions } from "esbuild";
import type { UserDefinedOptions } from "purgecss";
import type { MinifyOptions } from "terser";
/* eslint-disable sonarjs/cognitive-complexity */
import fs from "fs";
import { isString } from "../../utils";

export type InlineInput = string | { raw: string; map?: string | null; file: string };

type InlineOwnedEsbuildOptions =
  | "write"
  | "sourcemap"
  | "entryPoints"
  | "stdin"
  | "outfile"
  | "outdir"
  | "bundle"
  | "minify"
  | "loader"
  | "jsx"
  | "jsxImportSource";

export type InlineEsbuildOptions = Omit<BuildOptions, InlineOwnedEsbuildOptions>;

export interface InlineOptions {
  compact?: boolean;
  bundle?: boolean;
  noValidate?: boolean;
  declarationDir?: string;
  tsc?: Record<string, any>;
  esbuild?: InlineEsbuildOptions;
  terser?: MinifyOptions;
  cleanCss?: CleanCSS.OptionsOutput;
  [key: string]: unknown;
}

export interface InlineUncssOptions extends Omit<UserDefinedOptions, "content" | "css"> {
  cleanCss?: CleanCSS.OptionsOutput;
}

export interface InlineResult {
  raw: string;
  map: string | null;
  file: string;
}

// eslint-disable-next-line complexity
export async function inline(file: InlineInput, options: InlineOptions = {}): Promise<InlineResult> {
  if (isString(file)) {
    const ext = file.split(".").pop();
    if (ext && /(js|cjs|jsx|mjs|ts|tsx)/.test(ext)) {
      if (/(ts|tsx)/.test(ext) && !options.noValidate) {
        const declarationDir = options.declarationDir;
        const emitDeclaration = !!declarationDir;
        const compilerOptions = {
          rootDir: "./",
          outDir: "dist",
          noEmitOnError: true,
          noEmit: !emitDeclaration,
          declaration: emitDeclaration,
          composite: emitDeclaration,
          declarationDir,
          emitDeclarationOnly: emitDeclaration,
          allowJs: true,
          esModuleInterop: true,
          inlineSourceMap: true,
          resolveJsonModule: true,
          removeComments: true,
          ...(options.tsc || {}).compilerOptions
        };
        const tscProgOptions: Record<string, any> = {
          basePath: process.cwd(), // always required, used for relative paths
          configFilePath: "tsconfig.json", // config to inherit from (optional)
          files: [file],
          include: [file],
          exclude: [],
          pretty: true,
          copyOtherToOutDir: false,
          clean: emitDeclaration ? [declarationDir] : [],
          ...(options.tsc || {}),
          compilerOptions
        };

        (tsc as any).build(tscProgOptions);
      }

      const {
        bundle: _bundle,
        entryPoints: _entryPoints,
        jsx: _jsx,
        jsxImportSource: _jsxImportSource,
        loader: _loader,
        minify: _minify,
        outdir: _outdir,
        outfile: _outfile,
        sourcemap: _sourcemap,
        stdin: _stdin,
        write: _write,
        ...safeEsbuildOptions
      } = (options.esbuild || {}) as BuildOptions;

      const esbuildOptions: BuildOptions = {
        ...safeEsbuildOptions,
        entryPoints: [file],
        bundle: "bundle" in options ? options.bundle : true,
        minify: options.compact,
        outdir: "out",
        target: "esnext",
        jsx: "automatic",
        jsxImportSource: "valyrian.js",
        loader: {
          ".js": "jsx",
          ".cjs": "jsx",
          ".mjs": "jsx",
          ".ts": "tsx"
        },
        sourcemap: "external",
        write: false
      };

      const result = await esbuild.build(esbuildOptions);
      if (result.outputFiles?.length !== 2) {
        throw new Error(result.errors.join("\n"));
      }

      if (options.compact) {
        const terser = await import("terser");
        const result2 = await terser.minify(result.outputFiles[1].text, {
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
        } as MinifyOptions);

        if (!result2.code || !result2.map) {
          throw new Error("Unknown error");
        }

        const mapBase64 = Buffer.from(result2.map.toString()).toString("base64");
        const suffix = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
        return { raw: result2.code, map: suffix, file };
      } else {
        const mapBase64 = Buffer.from(result.outputFiles[0].text.toString()).toString("base64");
        const suffix = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
        return { raw: result.outputFiles[1].text, map: suffix, file };
      }
    } else if (ext && /(css|scss|styl)/.test(ext)) {
      const result = await new CleanCSS({
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
      } as CleanCSS.OptionsOutput).minify([file]);

      return { raw: result.styles, map: null, file };
    } else {
      return { raw: fs.readFileSync(file, "utf8"), map: null, file };
    }
  } else if (typeof file === "object" && "raw" in file) {
    return { map: null, ...file };
  }

  throw new Error(`Unknown file type: ${file}`);
}

inline.uncss = async function (
  renderedHtml: (string | Promise<string>)[],
  css: string,
  options: InlineUncssOptions = {}
) {
  const html = await Promise.all(renderedHtml);

  const contents = html.map((item) => {
    return {
      raw: item,
      extension: "html"
    };
  });

  const purgecss = new PurgeCSS();

  const output = await purgecss.purge({
    fontFace: true,
    keyframes: true,
    variables: true,
    defaultExtractor: (content) => content.match(/[A-Za-z0-9-_/:@]*[A-Za-z0-9-_/:@/]+/g) || [],
    ...options,
    content: contents,
    css: [{ raw: css }]
  });

  const cleanCss = await new CleanCSS({
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
  } as CleanCSS.OptionsOutput).minify(output[0].css);

  return cleanCss.styles;
};
