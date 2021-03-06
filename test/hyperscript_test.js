import "../lib";

import expect from "expect";
import nodePlugin from "../plugins/node";
v.usePlugin(nodePlugin);

describe("Hyperscript", () => {
  it("should create a div element", () => {
    expect(v("div")).toEqual({
      name: "div",
      props: {},
      children: []
    });
  });

  it("should create a div element with a text child", () => {
    expect(v("div", null, "Hello")).toEqual({
      name: "div",
      props: {},
      children: ["Hello"]
    });
  });

  it("should create a div element with an element child", () => {
    expect(v("div", null, v("span"))).toEqual({
      name: "div",
      props: {},
      children: [
        {
          name: "span",
          props: {},
          children: []
        }
      ]
    });
  });

  it("should create a div element with comma separated children", () => {
    expect(v("div", null, "Hello ", "world")).toEqual({
      name: "div",
      props: {},
      children: ["Hello ", "world"]
    });
  });

  it("should create a div element with array of children", () => {
    expect(v("div", null, ["Hello ", "world"])).toEqual({
      name: "div",
      props: {},
      children: [["Hello ", "world"]]
    });
  });

  it("should create a div element with mixed array of children and comma separated children", () => {
    expect(v("div", null, ["Hello ", "world"], v("span", null, "Whats up"))).toEqual({
      name: "div",
      props: {},
      children: [
        ["Hello ", "world"],
        {
          name: "span",
          props: {},
          children: ["Whats up"]
        }
      ]
    });
  });

  it("should create a div element with mixed nested arrays of children ", () => {
    expect(v("div", null, ["Hello ", "world", ["Only", ["for", "this", ["time"]]]])).toEqual({
      name: "div",
      props: {},
      children: [["Hello ", "world", ["Only", ["for", "this", ["time"]]]]]
    });
  });

  it("should create a div element with props", () => {
    expect(v("div", { id: "unique", class: "unique" })).toEqual({
      name: "div",
      props: {
        id: "unique",
        class: "unique"
      },
      children: []
    });
  });

  it("should create a div element from string", () => {
    expect(v.trust('<div id="unique" class="unique">Hola mundo</div>')).toEqual([
      {
        name: "div",
        props: {
          id: "unique",
          class: "unique"
        },
        children: [{ dom: expect.anything() }],
        dom: expect.anything()
      }
    ]);
  });

  it("should handle different types of data", () => {
    let date = new Date();

    expect(v("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]])).toEqual({
      name: "div",
      props: {},
      children: [[null, "Hello", undefined, 1, date, { hello: "world" }, ["Hello"]]]
    });
  });
});
