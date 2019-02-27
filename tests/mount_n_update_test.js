import test from 'ava';
import expect from 'expect';
import '../lib';
import nodePlugin from '../plugins/node';
v.use(nodePlugin);

test.serial('Mount and update with POJO component', (t) => {
  let Component = {
    world: 'World',
    id: 'example',
    view() {
      return <div id={Component.id}>Hello {Component.world}</div>;
    }
  };

  let result = {};
  result.before = v.mount('body', Component);
  Component.world = 'John Doe';
  result.after = v.update();

  expect(result).toEqual({
    before: '<div id="example">Hello World</div>',
    after: '<div id="example">Hello John Doe</div>'
  });
});

test.serial('Mount and update with functional stateful component', (t) => {
  let Component = function () {
    return <div id={this.id}>Hello {this.world}</div>;
  };
  let state = {
    world: 'World',
    id: 'example'
  };

  // Should identify the function as a component
  v.addState(Component, state);

  let result = {};
  result.before = v.mount('body', Component);
  Component.world = 'John Doe';
  result.after = v.update();

  expect(result).toEqual({
    before: '<div id="example">Hello World</div>',
    after: '<div id="example">Hello John Doe</div>'
  });
});

test.serial('Mount and update with functional stateless subcomponent', (t) => {
  let SubComponent = (props) => <div id={props.id}>Hello {props.world}</div>;
  let state = {
    world: 'World',
    id: 'example'
  };
  let Component = function () {
    return <SubComponent {...state} />;
  };

  let result = {};
  result.before = v.mount('body', Component);
  state.world = 'John Doe';
  result.after = v.update();

  expect(result).toEqual({
    before: '<div id="example">Hello World</div>',
    after: '<div id="example">Hello John Doe</div>'
  });
});

test.serial('Handle multiple update calls', (t) => {
  let Component = {
    world: 'World',
    id: 'example',
    view() {
      return <div id={Component.id}>Hello {Component.world}</div>;
    }
  };

  let result = {};
  result.before = v.mount('body', Component);
  Component.world = 'John Doe';
  result.after = v.update();
  result.afteragain = v.update();

  expect(result).toEqual({
    before: '<div id="example">Hello World</div>',
    after: '<div id="example">Hello John Doe</div>',
    afteragain: '<div id="example">Hello John Doe</div>'
  });
});

test.serial('Antipattern: Mount and update with functional stateless component', (t) => {
  let Component = (props) => <div id={props.id}>Hello {props.world}</div>;
  let props = {
    world: 'World',
    id: 'example'
  };

  let result = {};
  result.before = v.mount('body', Component, props);
  props.world = 'John Doe';
  result.after = v.update(props);

  expect(result).toEqual({
    before: '<div id="example">Hello World</div>',
    after: '<div id="example">Hello John Doe</div>'
  });
});

test.serial('Should update text node with dom node', (t) => {
  let text = true;
  let Component = () => (text ? 'Hello world' : <div>Hello world</div>);

  let result = {};
  result.before = v.mount('body', Component);
  text = false;
  result.after = v.update();

  expect(result).toEqual({
    before: 'Hello world',
    after: '<div>Hello world</div>'
  });
});

test.serial('Should update dom node with text node', (t) => {
  let text = false;
  let Component = () => (text ? 'Hello world' : <div>Hello world</div>);

  let result = {};
  result.before = v.mount('body', Component);
  text = true;
  result.after = v.update();

  expect(result).toEqual({
    before: '<div>Hello world</div>',
    after: 'Hello world'
  });
});

test.serial('Should handle different types of data', (t) => {
  let date = new Date();
  let Component = () => v('div', null, [null, 'Hello', , 1, date, { hello: 'world' }, ['Hello']]);
  expect(v.mount('body', Component)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
});
