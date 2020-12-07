const { addHook } = require("pirates");
const { transform } = require("sucrase");

const jsxOptions = {
  production: true,
  transforms: ["imports", "typescript", "jsx"],
  jsxPragma: "v",
  jsxFragmentPragma: "v"
};

addHook(
  (code, filePath) => {
    let { code: transformed, sourceMap } = transform(code, {
      sourceMapOptions: { compiledFilename: filePath },
      filePath,
      ...jsxOptions
    });
    let mapBase64 = Buffer.from(JSON.stringify(sourceMap)).toString("base64");
    let suffix = `//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
    return `${transformed}\n${suffix}`;
  },
  { exts: [".js", ".jsx", ".ts", ".tsx", ".mjs"] }
);
