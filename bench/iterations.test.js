/* eslint-disable eqeqeq */
let { compare, benchmark, before } = require("buffalo-test");

import expect from "expect";

compare.skip("Set.has vs [].indexOf", () => {
  let set = new Set();
  set.add("hello");
  set.add("world");

  let arr = ["hello", "world"];

  before(() => {
    expect(set.has("hello")).toEqual(true);
    expect(set.has("world")).toEqual(true);
    expect(set.has("hola")).toEqual(false);

    expect(arr.indexOf("hello") !== -1).toEqual(true);
    expect(arr.indexOf("world") !== -1).toEqual(true);
    expect(arr.indexOf("hola") !== -1).toEqual(false);
  });

  benchmark("Set.has", () => {
    set.has("hello");
    set.has("world");
    set.has("hola");
  });

  benchmark("[].indexOf", () => {
    arr.indexOf("hello") !== -1;
    arr.indexOf("world") !== -1;
    arr.indexOf("hola") !== -1;
  });
});

compare.skip("Object.keys for loop vs Object.keys for of vs for in", () => {
  let obj = {
    a: 1,
    b: 2,
    c: 3,
    d: 4,
    e: 5,
    f: 6,
    g: 7
  };

  benchmark("Object.keys for loop", () => {
    let keys = Object.keys(obj);

    for (let i = 0; i--; ) {
      keys[i];
    }
  });

  benchmark("Object.keys for of", () => {
    let keys = Object.keys(obj);

    for (let key of keys) {
      key;
    }
  });

  benchmark("for in", () => {
    for (let key in obj) {
      key;
    }
  });
});

compare.skip("typeof function vs startsWith vs charAt vs string[0]", () => {
  let obj = {
    oncreate() {},
    b: null,
    c: 1,
    d: new Date(),
    e: {}
  };

  benchmark("typeof function", () => {
    for (let key in obj) {
      typeof key === "function";
    }
  });

  benchmark("startsWith", () => {
    for (let key in obj) {
      // eslint-disable-next-line sonarjs/no-ignored-return
      key.startsWith("on");
    }
  });

  benchmark("charAt", () => {
    for (let key in obj) {
      key.charAt(0) === "o" && key.charAt(1) === "n";
    }
  });

  benchmark("string[0]", () => {
    for (let key in obj) {
      key[0] === "o" && key[1] === "n";
    }
  });
});

compare.skip("Array.isArray vs typeof object & Array.isArray", () => {
  let a = [];
  let b = {};
  let c = null;
  let d = "string";
  let e = 1;

  benchmark("Array.isArray", () => {
    Array.isArray(a);
    Array.isArray(b);
    Array.isArray(c);
    Array.isArray(d);
    Array.isArray(e);
  });

  benchmark("typeof object & Array.isArray", () => {
    typeof a === "object" && Array.isArray(a);
    typeof b === "object" && Array.isArray(b);
    typeof c === "object" && Array.isArray(c);
    typeof d === "object" && Array.isArray(d);
    typeof e === "object" && Array.isArray(e);
  });
});
