const { before, benchmark, compare } = require("buffalo-test");

const { v: VNext } = require("../lib/index.ts");
const expect = require("expect");
const fs = require("fs");
const nodePlugin = require("../plugins/node");
const vOld = require("./index-old");

compare("hyperscript", () => {
  let date = new Date();
  before(async () => {
    nodePlugin.inline.extensions("ts");
    // await nodePlugin.inline.ts("./lib/index.ts", { compact: true });
    await nodePlugin.inline.js("./bench/index-old.js", { compact: true });
    // console.log(nodePlugin.inline.ts()[0].raw.length);
    console.log(nodePlugin.inline.js()[0].raw.length);

    let compiled = fs.readFileSync("./dist/valyrian.min.js", "utf8");
    console.log(compiled.length);

    expect(vOld("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]])).toEqual({
      name: "div",
      props: {},
      children: [[null, "Hello", undefined, 1, date, { hello: "world" }, ["Hello"]]]
    });
    expect(VNext("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]])).toEqual({
      tag: "div",
      props: {},
      children: [[null, "Hello", undefined, 1, date, { hello: "world" }, ["Hello"]]]
    });
  });

  benchmark("Valyrian 5.0.8", () => {
    vOld("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);
  });
  benchmark("Valyrian next", () => {
    VNext("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);
  });
});
