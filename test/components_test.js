
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

  it("Create Class component", () => {
    class Component {
      get world() {
        return 'World';
      }
      get id() {
        return 'example';
      }
      view() {
        return <div id={this.id}>Hello {this.world}</div>;
      }
    }

    let component = new Component();

    let result = v(component);

    expect(result).toEqual({
      name: 'div',
      props: {id: 'example'},
      children: ['Hello ', 'World'],
      isSVG: false
    });

    expect(typeof component.view).toEqual("function");
  });

  it("Create POJO component", () => {
    let Component = {
      world: "World",
      id: "example",
      view() {
        return <div id={Component.id}>Hello {Component.world}</div>;
      }
    };

    let result = v(Component);

    expect(result).toEqual({
      name: 'div',
      props: {id: 'example'},
      children: ['Hello ', 'World'],
      isSVG: false
    });

    expect(typeof Component.view).toEqual("function");
  });

  it("Create Functional stateful component", () => {
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

    let result = v(Component);

    expect(result).toEqual({
      name: 'div',
      props: {id: 'example'},
      children: ['Hello ', 'World'],
      isSVG: false
    });
  });

  it("Create Functional stateless component", () => {
    let Component = props => <div id={props.id}>Hello {props.world}</div>;

    // Should identify the function as a component
    let result = v(Component, { id: "id", world: "mundo" });

    expect(result).toEqual({
      name: 'div',
      props: {id: 'id'},
      children: ['Hello ', 'mundo'],
      isSVG: false
    });

    expect(typeof Component.view).toEqual("function");
  });
});
