const { addHook } = require("pirates");
const { transformSync } = require("esbuild");

addHook(
  (code, filePath) => {
    let esbuildOptions = {
      sourcefile: filePath,
      sourcemap: "inline",
      sourcesContent: true,
      minify: false,
      target: "esnext",
      jsxFactory: "v",
      jsxFragment: "v.fragment",
      loader: "tsx",
      format: "cjs"
    };

    let result = transformSync(code, esbuildOptions);

    if (!/^"use strict";/.test(result.code)) {
      result.code = `"use strict";${result.code}`;
    }

    return result.code;
  },
  {
    exts: [".js", ".jsx", ".ts", ".tsx", ".mjs"],
    ignoreNodeModules: false,
    matcher(fileName) {
      return !/node_modules/.test(fileName) || /\.tsx?$/.test(fileName);
    }
  }
);
