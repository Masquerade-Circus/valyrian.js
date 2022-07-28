/* eslint-disable indent */
let { compare, benchmark, before, afterCycle } = require("buffalo-test");

import v from "../lib/index";

const expect = require("expect");
const nodePlugin = require("../plugins/node");
const { v: vOld } = require("./index-old.ts");
const plugin = require("../plugins/hooks");

v.use(plugin);
v.use(nodePlugin);
const useEffect = plugin.useEffect;
const useMemo = plugin.useMemo;

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
      state: i,
      shouldupdate(n, o) {
        return n.props.state !== o.props.state || n.props.class !== o.props.class;
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
  data.before2.push(createNode({ className: "ok", i }, v));
  if (i % 3) {
    data.before.push(createNode({ className: "ok", i: i + 3 }, vOld));
    data.before2.push(createNode({ className: "ok", i: i + 3 }, v));
  } else {
    data.before.push(createNode({ className: "not-ok", i }, vOld));
    data.before2.push(createNode({ className: "not-ok", i }, v));
  }
  data.update1.push(createNode({ className: "ok", i: 1000 - i }, vOld));
  data.update2.push(createNode({ className: "ok", i: 1000 - i }, v));
}

compare("Mount and update: Mount multiple types", () => {
  let date = new Date();
  let useData = false;
  let Component = () => vOld("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]], useData ? data.before : null);
  let Component2 = () => v("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]], useData ? data.before2 : null);

  before(() => {
    expect(vOld.mount("body", Component)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    expect(v.mount("body", Component2)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    vOld.unmount();
    v.unmount();
    useData = true;
  });

  afterCycle(() => {
    vOld.unmount();
    v.unmount();
  });

  benchmark("vOld", () => {
    vOld.mount("body", Component);
  });

  benchmark("v", () => {
    v.mount("body", Component2);
  });
});

compare("Mount and update: Mount single text", () => {
  let Component = () => "hello world";
  let Component2 = () => "hello world";

  before(() => {
    expect(vOld.mount("body", Component)).toEqual(`hello world`);
    vOld.unmount();
    expect(v.mount("body", Component2)).toEqual(`hello world`);
    v.unmount();
  });

  afterCycle(() => {
    vOld.unmount();
    v.unmount();
  });

  benchmark("vOld", () => {
    vOld.mount("body", Component);
  });

  benchmark("v", () => {
    v.mount("body", Component2);
  });
});

compare("Mount and update: Mount single text in div", () => {
  let Component = () => vOld("div", null, ["hello world"]);
  let Component2 = () => v("div", null, ["hello world"]);

  before(() => {
    expect(vOld.mount("body", Component)).toEqual(`<div>hello world</div>`);
    expect(v.mount("body", Component2)).toEqual(`<div>hello world</div>`);
    vOld.unmount();
    v.unmount();
  });

  afterCycle(() => {
    vOld.unmount();
    v.unmount();
  });

  benchmark("vOld", () => {
    vOld.mount("body", Component);
  });

  benchmark("v", () => {
    v.mount("body", Component2);
  });
});

compare("Mount and update: Update multiple types", () => {
  let date = new Date();
  let useData = false;
  let updateData = false;
  let Component = () =>
    vOld("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]], useData ? (updateData ? data.update1 : data.before) : null);
  let Component2 = () => v("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]], useData ? (updateData ? data.update2 : data.before2) : null);

  before(async () => {
    let oldDate = date;
    expect(vOld.mount("body", Component)).toEqual(`<div>Hello1${oldDate}[object Object]Hello</div>`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    date = new Date();
    expect(vOld.update()).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);

    date = oldDate;
    let before = v.mount("body", Component2);
    expect(before).toEqual(`<div>Hello1${oldDate}[object Object]Hello</div>`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    date = new Date();
    let after = v.update();
    expect(after).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);

    useData = true;
    vOld.unmount();
    vOld.mount("body", Component);
    v.mount("body", Component2);
  });

  benchmark("vOld", () => {
    updateData = true;
    vOld.update();
    updateData = false;
    vOld.update();
    updateData = true;
    vOld.update();
    updateData = false;
  });

  benchmark("v", () => {
    updateData = true;
    v.update();
    updateData = false;
    v.update();
    updateData = true;
    v.update();
    updateData = false;
  });
});

compare("Mount and update: Update single text", () => {
  let updateData = false;
  let Component = () => vOld("div", null, [updateData ? "hello moon" : "hello world"]);
  let Component2 = () => v("div", null, [updateData ? "hello moon" : "hello world"]);

  before(() => {
    expect(vOld.mount("body", Component)).toEqual(`<div>hello world</div>`);
    expect(v.mount("body", Component2)).toEqual(`<div>hello world</div>`);
    updateData = true;
    expect(vOld.update()).toEqual(`<div>hello moon</div>`);
    expect(v.update()).toEqual(`<div>hello moon</div>`);
    updateData = false;
    vOld.unmount();
    vOld.mount("body", Component);
    v.mount("body", Component2);
  });

  benchmark("vOld", () => {
    updateData = true;
    vOld.update();
    updateData = false;
    vOld.update();
    updateData = true;
    vOld.update();
  });

  benchmark("v", () => {
    updateData = true;
    v.update();
    updateData = false;
    v.update();
    updateData = true;
    v.update();
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

      vOld.unmount();
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
        v(
          "ul",
          null,
          keys.map((key) => {
            if (key) {
              return v("li", null, key);
            }
          })
        );

      let before = v.mount("body", component);
      keys = [...test.set];
      let after = v.update();

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

    vOld.unmount();
    vOld.mount("body", component);
    for (let test of tests) {
      keys = [...test.set];
      vOld.update();
    }
  });

  benchmark(`v`, () => {
    let keys = [...set];
    let component = () =>
      v(
        "ul",
        null,
        keys.map((key) => {
          if (key) {
            return v("li", null, key);
          }
        })
      );

    v.mount("body", component);
    for (let test of tests) {
      keys = [...test.set];
      v.update();
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
        v(
          "ul",
          null,
          keys.map((key) => {
            if (key) {
              return v("li", { key }, key);
            }
          })
        );

      console.log(test.name);
      let before = v.mount("body", component);
      keys = [...test.set];
      let after = v.update();

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
      vOld.unmount();
      vOld.mount("body", component);
      keys = [...test.set];
      vOld.update();
    }
  });

  benchmark(`v`, () => {
    let keys = [...set];
    let component = () =>
      v(
        "ul",
        null,
        keys.map((key) => {
          if (key) {
            return v("li", { key }, key);
          }
        })
      );

    for (let test of tests) {
      v.mount("body", component);
      keys = [...test.set];
      v.update();
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
        v(
          "ul",
          null,
          keys.map((key) => {
            if (key) {
              return v("li", { key }, key);
            }
          })
        );

      console.log(test.name);
      let before = v.mount("body", component);
      keys = [...test.set];
      let after = v.update();

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
      vOld.unmount();
      vOld.mount("body", component);
      keys = [...test.set];
      vOld.update();
    }
  });

  benchmark(`v`, () => {
    let keys = [...set];
    let component = () =>
      v(
        "ul",
        null,
        keys.map((key) => {
          if (key) {
            return v("li", { key }, key);
          }
        })
      );

    for (let test of tests) {
      v.mount("body", component);
      keys = [...test.set];
      v.update();
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
      v(
        "ul",
        null,
        keys.map((key) => {
          if (key !== undefined) {
            return v("li", { key }, key);
          }
        })
      );

    let before = v.mount("body", component);
    keys = [...updatedLargeSet];
    let after = v.update();

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

    vOld.unmount();
    vOld.mount("body", component);
    keys = [...updatedLargeSet];
    vOld.update();
  });

  benchmark(`v`, () => {
    let keys = [...set];
    let component = () =>
      v(
        "ul",
        null,
        keys.map((key) => {
          if (key !== undefined) {
            return v("li", { key }, key);
          }
        })
      );

    v.mount("body", component);
    keys = [...updatedLargeSet];
    v.update();
  });
});

compare("Mount and update: Update class", () => {
  // Init with 1000 words
  let words = [...Array(1000).keys()].map((key) => `word ${key}`);
  let useData = false;
  let updateClass = "";
  let updateClass2 = "";
  let Component = () =>
    vOld(
      "div",
      {},
      useData
        ? words.map((word) =>
            vOld(
              "span",
              { class: updateClass === word ? "selected" : false, shouldupdate: (vnode, oldVnode) => vnode.props.class !== oldVnode.props.class },
              word
            )
          )
        : vOld("div", { class: updateClass === "test" ? "test" : false, shouldupdate: (vnode, oldVnode) => vnode.props.class !== oldVnode.props.class }, "test")
    );
  let Component2 = () =>
    v(
      "div",
      {},
      useData
        ? words.map((word) =>
            v(
              "span",
              { class: updateClass2 === word ? "selected" : false, shouldupdate: (vnode, oldVnode) => vnode.props.class !== oldVnode.props.class },
              word
            )
          )
        : v("div", { class: updateClass2 === "test" ? "test" : false, shouldupdate: (vnode, oldVnode) => vnode.props.class !== oldVnode.props.class }, "test")
    );

  before(() => {
    let before = vOld.mount("body", Component);
    expect(before).toEqual("<div><div>test</div></div>");
    updateClass = "test";
    let after = vOld.update();
    expect(after).toEqual('<div><div class="test">test</div></div>');

    let before2 = v.mount("body", Component2);
    expect(before2).toEqual("<div><div>test</div></div>");
    updateClass2 = "test";
    let after2 = v.update();
    expect(after2).toEqual('<div><div class="test">test</div></div>');

    useData = true;
    updateClass = "";
    updateClass2 = "";
  });

  benchmark("vOld update", () => {
    vOld.update();
    updateClass = updateClass === "word 10" ? "word 100" : "word 10";
  });

  benchmark("v update", () => {
    v.update();
    updateClass2 = updateClass2 === "word 10" ? "word 100" : "word 10";
  });
});

compare("Mount and update: Update class with hooks vs shouldupdate property", () => {
  let updateClass2 = "";
  let Component = () => (
    <div>
      {
        <div class={updateClass2 === "test" ? "test" : false} shouldupdate={(vnode, oldVnode) => vnode.props.class !== oldVnode.props.class}>
          test
        </div>
      }
    </div>
  );

  let Component2 = () => (
    <div>
      {useMemo(
        () => (
          <div class={updateClass2 === "test" ? "test" : false}>test</div>
        ),
        [updateClass2]
      )}
    </div>
  );

  before(() => {
    let before = v.mount("body", Component);
    expect(before).toEqual("<div><div>test</div></div>");
    updateClass2 = "test";
    let after = v.update();
    expect(after).toEqual('<div><div class="test">test</div></div>');

    updateClass2 = "";
    let before2 = v.mount("body", Component2);
    expect(before2).toEqual("<div><div>test</div></div>");
    updateClass2 = "test";
    let after2 = v.update();
    expect(after2).toEqual('<div><div class="test">test</div></div>');
    updateClass2 = "";
  });

  benchmark("shouldupdate property", () => {
    updateClass2 = "";
    v.mount("body", Component);
    for (let i = 0; i < 10000; i++) {
      updateClass2 = updateClass2 === "test" ? "" : "test";
      v.update();
    }
  });

  benchmark("useMemo hook", () => {
    updateClass2 = "";
    v.mount("body", Component2);
    for (let i = 0; i < 10000; i++) {
      updateClass2 = updateClass2 === "test" ? "" : "test";
      v.update();
    }
  });
});

compare("Lifecycle vs hooks", () => {
  let lifecycleCount = 0;
  let plusLifeCycle = () => (lifecycleCount += 1);

  let hooksCount = 0;
  let plusHooks = () => (hooksCount += 1);

  let LifecycleComponent = () => {
    return (
      <div oncreate={plusLifeCycle} onupdate={plusLifeCycle} onremove={plusLifeCycle}>
        Hello world
      </div>
    );
  };

  let HooksComponent = () => {
    // useEffect(plusHooks, []); // Only create replaced by the next line
    useEffect(plusHooks); // Create & Update
    useEffect(plusHooks, null); // Remove
    return <div>Hello world</div>;
  };

  before(() => {
    v.mount("body", LifecycleComponent);
    expect(lifecycleCount).toEqual(1);
    v.update();
    expect(lifecycleCount).toEqual(2);
    v.unmount();
    expect(lifecycleCount).toEqual(3);

    v.mount("body", HooksComponent);
    expect(hooksCount).toEqual(1);
    v.update();
    expect(hooksCount).toEqual(2);
    v.unmount();
    expect(hooksCount).toEqual(3);
  });

  benchmark(`Hooks`, () => {
    v.mount("body", HooksComponent);
    for (let i = 0; i < 10000; i++) {
      v.update();
    }
    v.unmount();
  });

  benchmark(`Lifecycle`, () => {
    v.mount("body", LifecycleComponent);
    for (let i = 0; i < 10000; i++) {
      v.update();
    }
    v.unmount();
  });
});
