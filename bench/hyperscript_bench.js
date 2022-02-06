const { before, benchmark, compare } = require("buffalo-test");

const { v: VNext } = require("../lib/index.ts");
const expect = require("expect");
const nodePlugin = require("../plugins/node");
const vOld = require("./index-old");

compare("hyperscript", () => {
  let date = new Date();
  before(async () => {
    let { raw: newTs } = await nodePlugin.inline("./lib/index.ts", { compact: true });
    let { raw: oldjs } = await nodePlugin.inline("./bench/index-old.js", { compact: true });
    console.log(oldjs.length);
    console.log(newTs.length);

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
