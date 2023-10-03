/* eslint-disable no-console */
const { before, benchmark, compare } = require("buffalo-test");

import { v as VNext } from "valyrian.js";
import { inline } from "valyrian.js/node";
const { expect } = require("expect");
const { v: vOld } = require("./index-old.ts");

compare("hyperscript", () => {
  const date = new Date();
  before(async () => {
    const { raw: newTs } = await inline("./lib/index.ts", { compact: true, noValidate: true });
    const { raw: oldjs } = await inline("./bench/index-old.ts", { compact: true, noValidate: true });
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
