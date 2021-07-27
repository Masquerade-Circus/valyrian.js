require("./register");
let { inline } = require("./plugins/node");
let { writeFileSync } = require("fs");
const gzipSize = require("gzip-size");
let { files } = require("./package.json");

async function run() {
  inline.extensions("ts");
  await inline.ts("./lib/index.ts", {
    compact: true,
    declarationDir: "dist/@types",
    tsc: {
      include: files
    }
  });
  let contents = inline.ts()[0].raw;
  writeFileSync("./dist/valyrian.min.js", contents);
  writeFileSync("./dist/valyrian.min.js.map", inline.ts()[0].map);

  console.log("Size:", contents.length);
  console.log("Gzip:", gzipSize.sync(contents));
}

run();
