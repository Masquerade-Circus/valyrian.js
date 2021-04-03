let { compare, benchmark, before } = require("@masquerade-circus/bench-test");

import "../lib/index";

import expect from "expect";
import nodePlugin from "../plugins/node";
import v from "../lib/index-old";
import vOld from "../lib/index-old";

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

vOld.usePlugin(nodePlugin);

compare("Mount and update: Mount", () => {
  let date = new Date();
  let Component = () => vOld("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);
  let Component2 = () => VNext("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);

  before(() => {
    expect(vOld.mount("body", Component)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    expect(VNext.mount("body", Component2)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
  });

  benchmark("Valyrian 5.0.8", () => {
    vOld.mount("body", Component);
  });

  benchmark("Valyrian next", () => {
    VNext.mount("body", Component2);
  });
});

compare("Mount and update: Update", () => {
  let date = new Date();
  let Component = () => vOld("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);
  let Component2 = () => VNext("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);

  before(() => {
    expect(vOld.mount("body", Component)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    expect(vOld.update()).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);

    expect(VNext.mount("body", Component2)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
    expect(VNext.update()).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
  });

  benchmark("Valyrian 5.0.8", () => {
    vOld.update();
  });

  benchmark("Valyrian next", () => {
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
      vOld.unMount();
      let after = vOld.mount("body", component);

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

  benchmark("vOld", () => {
    let keys = data.before;
    let component = () =>
      vOld(
        "ul",
        null,
        keys.map((props) => vOld("li", props, props.data))
      );

    vOld.mount("body", component);
    keys = data.update1;
    vOld.update();
    keys = data.update2;
    vOld.update();
  });

  benchmark("VNext", () => {
    let keys = data.before;
    let component = () =>
      VNext(
        "ul",
        null,
        keys.map((props) => VNext("li", props, props.data))
      );

    VNext.mount("body", component);
    keys = data.update1;
    VNext.update();
    keys = data.update2;
    VNext.update();
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

      let before = vOld.mount("body", component);
      keys = [...test.set];
      vOld.unMount();
      let after = vOld.mount("body", component);

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

  benchmark("vOld", () => {
    let keys = data.before;
    let component = () =>
      vOld(
        "ul",
        null,
        keys.map((props) => vOld("li", { ...props, key: props.data }, props.data))
      );

    vOld.mount("body", component);
    keys = data.update1;
    vOld.update();
    keys = data.update2;
    vOld.update();
  });

  benchmark("VNext", () => {
    let keys = data.before;
    let component = () =>
      VNext(
        "ul",
        null,
        keys.map((props) => VNext("li", { ...props, key: props.data }, props.data))
      );

    VNext.mount("body", component);
    keys = data.update1;
    VNext.update();
    keys = data.update2;
    VNext.update();
  });
});
