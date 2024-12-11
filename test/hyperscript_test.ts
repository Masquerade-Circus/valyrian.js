import "valyrian.js/node";

import { trust, v } from "valyrian.js";

import { expect, describe, test as it } from "bun:test";

describe("Hyperscript", () => {
  it("should create a div element", () => {
    expect(v("div", null)).toEqual({
      tag: "div",
      props: null,
      children: []
    } as any);
  });

  it("should create a div element with a text child", () => {
    expect(v("div", null, "Hello")).toEqual({
      tag: "div",
      props: null,
      children: ["Hello"]
    });
  });

  it("should create a div element with an element child", () => {
    expect(v("div", null, v("span", null))).toEqual({
      tag: "div",
      props: null,
      children: [
        {
          tag: "span",
          props: null,
          children: []
        }
      ]
    });
  });

  it("should create a div element with comma separated children", () => {
    expect(v("div", null, "Hello ", "world")).toEqual({
      tag: "div",
      props: null,
      children: ["Hello ", "world"]
    });
  });

  it("should create a div element with array of children", () => {
    expect(v("div", null, ["Hello ", "world"])).toEqual({
      tag: "div",
      props: null,
      children: [["Hello ", "world"]]
    });
  });

  it("should create a div element with mixed array of children and comma separated children", () => {
    expect(v("div", null, ["Hello ", "world"], v("span", null, "Whats up"))).toEqual({
      tag: "div",
      props: null,
      children: [
        ["Hello ", "world"],
        {
          tag: "span",
          props: null,
          children: ["Whats up"]
        }
      ]
    });
  });

  it("should create a div element with mixed nested arrays of children ", () => {
    expect(v("div", null, ["Hello ", "world", ["Only", ["for", "this", ["time"]]]])).toEqual({
      tag: "div",
      props: null,
      children: [["Hello ", "world", ["Only", ["for", "this", ["time"]]]]]
    });
  });

  it("should create a div element with props", () => {
    expect(v("div", { id: "unique", class: "unique" })).toEqual({
      tag: "div",
      props: {
        id: "unique",
        class: "unique"
      },
      children: []
    });
  });

  it("should create a div element from string", () => {
    expect(trust('<div id="unique" class="unique">Hola mundo</div>')).toEqual([
      {
        tag: "div",
        props: {
          id: "unique",
          class: "unique"
        },
        isSVG: false,
        children: ["Hola mundo"],
        dom: expect.anything()
      }
    ]);
  });

  it("should handle different types of data", () => {
    const date = new Date();

    expect(v("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]])).toEqual({
      tag: "div",
      props: null,
      children: [[null, "Hello", undefined, 1, date, { hello: "world" }, ["Hello"]]]
    });
  });
});
