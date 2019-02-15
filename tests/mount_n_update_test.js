import test from "ava";
import expect from "expect";
import "../lib";
import nodePlugin from "../plugins/node";
v.use(nodePlugin);

test.serial("Mount and update with POJO component", t => {
  let Component = {
    world: "World",
    id: "example",
    view() {
      return <div id={Component.id}>Hello {Component.world}</div>;
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

test.serial("Mount and update with functional stateful component", t => {
  let Component = function () {
    return <div id={this.id}>Hello {this.world}</div>;
  };
  let state = {
    world: "World",
    id: "example"
  };

  // Should identify the function as a component
  v.addState(Component, state);

  let result = {};
  result.before = v.mount("body", Component);
  Component.world = "John Doe";
  result.after = v.update();

  expect(result).toEqual({
    before: '<div id="example">Hello World</div>',
    after: '<div id="example">Hello John Doe</div>'
  });
});

test.serial("Mount and update with functional stateless subcomponent", t => {
  let SubComponent = props => <div id={props.id}>Hello {props.world}</div>;
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

test.serial("Handle multiple update calls", t => {
  let Component = {
    world: "World",
    id: "example",
    view() {
      return <div id={Component.id}>Hello {Component.world}</div>;
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

test.serial("Antipattern: Mount and update with functional stateless component", t => {
  let Component = props => <div id={props.id}>Hello {props.world}</div>;
  let props = {
    world: "World",
    id: "example"
  };

  let result = {};
  result.before = v.mount("body", Component, props);
  props.world = "John Doe";
  result.after = v.update(Component, props);

  expect(result).toEqual({
    before: '<div id="example">Hello World</div>',
    after: '<div id="example">Hello John Doe</div>'
  });
});

test.serial("Antipattern: Mount and update with functional stateless component using only state", t => {
  let Component = props => <div id={props.id}>Hello {props.world}</div>;
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
