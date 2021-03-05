let { compare, benchmark, before } = require("@masquerade-circus/bench-test");

import VLite from "../lib/index-lite";
import VNext from "../lib/index";
import expect from "expect";
import fs from "fs";
import nodePlugin from "../plugins/node";
import v from "../lib/index-old";

v.usePlugin(nodePlugin);

compare("hyperscript", () => {
  let date = new Date();
  before(async () => {
    v.inline.extensions("ts");
    await v.inline.ts("./lib/index.ts", { outputOptions: { compact: true } });
    await v.inline.ts("./lib/index-lite.ts", { outputOptions: { compact: true } });
    await v.inline.js("./lib/index-old.js", { outputOptions: { compact: true } });
    console.log(v.inline.ts()[0].raw.length);
    console.log(v.inline.ts()[1].raw.length);
    console.log(v.inline.js()[0].raw.length);

    // console.log(v.inline.ts()[1].raw);
    // fs.writeFileSync("./dist/valyrian.lite.js", v.inline.ts()[1].raw);

    // expect(v.inline.ts()[0].raw.length).toBeLessThan(5115);

    let compiled = fs.readFileSync("./dist/valyrian.min.js", "utf-8");
    console.log(compiled.length);

    expect(v("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]])).toEqual({
      name: "div",
      props: {},
      children: [[null, "Hello", undefined, 1, date, { hello: "world" }, ["Hello"]]]
    });
    expect(VNext("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]])).toEqual({
      name: "div",
      props: {},
      children: [[null, "Hello", undefined, 1, date, { hello: "world" }, ["Hello"]]]
    });
    expect(VLite("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]])).toEqual({
      name: "div",
      props: {},
      children: [[null, "Hello", undefined, 1, date, { hello: "world" }, ["Hello"]]]
    });
  });

  benchmark("Valyrian 5.0.8", () => {
    v("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);
  });
  benchmark("Valyrian next", () => {
    VNext("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);
  });
  benchmark("Valyrian lite", () => {
    VLite("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);
  });
});
