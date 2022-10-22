import "valyrian.js/node";

import { mount, trust, update, v } from "valyrian.js";

import expect from "expect";

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

    result.before = mount("body", Component);
    Component.world = "John Doe";
    result.after = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Mount and update with functional stateful component", () => {
    function Component() {
      return <div id={this.id}>Hello {this.world}</div>;
    }
    Component.world = "World";
    Component.id = "example";

    let result = {};

    result.before = mount("body", Component);
    Component.world = "John Doe";
    result.after = update();

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

    result.before = mount("body", Component);
    state.world = "John Doe";
    result.after = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Mount and update with Vnode Component", () => {
    let Component = ({ hello }, ...children) => (
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

    let ComponentInstance = new Component();

    let result = {};

    result.before = mount("body", ComponentInstance);
    ComponentInstance.world = "John Doe";
    result.after = update();

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
    let Component = ({ props }) => <div id={props.id}>Hello {props.world}</div>;
    let props = {
      world: "World",
      id: "example"
    };

    let result = {};

    let app = <Component props={props} />;

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
    let Component = () => (text ? "Hello world" : <div>Hello world</div>);

    let result = {};

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
    let Component = () => (text ? "Hello world" : <div>Hello world</div>);

    let result = {};

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
    let Component = () => <div disabled={disabled}>Hello world</div>;

    let result = {};

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
    let Component = () => <div disabled={disabled}>Hello world</div>;

    let result = {};

    result.before = mount("body", Component);
    disabled = true;
    result.after = update();

    expect(result).toEqual({
      before: "<div>Hello world</div>",
      after: '<div disabled="true">Hello world</div>'
    });
  });

  it("Should handle different types of data", () => {
    let date = new Date();

    let Component = () => v("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);
    expect(mount("body", Component)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
  });

  it("Should handle svgs", () => {
    let svg =
      // eslint-disable-next-line max-len
      '<svg enable-background="new 0 0 320.523 320.523" version="1.1" viewBox="0 0 320.523 320.523" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="m254.41 225.55l-69.147-69.148 65.289-65.29-91.113-91.113v130.58l-82.726-82.726-10.607 10.606 93.333 93.333v9.222l-93.333 93.333 10.606 10.606 82.726-82.726v138.3l94.972-94.972zm-79.971-189.34l54.9 54.9-54.683 54.683-0.218-0.217 1e-3 -109.37zm0 131.01l0.218-0.217 58.541 58.542-58.759 58.759v-117.08z"></path></svg>';
    let Component = () => trust(svg);

    // eslint-disable-next-line max-len
    expect(mount("body", Component)).toEqual(svg);
  });

  it("should fail silently if try to update before mount", () => {
    let Component = () => <div>Hello world</div>;
    update();
  });

  it("should handle text vnode as new node", () => {
    let vnode = trust("<span>Some text</span>");
    let component = () => vnode;
    let result = mount("body", component);
    expect(result).toEqual("<span>Some text</span>");

    vnode.children = ["Other text"];
    let result2 = update();
    expect(result2).toEqual("<span>Some text</span>");
  });

  it("should handle the passing of state with the state property", () => {
    let state = { foo: "bar" };
    let component = () => (
      <div state={state} onupdate={(newNode, oldNode) => expect(newNode.props.state).toEqual(oldNode.props.state)} />
    );

    let result = mount("body", component);
    expect(result).toEqual("<div></div>");

    let result2 = update();
    expect(result2).toEqual("<div></div>");
  });

  it("should allow to use fragments", () => {
    let Component = () => (
      <>
        <span>Hello</span>
        <span>World</span>
      </>
    );

    let result = mount("body", Component);
    expect(result).toEqual("<span>Hello</span><span>World</span>");
  });

  it("should allow to use fragments in subcomponents", () => {
    let SubComponent = () => (
      <>
        <span>Hello</span>
        <span>World</span>
      </>
    );

    let Component = () => (
      <>
        <div>
          Simon says <SubComponent />
        </div>
      </>
    );

    let result = mount("body", Component);
    expect(result).toEqual("<div>Simon says <span>Hello</span><span>World</span></div>");
  });

  it("should allow to mount direct text and vnode", () => {
    // Direct text
    let result1 = mount("body", "Hello world");

    // Direct component that return text
    let result2 = mount("body", () => "Hello world 2");

    // Direct vnode
    let result3 = mount("body", <div>Hello world 3</div>);

    // Direct component that return vnode
    let result4 = mount("body", () => <div>Hello world 4</div>);

    let Component = () => <span>Hello world 5</span>;

    // Vnode component
    let result5 = mount("body", <Component />);

    // Direct fragment
    let result6 = mount(
      "body",
      <>
        <Component /> - 6
      </>
    );

    // Direct component that return fragment
    let result7 = mount("body", () => (
      <>
        <Component /> - 7
      </>
    ));

    // POJO component
    let result8 = mount("body", {
      view() {
        return <div>Hello world 8</div>;
      }
    });

    class ClassComponent {
      view() {
        return <div>Hello world 9</div>;
      }
    }

    let InstanceClassComponent = new ClassComponent();

    // Class component
    let result9 = mount("body", InstanceClassComponent);

    // Vnode component from class component
    let result10 = mount("body", <InstanceClassComponent />);

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
});
