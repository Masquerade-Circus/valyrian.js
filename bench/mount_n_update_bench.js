let { compare, benchmark, before } = require("buffalo-test");

const { mount, update, v } = require("../lib/index.ts");

const expect = require("expect");
require("../plugins/node");
const vOld = require("./index-old");

let VNext = v;

let data = {
  before: [],
  before2: [],
  update1: [],
  update2: []
};

function createNode({ className, i }, v) {
  return v(
    "div",
    {
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
    },
    "Hello"
  );
}

for (let i = 1000; i--; ) {
  data.before.push(createNode({ className: "ok", i }, vOld));
  data.before2.push(createNode({ className: "ok", i }, VNext));
  if (i % 3) {
    data.before.push(createNode({ className: "ok", i: i + 3 }, vOld));
    data.before2.push(createNode({ className: "ok", i: i + 3 }, VNext));
  } else {
    data.before.push(createNode({ className: "not-ok", i }, vOld));
    data.before2.push(createNode({ className: "not-ok", i }, VNext));
  }
  data.update1.push(createNode({ className: "ok", i: 1000 - i }, vOld));
  data.update2.push(createNode({ className: "ok", i: 1000 - i }, VNext));
}

compare("Mount and update: Mount multiple types", () => {
  let date = new Date();
  let useData = false;
  let Component = () => vOld("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]], useData ? data.before : null);
  let Component2 = () => VNext("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]], useData ? data.before2 : null);

  before(() => {
    expect(vOld.mount("body", Component)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    expect(mount("body", Component2)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    useData = true;
  });

  benchmark("Valyrian 5.0.8", () => {
    vOld.unMount();
    vOld.mount("body", Component);
  });

  benchmark("Valyrian next", () => {
    mount("body", Component2);
  });
});

compare("Mount and update: Mount single text", () => {
  let Component = () => "hello world";
  let Component2 = () => "hello world";

  before(() => {
    expect(vOld.mount("body", Component)).toEqual(`hello world`);
    expect(mount("body", Component2)).toEqual(`hello world`);
  });

  benchmark("Valyrian 5.0.8", () => {
    vOld.unMount();
    vOld.mount("body", Component);
  });

  benchmark("Valyrian next", () => {
    mount("body", Component2);
  });
});

compare("Mount and update: Mount single text in div", () => {
  let Component = () => vOld("div", null, ["hello world"]);
  let Component2 = () => VNext("div", null, ["hello world"]);

  before(() => {
    expect(vOld.mount("body", Component)).toEqual(`<div>hello world</div>`);
    expect(mount("body", Component2)).toEqual(`<div>hello world</div>`);
  });

  benchmark("Valyrian 5.0.8", () => {
    vOld.unMount();
    vOld.mount("body", Component);
  });

  benchmark("Valyrian next", () => {
    mount("body", Component2);
  });
});

compare("Mount and update: Update multiple types", () => {
  let date = new Date();
  let useData = false;
  let updateData = false;
  let Component = () =>
    vOld("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]], useData ? (updateData ? data.update1 : data.before) : null);
  let Component2 = () =>
    VNext("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]], useData ? (updateData ? data.update2 : data.before2) : null);

  before(async () => {
    let oldDate = date;
    expect(vOld.mount("body", Component)).toEqual(`<div>Hello1${oldDate}[object Object]Hello</div>`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    date = new Date();
    expect(vOld.update()).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);

    date = oldDate;
    let before = mount("body", Component2);
    expect(before).toEqual(`<div>Hello1${oldDate}[object Object]Hello</div>`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    date = new Date();
    let after = update(Component2);
    expect(after).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);

    useData = true;
    vOld.unMount();
    vOld.mount("body", Component);
    mount("body", Component2);
  });

  benchmark("Valyrian 5.0.8", () => {
    updateData = true;
    vOld.update();
    updateData = false;
    vOld.update();
    updateData = true;
    vOld.update();
    updateData = false;
  });

  benchmark("Valyrian next", () => {
    updateData = true;
    update(Component2);
    updateData = false;
    update(Component2);
    updateData = true;
    update(Component2);
    updateData = false;
  });
});

compare("Mount and update: Update single text", () => {
  let updateData = false;
  let Component = () => vOld("div", null, [updateData ? "hello moon" : "hello world"]);
  let Component2 = () => VNext("div", null, [updateData ? "hello moon" : "hello world"]);

  before(() => {
    expect(vOld.mount("body", Component)).toEqual(`<div>hello world</div>`);
    expect(mount("body", Component2)).toEqual(`<div>hello world</div>`);
    updateData = true;
    expect(vOld.update()).toEqual(`<div>hello moon</div>`);
    expect(update(Component2)).toEqual(`<div>hello moon</div>`);
    updateData = false;
    vOld.unMount();
    vOld.mount("body", Component);
    mount("body", Component2);
  });

  benchmark("Valyrian 5.0.8", () => {
    updateData = true;
    vOld.update();
    updateData = false;
    vOld.update();
    updateData = true;
    vOld.update();
  });

  benchmark("Valyrian next", () => {
    updateData = true;
    update(Component2);
    updateData = false;
    update(Component2);
    updateData = true;
    update(Component2);
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

      vOld.unMount();
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

      let before = mount("body", component);
      keys = [...test.set];
      let after = update(component);

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

    mount("body", component);
    for (let test of tests) {
      keys = [...test.set];
      update(component);
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
      let before = mount("body", component);
      keys = [...test.set];
      let after = update(component);

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

    for (let test of tests) {
      vOld.unMount();
      vOld.mount("body", component);
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

    for (let test of tests) {
      mount("body", component);
      keys = [...test.set];
      update(component);
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
    { name: "Switch positions", set: [10, 2, 3, 4, 5, 6, 7, 8, 9, 1], movements: 2 }, // Switch positions,
    { name: "Switch different positions", set: [10, 6, 3, 4, 2, 5, 7, 8, 9, 1], movements: 4 }, // Switch positions,
    { name: "Mixed positions", set: [1, 3, 2, 6, 5, 4, 7, 8, 9, 10], movements: 3 },
    { name: "Replaced with undefined", set: [1, 3, 2, , 5, 4, 6, 7, 8, 9, 10], movements: 2 },
    {
      name: "Added, remove and replaced with undefined",
      set: [11, 12, 13, 14, 15, 16, 17, , 18, 19, 20],
      movements: 10
    },
    { name: "Removed all at the end", set: [1], movements: 9 }, // Removed at the end
    { name: "Switch positions in large list", set: [10, 2, 3, 4, 5, 6, 7, 8, 9, 1], movements: 2 } // Switch positions
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
      let before = mount("body", component);
      keys = [...test.set];
      let after = update(component);

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

    for (let test of tests) {
      vOld.unMount();
      vOld.mount("body", component);
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

    for (let test of tests) {
      mount("body", component);
      keys = [...test.set];
      update(component);
    }
  });
});

compare("Mount and update: Render keyed list -> swap keys on large set", () => {
  let set = [...Array(1000).keys()];
  let updatedLargeSet = [...set];
  updatedLargeSet[1] = 998;
  updatedLargeSet[998] = 1;

  function getString(set) {
    let str = `<ul>`;
    for (let key of set) {
      str += key !== undefined ? `<li>${key}</li>` : "";
    }
    str += "</ul>";
    return str;
  }
  let beforeString = getString(set);

  before(() => {
    let keys = [...set];
    let component = () =>
      vOld(
        "ul",
        null,
        keys.map((key) => {
          if (key !== undefined) {
            return vOld("li", { key }, key);
          }
        })
      );

    let before = vOld.mount("body", component);
    keys = [...updatedLargeSet];
    let after = vOld.update();

    let afterString = getString(updatedLargeSet);

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
          if (key !== undefined) {
            return VNext("li", { key }, key);
          }
        })
      );

    let before = mount("body", component);
    keys = [...updatedLargeSet];
    let after = update(component);

    let afterString = getString(updatedLargeSet);

    expect(before).toEqual(beforeString);
    expect(after).toEqual(afterString);
  });

  benchmark(`vOld`, () => {
    let keys = [...set];
    let component = () =>
      vOld(
        "ul",
        null,
        keys.map((key) => {
          if (key !== undefined) {
            return vOld("li", { key }, key);
          }
        })
      );

    vOld.unMount();
    vOld.mount("body", component);
    keys = [...updatedLargeSet];
    vOld.update();
  });

  benchmark(`VNext`, () => {
    let keys = [...set];
    let component = () =>
      VNext(
        "ul",
        null,
        keys.map((key) => {
          if (key !== undefined) {
            return VNext("li", { key }, key);
          }
        })
      );

    mount("body", component);
    keys = [...updatedLargeSet];
    update(component);
  });
});
