import "../lib";

import expect from "expect";
import nodePlugin from "../plugins/node";

v.usePlugin(nodePlugin);

describe("Mount and update", () => {
  it("Mount and update with POJO component", () => {
    let Component = {
      world: "World",
      id: "example",
      view() {
        return <div id={this.id}>Hello {this.world}</div>;
      }
    };

    let result = {};

    result.before = v.mount("body", Component);
    Component.world = "John Doe";
    result.after = v.update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Mount and update with functional stateful component", () => {
    let Component = function () {
      return <div id={this.id}>Hello {this.world}</div>;
    };
    Component.world = "World";
    Component.id = "example";

    let result = {};

    result.before = v.mount("body", Component);
    Component.world = "John Doe";
    result.after = v.update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Mount and update with functional stateless subcomponent", () => {
    let SubComponent = (props) => <div id={props.id}>Hello {props.world}</div>;
    let state = {
      world: "World",
      id: "example"
    };
    let Component = function () {
      return <SubComponent {...state} />;
    };

    let result = {};

    result.before = v.mount("body", Component);
    state.world = "John Doe";
    result.after = v.update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Handle multiple update calls", () => {
    let Component = {
      world: "World",
      id: "example",
      view() {
        return <div id={this.id}>Hello {this.world}</div>;
      }
    };
    let result = {};

    result.before = v.mount("body", Component);
    Component.world = "John Doe";
    result.after = v.update();
    result.afteragain = v.update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>',
      afteragain: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Antipattern: Mount and update with functional stateless component", () => {
    let Component = (props) => <div id={props.id}>Hello {props.world}</div>;
    let props = {
      world: "World",
      id: "example"
    };

    let result = {};

    result.before = v.mount("body", Component, props);
    props.world = "John Doe";
    result.after = v.update(props);

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Should update text node with dom node", () => {
    let text = true;
    let Component = () => (text ? "Hello world" : <div>Hello world</div>);

    let result = {};

    result.before = v.mount("body", Component);
    text = false;
    result.after = v.update();

    expect(result).toEqual({
      before: "Hello world",
      after: "<div>Hello world</div>"
    });
  });

  it("Should update dom node with text node", () => {
    let text = false;
    let Component = () => (text ? "Hello world" : <div>Hello world</div>);

    let result = {};

    result.before = v.mount("body", Component);
    text = true;
    result.after = v.update();

    expect(result).toEqual({
      before: "<div>Hello world</div>",
      after: "Hello world"
    });
  });

  it("Should remove property if it is set to false", () => {
    let disabled = true;
    let Component = () => <div disabled={disabled}>Hello world</div>;

    let result = {};

    result.before = v.mount("body", Component);
    disabled = false;
    result.after = v.update();

    expect(result).toEqual({
      before: '<div disabled="true">Hello world</div>',
      after: "<div>Hello world</div>"
    });
  });

  it("Should not add property if it is set to false on first render", () => {
    let disabled = false;
    let Component = () => <div disabled={disabled}>Hello world</div>;

    let result = {};

    result.before = v.mount("body", Component);
    disabled = true;
    result.after = v.update();

    expect(result).toEqual({
      before: "<div>Hello world</div>",
      after: '<div disabled="true">Hello world</div>'
    });
  });

  it("Should handle different types of data", () => {
    let date = new Date();

    let Component = () => v("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);
    expect(v.mount("body", Component)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
  });

  it("Should handle svgs", () => {
    let svg =
      // eslint-disable-next-line max-len
      '<svg enable-background="new 0 0 320.523 320.523" version="1.1" viewBox="0 0 320.523 320.523" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="m254.41 225.55l-69.147-69.148 65.289-65.29-91.113-91.113v130.58l-82.726-82.726-10.607 10.606 93.333 93.333v9.222l-93.333 93.333 10.606 10.606 82.726-82.726v138.3l94.972-94.972zm-79.971-189.34l54.9 54.9-54.683 54.683-0.218-0.217 1e-3 -109.37zm0 131.01l0.218-0.217 58.541 58.542-58.759 58.759v-117.08z"></path></svg>';
    let Component = () => v.trust(svg);

    // eslint-disable-next-line max-len
    expect(v.mount("body", Component)).toEqual(svg);
  });

  it("should fail silently if try to update before mount", () => {
    v.unMount();
    v.update();
  });

  it("should handle text vnode as new node", () => {
    let vnode = v.trust("<span>Some text</span>");
    let component = () => vnode;
    let result = v.mount("body", component);
    expect(result).toEqual("<span>Some text</span>");

    vnode.children = ["Other text"];
    let result2 = v.update();
    expect(result2).toEqual("<span>Some text</span>");
  });

  it("should handle the passing of data with the data property", () => {
    let data = { foo: "bar" };
    let onupdate = (newNode, oldNode) => expect(newNode.props.data).toEqual(oldNode.props.data);
    let component = () => <div data={data} onupdate={onupdate} />;

    let result = v.mount("body", component);
    expect(result).toEqual("<div></div>");

    let result2 = v.update();
    expect(result2).toEqual("<div></div>");
  });

  it("should create another v instance using the v.newInstance method", () => {
    // We create a new instance
    let v2 = v.newInstance();

    let count = 0;
    let component = () => `Hello world ${count}`;

    // Get the first render
    let result1 = v.mount("body", component);
    let result2 = v2.mount("body", component);

    // Bot updates must be equal
    expect(result1).toEqual("Hello world 0");
    expect(result2).toEqual("Hello world 0");

    // We increment the counter and unMount the first instance
    count++;
    v.unMount();

    // Get the second render
    let result3 = v.update();
    let result4 = v2.update();

    // For the first instance should be '' because component has been unMounted;
    expect(result3).toEqual("");

    // For the second instance should be 'Hello world 1' because it is still mounted
    expect(result4).toEqual("Hello world 1");
  });
});

describe.skip("performance test", () => {
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
    it("Render list: " + test.name, () => {
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

      for (let i = 100000; i--; ) {
        v.unMount();
        v.mount("body", component);
      }
    });
  });
});
