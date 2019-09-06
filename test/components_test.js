
import expect from "expect";
import '../lib';

describe('Components', () => {

  let expected = {
    "children": ["Hello ", "World"],
    "isSVG": false,
    "name": "div",
    "props": {
      "id": "example"
    }
  };

  it("POJO component", () => {
    let Component = {
      world: "World",
      id: "example",
      view() {
        return <div id={Component.id}>Hello {Component.world}</div>;
      }
    };

    expect(v(Component)).toEqual(expected);
    expect(<Component />).toEqual(expected);
  });

  it("Functional stateful component", () => {
    let Component = function () {
      return <div id={this.id}>Hello {this.world}</div>;
    };
    let state = {
      world: "World",
      id: "example"
    };

    // Initialize as component and assign state
    v.addState(Component, state);

    expect(v(Component)).toEqual(expected);
    expect(<Component />).toEqual(expected);
  });

  it("Functional stateless component", () => {
    let Component = (props, world) => <div id={props.id}>Hello {world}</div>;

    expect(v(Component, { id: "example" }, "World")).toEqual(expected);
    expect(<Component id="example">World</Component>).toEqual(expected);
  });

  it("Functional stateless component antipattern", () => {
    let state = {
      world: "World",
      id: "example"
    };
    let Component = () => <div id={state.id}>Hello {state.world}</div>;

    expect(v(Component)).toEqual(expected);
    expect(<Component>World</Component>).toEqual(expected);
  });

  it("Create POJO component", t => {
    let Component = {
      world: "World",
      id: "example",
      view() {
        return <div id={Component.id}>Hello {Component.world}</div>;
      }
    };

    expect(typeof Component.view).toEqual("function");
  });

  it("Create Functional stateful component", t => {
    let Component = function () {
      return <div id={this.id}>Hello {this.world}</div>;
    };
    let state = {
      world: "World",
      id: "example"
    };

    // Should identify the function as a component
    v.addState(Component, state);

    expect(typeof Component.view).toEqual("function");
    expect(Component.world).toEqual(state.world);
    expect(Component.id).toEqual(state.id);
  });

  it("Create Functional stateless component", t => {
    let Component = props => <div id={props.id}>Hello {props.world}</div>;

    // Should identify the function as a component
    v(Component, { id: "id", world: "mundo" });

    expect(typeof Component.view).toEqual("function");
  });
});
