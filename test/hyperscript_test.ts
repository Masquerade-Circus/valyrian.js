import "valyrian.js/node";

import { mount, trust, unmount, v } from "valyrian.js";

import { afterEach, beforeEach, expect, describe, test as it } from "bun:test";

describe("Hyperscript", () => {
  beforeEach(unmount);
  afterEach(unmount);

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

  it("stores key on vnode.key for hyperscript", () => {
    const vnode = v("li", { key: 7, class: "row" }, "A");

    expect(vnode.key).toBe(7);
    expect(vnode.props).toEqual({ class: "row" });
    expect("key" in (vnode.props || {})).toBeFalse();
    expect(vnode.children).toEqual(["A"]);
  });

  it("preserves null props when hyperscript receives null", () => {
    const vnode = v("li", null, "A");

    expect(vnode.props).toBeNull();
    expect(vnode.key).toBeUndefined();
    expect(vnode.children).toEqual(["A"]);
  });

  it("does not pass key inside props to manual components", () => {
    const dom = document.createElement("div");
    let receivedProps: any = null;

    function Row(props: any) {
      receivedProps = props;
      return v("li", null, props.label);
    }

    function App() {
      return v("ul", null, v(Row, { key: "row-1", label: "A" }));
    }

    mount(dom, App);

    expect(dom.innerHTML).toEqual("<ul><li>A</li></ul>");
    expect(receivedProps).toEqual({ label: "A" });
    expect("key" in (receivedProps || {})).toBeFalse();
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
