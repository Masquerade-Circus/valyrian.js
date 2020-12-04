const { addHook } = require("pirates");
const { transform } = require("sucrase");

// Assume .jsx components are using x-engine
const jsxOptions = {
  production: true,
  transforms: ["imports", "typescript", "jsx"],
  jsxPragma: "v",
  jsxFragmentPragma: "v"
};

// Return a function to revert the hook
return addHook(
  (code, filePath) => {
    let ext = filePath.split(".").pop();

    const fileOptions = {
      sourceMapOptions: { compiledFilename: filePath },
      filePath
    };
    const { code: transformed, sourceMap } = transform(code, {
      ...fileOptions,
      ...jsxOptions
    });
    const mapBase64 = Buffer.from(JSON.stringify(sourceMap)).toString("base64");
    const suffix = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
    return `${transformed}\n${suffix}`;
  },
  { exts: [".js", ".jsx", ".ts", ".tsx", ".mjs"] }
);
