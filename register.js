const { addHook } = require("pirates");
const { transformSync } = require("esbuild");
const fs = require("fs");

addHook(
  (code, filePath) => {
    let fileName = filePath.split("/").pop();
    let extension = fileName.split(".").pop();

    let loader = "default";
    if (["js", "jsx", "ts", "tsx", "css", "json", "txt"].includes(extension)) {
      if (["js", "jsx", "mjs"].includes(extension)) {
        loader = "tsx";
      } else if (["ts", "tsx"].includes(extension)) {
        loader = "tsx";
      } else if (extension === "txt") {
        loader = "text";
      } else {
        loader = extension;
      }
    } else if (["jpeg", "jpg", "png", "gif", "webp", "svg"].includes(extension)) {
      loader = "dataurl";
    }

    let options = {
      sourcefile: fileName,
      sourcemap: "inline",
      minify: false,
      target: "esnext",
      loader: loader,
      jsxFactory: "v",
      jsxFragment: "v.fragment",

      logLevel: "warning",
      format: "cjs"
    };

    let { code: transformed } = transformSync(code, options);
    if (/"use strict"\;/gi.test(code) === false) {
      transformed = '"use strict";' + transformed;
    }

    return transformed;
  },
  {
    exts: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".css", ".json", ".text", ".jpeg", ".jpg", ".png", ".gif", ".webp", ".svg", ".html"],
    ignoreNodeModules: false,
    matcher(fileName) {
      return !/node_modules/.test(fileName) || /\.tsx?$/.test(fileName);
    }
  }
);
