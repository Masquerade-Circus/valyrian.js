/* eslint-disable eqeqeq */
let { compare, benchmark, before, beforeEach } = require("buffalo-test");

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

compare.skip("string comparison vs instance comparison vs property comparison", () => {
  class A {
    name = "a";
  }
  class B {
    b = "b";
  }
  let classA = new A();
  let classB = new B();

  benchmark("string comparison", () => {
    classA.name === "a";
    classB.name === "b";
  });

  benchmark("instance comparison", () => {
    classA instanceof A;
    classB instanceof B;
  });

  benchmark("property comparison", () => {
    "name" in classA;
    "name" in classB;
  });

  benchmark("property string comparison", () => {
    !classA.name;
    !classB.name;
  });

  benchmark("typeof comparison", () => {
    typeof classA.name === "string";
    typeof classB.name === "string";
  });
});

compare.skip("Object with property equals true vs set vs map vs string array", () => {
  let obj = {
    alpha: true,
    beta: true,
    gamma: true,
    delta: true,
    epsilon: true,
    zeta: true
  };

  let set = new Set();
  let map = new Map();
  let arr = [];

  for (let key in obj) {
    set.add(key);
    map.set(key, true);
    arr.push(key);
  }

  beforeEach(() => {
    expect(obj.alpha).toEqual(true);
    expect(obj.capa).toBeUndefined();
    expect(set.has("alpha")).toEqual(true);
    expect(set.has("capa")).toEqual(false);
    expect(map.has("alpha")).toEqual(true);
    expect(map.has("capa")).toEqual(false);
    expect(arr.indexOf("alpha") !== -1).toEqual(true);
    expect(arr.indexOf("capa") !== -1).toEqual(false);
  });

  benchmark("Object with property equals true", () => {
    obj.alpha === true;
    obj.beta === true;
    obj.gamma === true;
    obj.delta === true;
    obj.epsilon === true;
    obj.zeta === true;

    obj.capa === true;
    obj.capa === true;
    obj.capa === true;
    obj.capa === true;
    obj.capa === true;
    obj.capa === true;
  });

  benchmark("key in object", () => {
    "alpha" in obj === true;
    "beta" in obj === true;
    "gamma" in obj === true;
    "delta" in obj === true;
    "epsilon" in obj === true;
    "zeta" in obj === true;

    "capa" in obj === true;
    "capa" in obj === true;
    "capa" in obj === true;
    "capa" in obj === true;
    "capa" in obj === true;
    "capa" in obj === true;
  });

  benchmark("set", () => {
    set.has("alpha") === true;
    set.has("beta") === true;
    set.has("gamma") === true;
    set.has("delta") === true;
    set.has("epsilon") === true;
    set.has("zeta") === true;

    set.has("capa") === true;
    set.has("capa") === true;
    set.has("capa") === true;
    set.has("capa") === true;
    set.has("capa") === true;
    set.has("capa") === true;
  });

  benchmark("map", () => {
    map.has("alpha") === true;
    map.has("beta") === true;
    map.has("gamma") === true;
    map.has("delta") === true;
    map.has("epsilon") === true;
    map.has("zeta") === true;

    map.has("capa") === true;
    map.has("capa") === true;
    map.has("capa") === true;
    map.has("capa") === true;
    map.has("capa") === true;
    map.has("capa") === true;
  });

  benchmark("string array", () => {
    arr.indexOf("alpha") !== -1;
    arr.indexOf("beta") !== -1;
    arr.indexOf("gamma") !== -1;
    arr.indexOf("delta") !== -1;
    arr.indexOf("epsilon") !== -1;
    arr.indexOf("zeta") !== -1;

    arr.indexOf("capa") !== -1;
    arr.indexOf("capa") !== -1;
    arr.indexOf("capa") !== -1;
    arr.indexOf("capa") !== -1;
    arr.indexOf("capa") !== -1;
    arr.indexOf("capa") !== -1;
  });
});

compare.skip("For loop if/continue vs if/else", () => {
  let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  beforeEach(() => {
    expect(arr.length).toEqual(10);
  });

  benchmark("for loop if/continue", () => {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] % 2 === 0) {
        sum -= arr[i];
        continue;
      }
      sum += arr[i];
    }
  });

  benchmark("for loop if/else", () => {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] % 2 === 0) {
        sum -= arr[i];
      } else {
        sum += arr[i];
      }
    }
  });
});

