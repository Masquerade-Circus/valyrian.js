import esbuild, { type Plugin } from "esbuild";
import fs from "fs";
import { dirname, extname, resolve } from "path";

const runtime = "valyrian.js/jsx-runtime";

export function normalizeJsxChildren(entry: string): Plugin {
  return {
    name: "valyrian-normalize-children",
    setup(build) {
      const entryPath = resolve(entry);
      build.onLoad({ filter: /\.[jt]sx$/ }, async ({ path }) => {
        if (path !== entryPath) {
          return;
        }

        const source = await fs.promises.readFile(path, "utf8");
        // Leave handwritten factories, direct eval, mixed CommonJS and existing maps to esbuild.
        if (/\b(?:jsx|jsxs|eval|require|module|exports|sourceMappingURL)\b|\\u/.test(source)) {
          return;
        }

        const resolveOptions = { kind: "import-statement", importer: path, resolveDir: dirname(path) } as const;
        const jsx = await build.resolve(runtime, resolveOptions);
        const core = await build.resolve("valyrian.js", resolveOptions);
        // Accept the standard package pair (including this repository's source exports).
        const ext = extname(jsx.path);
        if (
          jsx.external ||
          core.external ||
          jsx.namespace !== "file" ||
          core.namespace !== "file" ||
          ![".ts", ".mjs", ".js"].includes(ext) ||
          extname(core.path) !== ext ||
          jsx.path !== resolve(dirname(core.path), `jsx-runtime/index${ext}`)
        ) {
          return;
        }
        const jsxCore = await build.resolve("valyrian.js", {
          ...resolveOptions,
          importer: jsx.path,
          resolveDir: dirname(jsx.path)
        });
        if (jsxCore.external || jsxCore.path !== core.path) {
          return;
        }

        // Let esbuild lower the real file with its own TS config, JSX pragmas and source map.
        const lowered = await esbuild.build({
          entryPoints: [path],
          bundle: false,
          write: false,
          outdir: build.initialOptions.outdir,
          target: "esnext",
          platform: build.initialOptions.platform,
          jsx: "automatic",
          jsxImportSource: "valyrian.js",
          sourcemap: "external",
          tsconfig: build.initialOptions.tsconfig,
          tsconfigRaw: build.initialOptions.tsconfigRaw,
          logLevel: "silent"
        }).catch((error: esbuild.BuildFailure) => {
          // Let the original build report its usual diagnostics if the prepass cannot load the file.
          if (Array.isArray(error.errors)) {
            return null;
          }
          throw error;
        });
        if (!lowered || lowered.warnings.length) {
          return;
        }
        const [mapFile, jsFile] = lowered.outputFiles;
        const map = JSON.parse(mapFile.text) as { sources: string[]; sourcesContent?: string[]; mappings: string };
        if (map.sourcesContent?.length !== 1 || map.sourcesContent[0] !== source) {
          return;
        }
        const code = await rewriteChildren(jsFile.text);
        if (code === null) {
          return;
        }

        map.sources = map.sources.map((name) => resolve(dirname(mapFile.path), name));
        const encoded = Buffer.from(JSON.stringify(map)).toString("base64");
        return {
          contents: `${code}\n//# sourceMappingURL=data:application/json;base64,${encoded}`,
          loader: "js",
          resolveDir: dirname(path)
        };
      });
    }
  };
}

async function rewriteChildren(code: string) {
  const { default: ts } = await import("typescript");
  const file = ts.createSourceFile("lowered.js", code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.JS);
  const runtimeImport = file.statements.filter(ts.isImportDeclaration).find(
    (node) => ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === runtime
  );
  if (!runtimeImport) {
    return null;
  }
  const bindings = runtimeImport.importClause?.namedBindings;
  if (!bindings || !ts.isNamedImports(bindings)) {
    return null;
  }
  const factories = new Set<string>();
  for (const binding of bindings.elements) {
    const imported = (binding.propertyName ?? binding.name).text;
    if (binding.name.text === imported && (imported === "jsx" || imported === "jsxs")) {
      factories.add(imported);
    }
  }
  // A short free identifier fits in esbuild's pure annotation without moving source map columns.
  const identifiers = new Set(code.match(/[$\w]+/g));
  const ctor = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].find((name) => !identifiers.has(name));
  if (!ctor) {
    return null;
  }

  const edits: { start: number; end: number; text: string }[] = [];
  function visit(node: import("typescript").Node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const factory = node.expression.text;
      const [, props] = node.arguments;
      if (
        factories.has(factory) &&
        !node.questionDotToken &&
        (node.arguments.length === 2 || node.arguments.length === 3) &&
        !node.arguments.some(ts.isSpreadElement) &&
        ts.isObjectLiteralExpression(props)
      ) {
        const names = new Set<string>();
        const plainProps = props.properties.every((prop) => {
          if (!ts.isPropertyAssignment(prop) || !(ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name))) {
            return false;
          }
          const name = prop.name.text;
          if (name === "__proto__" || names.has(name)) {
            return false;
          }
          names.add(name);
          return true;
        });
        const child = props.properties.at(-1);
        if (
          plainProps &&
          child &&
          ts.isPropertyAssignment(child) &&
          (ts.isIdentifier(child.name) || ts.isStringLiteral(child.name)) &&
          child.name.text === "children"
        ) {
          const value = child.initializer;
          const multiple = factory === "jsxs" && ts.isArrayLiteralExpression(value);
          const single = factory === "jsx" && (
            ts.isStringLiteral(value) ||
            (ts.isCallExpression(value) && ts.isIdentifier(value.expression) && factories.has(value.expression.text))
          );
          const calleeStart = node.expression.getStart(file);
          const annotation = "/* @__PURE__ */ ";
          const start = calleeStart - annotation.length;
          const closeProps = props.properties.at(-2)?.end ?? props.getStart(file) + 1;
          const colon = child.name.end + 1;
          if (
            (multiple || single) &&
            start >= 0 &&
            code.slice(start, calleeStart) === annotation &&
            /^[,\w"'\t ]+:$/.test(code.slice(closeProps, colon)) &&
            /^[\t ]*}$/.test(code.slice(value.end, props.end))
          ) {
            edits.push(
              { start, end: node.expression.end, text: `/*#__PURE__*/new ${ctor}` },
              { start: closeProps, end: colon, text: multiple ? "}," : "},[" },
              { start: value.end, end: props.end, text: multiple ? "" : "]" }
            );
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(file);
  if (!edits.length) {
    return null;
  }
  // The unbundled prepass prints the automatic import first, but esbuild's bundler
  // visits it after the authored imports and re-exports. Restore that dependency order.
  const importAt = runtimeImport.getStart(file);
  const automaticImport = code.slice(importAt, runtimeImport.end);
  edits.push({ start: importAt, end: runtimeImport.end, text: automaticImport.replace(/[^\r\n]/g, " ") });
  const result: string[] = [];
  let offset = 0;
  for (const edit of edits.sort((a, b) => a.start - b.start)) {
    result.push(code.slice(offset, edit.start), edit.text.padEnd(edit.end - edit.start));
    offset = edit.end;
  }
  result.push(code.slice(offset));
  // Leave the original lines and columns in place for the prepass source map.
  result.push(`\n${automaticImport}\nimport { Vnode as ${ctor} } from "valyrian.js";\n`);
  return result.join("");
}
