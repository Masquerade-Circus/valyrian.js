require("./register");
let { inline } = require("./plugins/node");
let { writeFileSync } = require("fs");

async function run() {
  inline.extensions("ts");
  await inline.ts("./lib/index.ts", { outputOptions: { compact: true } });

  writeFileSync("./dist/valyrian.lite.js", inline.ts()[0].raw);
}

run();
