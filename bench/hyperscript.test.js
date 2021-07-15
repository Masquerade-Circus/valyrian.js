let { compare, benchmark, before } = require("@masquerade-circus/bench-test");

import "../lib/index.ts";

import expect from "expect";
import fs from "fs";
import nodePlugin from "../plugins/node";
import vOld from "./index-old";

let VNext = v;

VNext.usePlugin(nodePlugin);

compare("hyperscript", () => {
  let date = new Date();
  before(async () => {
    VNext.inline.extensions("ts");
    await VNext.inline.ts("./lib/index.ts", { compact: true });
    await VNext.inline.js("./bench/index-old.js", { compact: true });
    console.log(VNext.inline.ts()[0].raw.length);
    console.log(VNext.inline.js()[0].raw.length);

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
