let { compare, benchmark, before } = require("@masquerade-circus/bench-test");

import "../lib/index.ts";

import expect from "expect";
import nodePlugin from "../plugins/node";
import vOld from "./index-old";

let VNext = v;

let data = {
  before: [],
  update1: [],
  update2: []
};

function createNode({ className, i }) {
  return {
    class: className,
    data: i,
    onbeforeupdate(n, o) {
      return n.props.data !== o.props.data || n.props.class !== o.props.class;
    },
    id: className + i,
    style: "font-size:" + i + "px",
    autocomplete: "off",
    focus: false,
    onclick() {
      // console.log("clicked", this);
    }
  };
}

for (let i = 1000; i--; ) {
  data.before.push(createNode({ className: "ok", i }));
  if (i % 3) {
    data.before.push(createNode({ className: "ok", i: i + 3 }));
  } else {
    data.before.push(createNode({ className: "not-ok", i }));
  }
  data.update2.push(createNode({ className: "ok", i: 1000 - i }));
}

compare("Mount and update: Mount multiple types", () => {
  let date = new Date();
  let useData = false;
  let Component = () => vOld("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]], useData ? data.before : null);
  let Component2 = () => VNext("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]], useData ? data.before : null);
  let Component3 = () => VNext("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]], useData ? data.before : null);

  before(() => {
    expect(vOld.mount("body", Component)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    expect(VNext.mount("body", Component2)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    expect(VNext.mount("body", Component3)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    useData = true;
  });

  benchmark("Valyrian 5.0.8", () => {
    vOld.unMount();
    vOld.mount("body", Component);
  });

  benchmark("Valyrian next", () => {
    VNext.mount("body", Component2);
  });
});

compare("Mount and update: Mount single text", () => {
  let Component = () => vOld("div", null, ["hello world"]);
  let Component2 = () => VNext("div", null, ["hello world"]);

  before(() => {
    expect(vOld.mount("body", Component)).toEqual(`<div>hello world</div>`);
    expect(VNext.mount("body", Component2)).toEqual(`<div>hello world</div>`);
  });

  benchmark("Valyrian 5.0.8", () => {
    vOld.unMount();
    vOld.mount("body", Component);
  });

  benchmark("Valyrian next", () => {
    VNext.mount("body", Component2);
  });
});

compare("Mount and update: Update multiple types", () => {
  let date = new Date();
  let useData = false;
  let updateData = false;
  let Component = () =>
    vOld("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]], useData ? (updateData ? data.update1 : data.before) : null);
  let Component2 = () =>
    VNext("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]], useData ? (updateData ? data.update1 : data.before) : null);

  before(() => {
    expect(vOld.mount("body", Component)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    expect(vOld.update()).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);

    expect(VNext.mount("body", Component2)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    expect(VNext.update()).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    vOld.unMount();
    useData = true;
  });

  benchmark("Valyrian 5.0.8", () => {
    vOld.unMount();
    vOld.mount("body", Component);
    updateData = true;
    vOld.update();
    updateData = false;
    vOld.update();
    updateData = true;
    vOld.update();
    updateData = false;
  });

  benchmark("Valyrian next", () => {
    VNext.mount("body", Component2);
    updateData = true;
    VNext.update();
    updateData = false;
    VNext.update();
    updateData = true;
    VNext.update();
    updateData = false;
  });
});

compare("Mount and update: Update single text", () => {
  let updateData = false;
  let Component = () => vOld("div", null, [updateData ? "hello moon" : "hello world"]);
  let Component2 = () => VNext("div", null, [updateData ? "hello moon" : "hello world"]);

  before(() => {
    expect(vOld.mount("body", Component)).toEqual(`<div>hello world</div>`);
    expect(VNext.mount("body", Component2)).toEqual(`<div>hello world</div>`);
    updateData = true;
    expect(vOld.update()).toEqual(`<div>hello moon</div>`);
    expect(VNext.update()).toEqual(`<div>hello moon</div>`);
    updateData = false;
  });

  benchmark("Valyrian 5.0.8", () => {
    vOld.unMount();
    vOld.mount("body", Component);
    updateData = true;
    vOld.update();
    updateData = false;
    vOld.update();
    updateData = true;
    vOld.update();
  });

  benchmark("Valyrian next", () => {
    VNext.mount("body", Component2);
    updateData = true;
    VNext.update();
    updateData = false;
    VNext.update();
    updateData = true;
    VNext.update();
  });
});

compare("Mount and update: Render list", () => {
  let set = [1, 2, 3, 4, 5];
  let tests = [
    { name: "Removed at the end", set: [1, 2, 3, 4] }, // Removed at the end
    { name: "Removed at the start", set: [2, 3, 4, 5] }, // Remmoved at the start
    { name: "Removed at the center", set: [1, 3, 5] }, // Removed at the center
    { name: "Added at the end", set: [1, 2, 3, 4, 5, 6] }, // Added at the end
    { name: "Added at the start", set: [6, 1, 2, 3, 4, 5] }, // Added at the start
    { name: "Added at the center", set: [1, 2, 6, 3, 4, 5] }, // Added at the center
    { name: "Reversed", set: [5, 4, 3, 2, 1] }, // Reversed
    { name: "Switch positions", set: [5, 2, 3, 4, 1] }, // Switch positions,
    { name: "Mixed positions", set: [1, 3, 2, 6, 5, 4] },
    { name: "Replaced with undefined", set: [1, 3, 2, , 5, 4] },
    {
      name: "Added, remove and replaced with undefined",
      set: [6, 7, 8, 9, , 10]
    },
    { name: "Removed all at the end", set: [1] } // Removed at the end
  ];

  function getString(set) {
    let str = "<ul>";
    for (let key of set) {
      str += key ? `<li>${key}</li>` : "";
    }
    str += "</ul>";
    return str;
  }
  let beforeString = getString(set);

  tests.forEach((test) => {
    before(() => {
      let keys = [...set];
      let component = () =>
        vOld(
          "ul",
          null,
          keys.map((key) => {
            if (key) {
              return vOld("li", null, key);
            }
          })
        );

      let before = vOld.mount("body", component);
      keys = [...test.set];
      let after = vOld.update();

      let afterString = getString(test.set);

      expect(before).toEqual(beforeString);
      expect(after).toEqual(afterString);
    });

    before(() => {
      let keys = [...set];
      let component = () =>
        VNext(
          "ul",
          null,
          keys.map((key) => {
            if (key) {
              return VNext("li", null, key);
            }
          })
        );

      let before = VNext.mount("body", component);
      keys = [...test.set];
      let after = VNext.update();

      let afterString = getString(test.set);

      expect(before).toEqual(beforeString);
      expect(after).toEqual(afterString);
    });
  });

  benchmark(`vOld`, () => {
    let keys = [...set];
    let component = () =>
      vOld(
        "ul",
        null,
        keys.map((key) => {
          if (key) {
            return vOld("li", null, key);
          }
        })
      );

    vOld.unMount();
    vOld.mount("body", component);
    for (let test of tests) {
      keys = [...test.set];
      vOld.update();
    }
  });

  benchmark(`VNext`, () => {
    let keys = [...set];
    let component = () =>
      VNext(
        "ul",
        null,
        keys.map((key) => {
          if (key) {
            return VNext("li", null, key);
          }
        })
      );

    VNext.mount("body", component);
    for (let test of tests) {
      keys = [...test.set];
      VNext.update();
    }
  });
});

compare("Mount and update: Render keyed list", () => {
  let set = [1, 2, 3, 4, 5];
  let tests = [
    { name: "Removed at the end", set: [1, 2, 3, 4] }, // Removed at the end
    { name: "Removed at the start", set: [2, 3, 4, 5] }, // Remmoved at the start
    { name: "Removed at the center", set: [1, 3, 5] }, // Removed at the center
    { name: "Added at the end", set: [1, 2, 3, 4, 5, 6] }, // Added at the end
    { name: "Added at the start", set: [6, 1, 2, 3, 4, 5] }, // Added at the start
    { name: "Added at the center", set: [1, 2, 6, 3, 4, 5] }, // Added at the center
    { name: "Reversed", set: [5, 4, 3, 2, 1] }, // Reversed
    { name: "Switch positions", set: [5, 2, 3, 4, 1] }, // Switch positions,
    { name: "Mixed positions", set: [1, 3, 2, 6, 5, 4] },
    { name: "Replaced with undefined", set: [1, 3, 2, , 5, 4] },
    {
      name: "Added, remove and replaced with undefined",
      set: [6, 7, 8, 9, , 10]
    },
    { name: "Removed all at the end", set: [1] } // Removed at the end
  ];

  function getString(set) {
    let str = `<ul>`;
    for (let key of set) {
      str += key ? `<li>${key}</li>` : "";
    }
    str += "</ul>";
    return str;
  }
  let beforeString = getString(set);

  tests.forEach((test) => {
    before(() => {
      let keys = [...set];
      let component = () =>
        vOld(
          "ul",
          null,
          keys.map((key) => {
            if (key) {
              return vOld("li", { key }, key);
            }
          })
        );

      let before = vOld.mount("body", component);
      keys = [...test.set];
      let after = vOld.update();

      let afterString = getString(test.set);

      expect(before).toEqual(beforeString);
      expect(after).toEqual(afterString);
    });

    before(() => {
      let keys = [...set];
      let component = () =>
        VNext(
          "ul",
          null,
          keys.map((key) => {
            if (key) {
              return VNext("li", { key }, key);
            }
          })
        );

      console.log(test.name);
      let before = VNext.mount("body", component);
      keys = [...test.set];
      let after = VNext.update();

      let afterString = getString(test.set);

      expect(before).toEqual(beforeString);
      expect(after).toEqual(afterString);
    });
  });

  benchmark(`vOld`, () => {
    let keys = [...set];
    let component = () =>
      vOld(
        "ul",
        null,
        keys.map((key) => {
          if (key) {
            return vOld("li", { key }, key);
          }
        })
      );

    vOld.unMount();
    vOld.mount("body", component);
    for (let test of tests) {
      keys = [...test.set];
      vOld.update();
    }
  });

  benchmark(`VNext`, () => {
    let keys = [...set];
    let component = () =>
      VNext(
        "ul",
        null,
        keys.map((key) => {
          if (key) {
            return VNext("li", { key }, key);
          }
        })
      );

    VNext.mount("body", component);
    for (let test of tests) {
      keys = [...test.set];
      VNext.update();
    }
  });
});

compare("Mount and update: Render keyed list -> stress", () => {
  let set = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  let tests = [
    { name: "Removed at the end", set: [1, 2, 3, 4, 5, 6, 7, 8, 9], movements: 1 }, // Removed at the end
    { name: "Removed at the start", set: [2, 3, 4, 5, 6, 7, 8, 9, 10], movements: 1 }, // Remmoved at the start
    { name: "Removed at the center", set: [1, 2, 3, 5, 6, 8, 9, 10], movements: 2 }, // Removed at the center
    { name: "Added at the end", set: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], movements: 1 }, // Added at the end
    { name: "Added at the start", set: [11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], movements: 1 }, // Added at the start
    { name: "Added at the center", set: [1, 2, 3, 4, 5, 11, 6, 7, 8, 9, 10], movements: 1 }, // Added at the center
    { name: "Reversed", set: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1], movements: 9 }, // Reversed
    { name: "Switch positions", set: [10, 2, 3, 4, 5, 6, 7, 8, 9, 1], movements: 9 }, // Switch positions,
    { name: "Mixed positions", set: [1, 3, 2, 6, 5, 4, 7, 8, 9, 10], movements: 3 },
    { name: "Replaced with undefined", set: [1, 3, 2, , 5, 4, 6, 7, 8, 9, 10], movements: 2 },
    {
      name: "Added, remove and replaced with undefined",
      set: [11, 12, 13, 14, 15, 16, 17, , 18, 19, 20],
      movements: 10
    },
    { name: "Removed all at the end", set: [1], movements: 9 } // Removed at the end
  ];

  function getString(set) {
    let str = `<ul>`;
    for (let key of set) {
      str += key ? `<li>${key}</li>` : "";
    }
    str += "</ul>";
    return str;
  }
  let beforeString = getString(set);

  tests.forEach((test) => {
    before(() => {
      let keys = [...set];
      let component = () =>
        vOld(
          "ul",
          null,
          keys.map((key) => {
            if (key) {
              return vOld("li", { key }, key);
            }
          })
        );

      let before = vOld.mount("body", component);
      keys = [...test.set];
      let after = vOld.update();

      let afterString = getString(test.set);

      expect(before).toEqual(beforeString);
      expect(after).toEqual(afterString);
    });

    before(() => {
      let keys = [...set];
      let component = () =>
        VNext(
          "ul",
          null,
          keys.map((key) => {
            if (key) {
              return VNext("li", { key }, key);
            }
          })
        );

      console.log(test.name);
      let before = VNext.mount("body", component);
      keys = [...test.set];
      let after = VNext.update();

      let afterString = getString(test.set);

      expect(before).toEqual(beforeString);
      expect(after).toEqual(afterString);
    });
  });

  benchmark(`vOld`, () => {
    let keys = [...set];
    let component = () =>
      vOld(
        "ul",
        null,
        keys.map((key) => {
          if (key) {
            return vOld("li", { key }, key);
          }
        })
      );

    vOld.unMount();
    vOld.mount("body", component);
    for (let test of tests) {
      keys = [...test.set];
      vOld.update();
    }
  });

  benchmark(`VNext`, () => {
    let keys = [...set];
    let component = () =>
      VNext(
        "ul",
        null,
        keys.map((key) => {
          if (key) {
            return VNext("li", { key }, key);
          }
        })
      );

    VNext.mount("body", component);
    for (let test of tests) {
      keys = [...test.set];
      VNext.update();
    }
  });
});
