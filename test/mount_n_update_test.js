/* eslint-disable max-lines-per-function */
import "valyrian.js/node";

import { mount, trust, update, v, unmount } from "valyrian.js";

import expect from "expect";

describe("Mount and update", () => {
  it("Mount and update with POJO component", () => {
    const Component = {
      world: "World",
      id: "example",
      view() {
        return <div id={Component.id}>Hello {Component.world}</div>;
      }
    };

    const result = {};

    result.before = mount("body", Component.view);
    Component.world = "John Doe";
    result.after = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Mount and update with functional stateful component", () => {
    function Component() {
      return <div id={Component.id}>Hello {Component.world}</div>;
    }
    Component.world = "World";
    Component.id = "example";

    const result = {};

    result.before = mount("body", Component);
    Component.world = "John Doe";
    result.after = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Mount and update with functional stateless subcomponent", () => {
    const SubComponent = (props) => <div id={props.id}>Hello {props.world}</div>;
    const state = {
      world: "World",
      id: "example"
    };
    const Component = function () {
      return <SubComponent {...state} />;
    };

    const result = {};

    result.before = mount("body", Component);
    state.world = "John Doe";
    result.after = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Mount and update with Vnode Component", () => {
    const Component = ({ hello }, ...children) => (
      <div id="example">
        <span>Hello World</span>
        <span>Hello {hello}</span>
        {...children}
      </div>
    );

    expect(
      mount(
        "body",
        <Component hello="world">
          <span>Hello John</span>
          <span>Hello Jane</span>
        </Component>
      )
    ).toEqual(
      '<div id="example"><span>Hello World</span><span>Hello world</span><span>Hello John</span><span>Hello Jane</span></div>'
    );
  });

  it("Mount with class component", () => {
    class Component {
      constructor() {
        this.id = "example";
        this.world = "World";
      }
      view() {
        return <div id={this.id}>Hello {this.world}</div>;
      }
    }

    const ComponentInstance = new Component();

    const result = {};

    result.before = mount("body", ComponentInstance);
    ComponentInstance.world = "John Doe";
    result.after = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Mount with non component", () => {
    const result = mount("body", "Hello world");
    expect(result).toEqual("Hello world");

    const result2 = mount("body", 123);
    expect(result2).toEqual("123");

    const result3 = mount("body", new Date(Date.UTC(2012, 11, 20, 3, 0, 0)));
    expect(result3).toEqual("Wed Dec 19 2012 21:00:00 GMT-0600 (hora estándar central)");
  });

  it("Handle multiple update calls", () => {
    const Component = {
      world: "World",
      id: "example",
      view() {
        return <div id={Component.id}>Hello {Component.world}</div>;
      }
    };
    const result = {};

    result.before = mount("body", Component);
    Component.world = "John Doe";
    result.after = update();
    result.afteragain = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>',
      afteragain: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Antipattern: Mount and update with functional stateless component", () => {
    const Component = ({ props }) => <div id={props.id}>Hello {props.world}</div>;
    const props = {
      world: "World",
      id: "example"
    };

    const result = {};

    const app = <Component props={props} />;

    result.before = mount("body", app);
    props.world = "John Doe";
    result.after = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Should update text node with dom node", () => {
    let text = true;
    const Component = () => (text ? "Hello world" : <div>Hello world</div>);

    const result = {};

    result.before = mount("body", Component);
    text = false;
    result.after = update();

    expect(result).toEqual({
      before: "Hello world",
      after: "<div>Hello world</div>"
    });
  });

  it("Should update dom node with text node", () => {
    let text = false;
    const Component = () => (text ? "Hello world" : <div>Hello world</div>);

    const result = {};

    result.before = mount("body", Component);
    text = true;
    result.after = update();

    expect(result).toEqual({
      before: "<div>Hello world</div>",
      after: "Hello world"
    });
  });

  it("Should remove property if it is set to false", () => {
    let disabled = true;
    const Component = () => <div disabled={disabled}>Hello world</div>;

    const result = {};

    result.before = mount("body", Component);
    disabled = false;
    result.after = update();

    expect(result).toEqual({
      before: '<div disabled="true">Hello world</div>',
      after: "<div>Hello world</div>"
    });
  });

  it("Should not add property if it is set to false on first render", () => {
    let disabled = false;
    const Component = () => <div disabled={disabled}>Hello world</div>;

    const result = {};

    result.before = mount("body", Component);
    disabled = true;
    result.after = update();

    expect(result).toEqual({
      before: "<div>Hello world</div>",
      after: '<div disabled="true">Hello world</div>'
    });
  });

  it("Should handle different types of data", () => {
    const date = new Date();

    const Component = () => v("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);
    expect(mount("body", Component)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
  });

  it("Should handle svgs", () => {
    const svg =
      // eslint-disable-next-line max-len
      '<svg enable-background="new 0 0 320.523 320.523" version="1.1" viewBox="0 0 320.523 320.523" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="m254.41 225.55l-69.147-69.148 65.289-65.29-91.113-91.113v130.58l-82.726-82.726-10.607 10.606 93.333 93.333v9.222l-93.333 93.333 10.606 10.606 82.726-82.726v138.3l94.972-94.972zm-79.971-189.34l54.9 54.9-54.683 54.683-0.218-0.217 1e-3 -109.37zm0 131.01l0.218-0.217 58.541 58.542-58.759 58.759v-117.08z"></path></svg>';
    const Component = () => trust(svg);

    // eslint-disable-next-line max-len
    expect(mount("body", Component)).toEqual(svg);
  });

  it("should fail silently if try to update before mount", () => {
    unmount();
    update();
  });

  it("should handle text vnode as new node", () => {
    const vnode = trust("<span>Some text</span>");
    const component = () => vnode;
    const result = mount("body", component);
    expect(result).toEqual("<span>Some text</span>");

    vnode.children = ["Other text"];
    const result2 = update();
    expect(result2).toEqual("<span>Some text</span>");
  });

  it("should handle the passing of state with the state property", () => {
    const state = { foo: "bar" };
    const component = () => (
      <div state={state} onupdate={(newNode, oldNode) => expect(newNode.props.state).toEqual(oldNode.props.state)} />
    );

    const result = mount("body", component);
    expect(result).toEqual("<div></div>");

    const result2 = update();
    expect(result2).toEqual("<div></div>");
  });

  it("should allow to use fragments", () => {
    const Component = () => (
      <>
        <span>Hello</span>
        <span>World</span>
      </>
    );

    const result = mount("body", Component);
    expect(result).toEqual("<span>Hello</span><span>World</span>");
  });

  it("should allow to use fragments in subcomponents", () => {
    const SubComponent = () => (
      <>
        <span>Hello</span>
        <span>World</span>
      </>
    );

    const Component = () => (
      <>
        <div>
          Simon says <SubComponent />
        </div>
      </>
    );

    const result = mount("body", Component);
    expect(result).toEqual("<div>Simon says <span>Hello</span><span>World</span></div>");
  });

  it("should allow to mount direct text and vnode", () => {
    // Direct text
    const result1 = mount("body", "Hello world");

    // Direct component that return text
    const result2 = mount("body", () => "Hello world 2");

    // Direct vnode
    const result3 = mount("body", <div>Hello world 3</div>);

    // Direct component that return vnode
    const result4 = mount("body", () => <div>Hello world 4</div>);

    const Component = () => <span>Hello world 5</span>;

    // Vnode component
    const result5 = mount("body", <Component />);

    // Direct fragment
    const result6 = mount(
      "body",
      <>
        <Component /> - 6
      </>
    );

    // Direct component that return fragment
    const result7 = mount("body", () => (
      <>
        <Component /> - 7
      </>
    ));

    // POJO component
    const pojo = {
      view() {
        return <div>Hello world 8</div>;
      }
    };
    const result8 = mount("body", pojo.view);

    class ClassComponent {
      view() {
        return <div>Hello world 9</div>;
      }
    }

    const InstanceClassComponent = new ClassComponent();

    // Class component
    const result9 = mount("body", InstanceClassComponent);

    // Vnode component from class component
    const result10 = mount("body", <InstanceClassComponent />);

    expect(result1).toEqual("Hello world");
    expect(result2).toEqual("Hello world 2");
    expect(result3).toEqual("<div>Hello world 3</div>");
    expect(result4).toEqual("<div>Hello world 4</div>");
    expect(result5).toEqual("<span>Hello world 5</span>");
    expect(result6).toEqual("<span>Hello world 5</span> - 6");
    expect(result7).toEqual("<span>Hello world 5</span> - 7");
    expect(result8).toEqual("<div>Hello world 8</div>");
    expect(result9).toEqual("<div>Hello world 9</div>");
    expect(result10).toEqual("<div>Hello world 9</div>");
  });

  it("should test deepley nested components", () => {
    const ChildComponent = () => (
      <>
        <div>Hello World</div>Hello 2
      </>
    );
    const Component = () => (
      <>
        <div>
          <span>Hello</span>
          <span>World</span>
          <ChildComponent />
        </div>
        <div>
          <span>Hello</span>
          <span>World</span>
          <ChildComponent />
        </div>
      </>
    );
    const result = mount("body", Component);

    expect(result).toEqual(
      "<div><span>Hello</span><span>World</span><div>Hello World</div>Hello 2</div><div><span>Hello</span><span>World</span><div>Hello World</div>Hello 2</div>"
    );

    /* for (let i = 0; i < 1000000; i++) {
      update();
    } */
  });
});

describe("Benchmark Test: Mount and update", function () {
  beforeEach(unmount);
  afterEach(unmount);

  it("should benchmark mount and update times", function () {
    const iterations = 1000;
    const createComponent = (index) =>
      v("div", { id: `test-${index}`, class: `class-${index}` }, [
        v("span", { "data-index": index }, `Texto del nodo ${index}`),
        v("input", { type: "text", value: `input-${index}` })
      ]);

    const children = [];
    for (let i = 0; i < iterations; i++) {
      children.push(createComponent(i));
    }
    function Component() {
      return v("div", null, children);
    }

    // eslint-disable-next-line no-console
    console.time("Mount");
    mount("body", Component);
    // eslint-disable-next-line no-console
    console.timeEnd("Mount");

    children.length = 0;
    // eslint-disable-next-line no-console
    console.time("Update");
    for (let i = 0; i < iterations; i++) {
      children.push(createComponent(i));
      update();
    }
    // eslint-disable-next-line no-console
    console.timeEnd("Update");
  });
});