compare.skip("map array of strings vs reduce with object keys equals index", () => {
  let objects = [{ key: "a" }, { key: "b" }, { key: "c" }, { key: "d" }, { key: "e" }, { key: "f" }, { key: "g" }, { key: "h" }, { key: "i" }, { key: "j" }];

  beforeEach(() => {
    let arrayByMap = objects.map((obj) => obj.key);
    expect(arrayByMap[0]).toEqual("a");

    let objectByReduce = objects.reduce((acc, obj, i) => {
      acc[obj.key] = i;
      return acc;
    }, {});
    expect(objectByReduce.a).toEqual(0);

    let arrayByFor = [];
    for (let i = 0; i < objects.length; i++) {
      arrayByFor.push(objects[i].key);
    }
    expect(arrayByFor[0]).toEqual("a");

    let objectByFor = {};
    for (let i = 0; i < objects.length; i++) {
      objectByFor[objects[i].key] = i;
    }
    expect(objectByFor.a).toEqual(0);

    let objectMapByFor = new Map();
    for (let i = 0; i < objects.length; i++) {
      objectMapByFor.set(objects[i].key, i);
    }
    expect(objectMapByFor.get("a")).toEqual(0);
  });

  benchmark("map array of strings", () => {
    let arrayByMap = objects.map((obj) => obj.key);
    arrayByMap.indexOf("a") !== -1;
    arrayByMap.indexOf("b") !== -1;
    arrayByMap.indexOf("c") !== -1;
    arrayByMap.indexOf("d") !== -1;
    arrayByMap.indexOf("e") !== -1;
    arrayByMap.indexOf("f") !== -1;
    arrayByMap.indexOf("g") !== -1;
    arrayByMap.indexOf("h") !== -1;
    arrayByMap.indexOf("i") !== -1;
    arrayByMap.indexOf("j") !== -1;

    arrayByMap.indexOf("k") !== -1;
    arrayByMap.indexOf("l") !== -1;
    arrayByMap.indexOf("m") !== -1;
    arrayByMap.indexOf("n") !== -1;
    arrayByMap.indexOf("o") !== -1;
    arrayByMap.indexOf("p") !== -1;
    arrayByMap.indexOf("q") !== -1;
    arrayByMap.indexOf("r") !== -1;
    arrayByMap.indexOf("s") !== -1;
    arrayByMap.indexOf("t") !== -1;
  });

  benchmark("reduce with object keys equals index", () => {
    let objectByReduce = objects.reduce((acc, obj, i) => {
      acc[obj.key] = i;
      return acc;
    }, {});
    objectByReduce.a === 0;
    objectByReduce.b === 1;
    objectByReduce.c === 2;
    objectByReduce.d === 3;
    objectByReduce.e === 4;
    objectByReduce.f === 5;
    objectByReduce.g === 6;
    objectByReduce.h === 7;
    objectByReduce.i === 8;
    objectByReduce.j === 9;

    objectByReduce.k === 10;
    objectByReduce.l === 11;
    objectByReduce.m === 12;
    objectByReduce.n === 13;
    objectByReduce.o === 14;
    objectByReduce.p === 15;
    objectByReduce.q === 16;
    objectByReduce.r === 17;
    objectByReduce.s === 18;
    objectByReduce.t === 19;
  });

  benchmark("array by for", () => {
    let arrayByFor = [];
    for (let i = 0; i < objects.length; i++) {
      arrayByFor.push(objects[i].key);
    }
    arrayByFor.indexOf("a") !== -1;
    arrayByFor.indexOf("b") !== -1;
    arrayByFor.indexOf("c") !== -1;
    arrayByFor.indexOf("d") !== -1;
    arrayByFor.indexOf("e") !== -1;
    arrayByFor.indexOf("f") !== -1;
    arrayByFor.indexOf("g") !== -1;
    arrayByFor.indexOf("h") !== -1;
    arrayByFor.indexOf("i") !== -1;
    arrayByFor.indexOf("j") !== -1;

    arrayByFor.indexOf("k") !== -1;
    arrayByFor.indexOf("l") !== -1;
    arrayByFor.indexOf("m") !== -1;
    arrayByFor.indexOf("n") !== -1;
    arrayByFor.indexOf("o") !== -1;
    arrayByFor.indexOf("p") !== -1;
    arrayByFor.indexOf("q") !== -1;
    arrayByFor.indexOf("r") !== -1;
    arrayByFor.indexOf("s") !== -1;
    arrayByFor.indexOf("t") !== -1;
  });

  benchmark("object by for", () => {
    let objectByFor = {};
    for (let i = 0; i < objects.length; i++) {
      objectByFor[objects[i].key] = i;
    }
    objectByFor.a === 0;
    objectByFor.b === 1;
    objectByFor.c === 2;
    objectByFor.d === 3;
    objectByFor.e === 4;
    objectByFor.f === 5;
    objectByFor.g === 6;
    objectByFor.h === 7;
    objectByFor.i === 8;
    objectByFor.j === 9;

    objectByFor.k === 10;
    objectByFor.l === 11;
    objectByFor.m === 12;
    objectByFor.n === 13;
    objectByFor.o === 14;
    objectByFor.p === 15;
    objectByFor.q === 16;
    objectByFor.r === 17;
    objectByFor.s === 18;
    objectByFor.t === 19;
  });

  benchmark("object map by for", () => {
    let objectMapByFor = new Map();
    for (let i = 0; i < objects.length; i++) {
      objectMapByFor.set(objects[i].key, i);
    }
    objectMapByFor.get("a") === 0;
    objectMapByFor.get("b") === 1;
    objectMapByFor.get("c") === 2;
    objectMapByFor.get("d") === 3;
    objectMapByFor.get("e") === 4;
    objectMapByFor.get("f") === 5;
    objectMapByFor.get("g") === 6;
    objectMapByFor.get("h") === 7;
    objectMapByFor.get("i") === 8;
    objectMapByFor.get("j") === 9;

    objectMapByFor.get("k") === 10;
    objectMapByFor.get("l") === 11;
    objectMapByFor.get("m") === 12;
    objectMapByFor.get("n") === 13;
    objectMapByFor.get("o") === 14;
    objectMapByFor.get("p") === 15;
    objectMapByFor.get("q") === 16;
    objectMapByFor.get("r") === 17;
    objectMapByFor.get("s") === 18;
    objectMapByFor.get("t") === 19;
  });
});

