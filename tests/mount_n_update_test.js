import test from 'ava';
import expect from 'expect';
import '../lib';
import nodePlugin from '../plugins/node';
v.use(nodePlugin);

test.serial('Mount and update with POJO component', async (t) => {
  let Component = {
    world: 'World',
    id: 'example',
    view() {
      return <div id={Component.id}>Hello {Component.world}</div>;
    }
  };

  // Should identify the object as a component
  v(Component);

  let result = {};
  result.before = await v.mount('body', Component);
  Component.world = 'John Doe';
  result.after = await v.update();

  expect(result).toEqual({
    before: '<div id="example">Hello World</div>',
    after: '<div id="example">Hello John Doe</div>'
  });
});

test.serial('Mount and update with functional statefull component', async (t) => {
  let Component = function () {
    return <div id={this.id}>Hello {this.world}</div>;
  };
  let state = {
    world: 'World',
    id: 'example'
  };

  // Should identify the function as a component
  v(Component, state);

  let result = {};
  result.before = await v.mount('body', Component);
  Component.world = 'John Doe';
  result.after = await v.update();

  expect(result).toEqual({
    before: '<div id="example">Hello World</div>',
    after: '<div id="example">Hello John Doe</div>'
  });
});

test.serial('Mount and update with functional stateless component', async (t) => {
  let SubComponent = (props) => <div id={props.id}>Hello {props.world}</div>;
  let state = {
    world: 'World',
    id: 'example'
  };
  let Component = function () {
    return <SubComponent {...state} />;
  };

  // Should identify the function as a component
  v(SubComponent);
  v(Component);

  let result = {};
  result.before = await v.mount('body', Component);
  state.world = 'John Doe';
  result.after = await v.update();

  expect(result).toEqual({
    before: '<div id="example">Hello World</div>',
    after: '<div id="example">Hello John Doe</div>'
  });
});

test.serial('Handle multiple update calls', async (t) => {
  let Component = {
    world: 'World',
    id: 'example',
    view() {
      return <div id={Component.id}>Hello {Component.world}</div>;
    }
  };

  // Should identify the object as a component
  v(Component);

  let result = {};
  result.before = await v.mount('body', Component);
  Component.world = 'John Doe';
  result.after = await v.update();
  result.afteragain = await v.update();

  expect(result).toEqual({
    before: '<div id="example">Hello World</div>',
    after: '<div id="example">Hello John Doe</div>',
    afteragain: '<div id="example">Hello John Doe</div>'
  });
});