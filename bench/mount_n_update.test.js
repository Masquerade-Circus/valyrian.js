let { compare, benchmark, before } = require("@masquerade-circus/bench-test/lib");

import VNext from "../lib/index";
import expect from "expect";
import nodePlugin from "../plugins/node";
import v from "../lib/index-old";

v.usePlugin(nodePlugin);

compare.only("Mount and update: Mount", () => {
  let date = new Date();
  let Component = () => v("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);
  let Component2 = () => VNext("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);

  before(() => {
    expect(v.mount("body", Component)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    expect(VNext.mount("body", Component2)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
  });

  benchmark("Valyrian 5.0.8", () => {
    v.mount("body", Component);
  });

  benchmark("Valyrian next", () => {
    VNext.mount("body", Component2);
  });
});

compare.only("Mount and update: Update", () => {
  let date = new Date();
  let Component = () => v("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);
  let Component2 = () => VNext("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);

  before(() => {
    expect(v.mount("body", Component)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    expect(VNext.mount("body", Component2)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    expect(v.update()).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    expect(VNext.update()).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
  });

  benchmark("Valyrian 5.0.8", () => {
    v.update();
  });

  benchmark("Valyrian next", () => {
    VNext.update();
  });
});

compare.only("Mount and update: Render list", () => {
  let set = [1, 2, 3, 4, 5];
  let tests = [
    { name: "Removed at the end", set: [1, 2, 3, 4] }, // Removed at the end
    { name: "Removed at the start", set: [2, 3, 4, 5] }, // Remmoved at the start
    { name: "Removed at the center", set: [1, 3, 5] }, // Removed at the center
    { name: "Added at the end", set: [1, 2, 3, 4, 5, 6] }, // Added at the end
    { name: "Added at the start", set: [6, 1, 2, 3, 4, 5] }, // Added at the start
    { name: "Added at the center", set: [1, 2, 6, 3, 4, 5] }, // Added at the center
    { name: "Reversed", set: [5, 4, 3, 2, 1] }, // Reversed
    { name: "Switch positions", set: [1, 4, 3, 2, 5] }, // Switch positions,
    { name: "Mixed positions", set: [1, 3, 2, 6, 5, 4] },
    { name: "Replaced with undefined", set: [1, 3, 2, , 5, 4] },
    {
      name: "Added, remove and replaced with undefined",
      set: [6, 7, 8, 9, , 10]
    }
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
      let component = () => (
        <ul>
          {keys.map((key) => {
            if (key) {
              return <li>{key}</li>;
            }
          })}
        </ul>
      );

      let before = v.mount("body", component);
      keys = [...test.set];
      v.unMount();
      let after = v.mount("body", component);

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
      VNext.unMount();
      let after = VNext.mount("body", component);

      let afterString = getString(test.set);

      expect(before).toEqual(beforeString);
      expect(after).toEqual(afterString);
    });
  });

  benchmark("v", () => {
    tests.forEach((test) => {
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
      keys = [...test.set];
      v.update();
    });
  });

  benchmark("VNext", () => {
    tests.forEach((test) => {
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
      keys = [...test.set];
      VNext.update();
    });
  });
});

compare.only("Mount and update: Render keyed list", () => {
  let set = [1, 2, 3, 4, 5];
  let tests = [
    { name: "Removed at the end", set: [1, 2, 3, 4] }, // Removed at the end
    { name: "Removed at the start", set: [2, 3, 4, 5] }, // Remmoved at the start
    { name: "Removed at the center", set: [1, 3, 5] }, // Removed at the center
    { name: "Added at the end", set: [1, 2, 3, 4, 5, 6] }, // Added at the end
    { name: "Added at the start", set: [6, 1, 2, 3, 4, 5] }, // Added at the start
    { name: "Added at the center", set: [1, 2, 6, 3, 4, 5] }, // Added at the center
    { name: "Reversed", set: [5, 4, 3, 2, 1] }, // Reversed
    { name: "Switch positions", set: [1, 4, 3, 2, 5] }, // Switch positions,
    { name: "Mixed positions", set: [1, 3, 2, 6, 5, 4] },
    { name: "Replaced with undefined", set: [1, 3, 2, , 5, 4] },
    {
      name: "Added, remove and replaced with undefined",
      set: [6, 7, 8, 9, , 10]
    }
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
      let component = () => (
        <ul>
          {keys.map((key) => {
            if (key) {
              return <li key={key}>{key}</li>;
            }
          })}
        </ul>
      );

      let before = v.mount("body", component);
      keys = [...test.set];
      v.unMount();
      let after = v.mount("body", component);

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

      let before = VNext.mount("body", component);
      keys = [...test.set];
      VNext.unMount();
      let after = VNext.mount("body", component);

      let afterString = getString(test.set);

      expect(before).toEqual(beforeString);
      expect(after).toEqual(afterString);
    });
  });

  benchmark("v", () => {
    tests.forEach((test) => {
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

      v.mount("body", component);
      keys = [...test.set];
      v.update();
    });
  });

  benchmark("VNext", () => {
    tests.forEach((test) => {
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
      keys = [...test.set];
      VNext.update();
    });
  });
});