compare.skip("Symbol access vs direct access", () => {
  beforeEach(() => {
    function Component1() {}
    function Component2() {}

    Component1.__valyrian__ = {
      render: () => {}
    };

    let ValyrianSymbol = Symbol("Valyrian");
    Component2[ValyrianSymbol] = {
      render: () => {}
    };

    expect(Component1.__valyrian__).toBeDefined();
    expect(Component2[ValyrianSymbol]).toBeDefined();

    Reflect.deleteProperty(Component1, "__valyrian__");
    Reflect.deleteProperty(Component2, ValyrianSymbol);

    expect(Component1.__valyrian__).toBeUndefined();
    expect(Component2[ValyrianSymbol]).toBeUndefined();
  });

  benchmark("Direct access access", () => {
    function Component1() {}

    for (let i = 1000; i--; ) {
      Component1.__valyrian__ = {
        render: () => {}
      };
    }

    for (let i = 1000; i--; ) {
      "__valyrian__" in Component1;
    }

    for (let i = 1000; i--; ) {
      Component1.__valyrian__;
    }

    for (let i = 1000; i--; ) {
      Component1.__valyrian__.render;
    }

    for (let i = 1000; i--; ) {
      Reflect.deleteProperty(Component1, "__valyrian__");
    }
  });

  benchmark("Symbol access access", () => {
    function Component2() {}
    let symbol = Symbol("Valyrian");

    for (let i = 1000; i--; ) {
      Component2[symbol] = {
        render: () => {}
      };
    }

    for (let i = 1000; i--; ) {
      symbol in Component2;
    }

    for (let i = 1000; i--; ) {
      Component2[symbol];
    }

    for (let i = 1000; i--; ) {
      Component2[symbol].render;
    }

    for (let i = 1000; i--; ) {
      Reflect.deleteProperty(Component2, symbol);
    }
  });
});