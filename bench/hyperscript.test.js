let { compare, benchmark, before } = require("@masquerade-circus/bench-test");

import "../lib/index";

import expect from "expect";
import fs from "fs";
import nodePlugin from "../plugins/node";
import vOld from "./index-old";

let VNext = v;

vOld.usePlugin(nodePlugin);

compare("hyperscript", () => {
  let date = new Date();
  before(async () => {
    vOld.inline.extensions("ts");
    await vOld.inline.ts("./lib/index.ts", { outputOptions: { compact: true } });
    await vOld.inline.js("./bench/index-old.js", { outputOptions: { compact: true } });
    console.log(vOld.inline.ts()[0].raw.length);
    console.log(vOld.inline.js()[0].raw.length);

    let compiled = fs.readFileSync("./dist/valyrian.min.js", "utf8");
    console.log(compiled.length);

    expect(vOld("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]])).toEqual({
      name: "div",
      props: {},
      children: [[null, "Hello", undefined, 1, date, { hello: "world" }, ["Hello"]]]
    });
    expect(VNext("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]])).toEqual({
      name: "div",
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
