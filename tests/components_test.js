import test from 'ava';
import expect from 'expect';
import '../lib';

let expected = [
  {
    name: 'div',
    props: { id: 'example' },
    children: ['Hello ', 'World'],
    dom: null,
    isVnode: true,
    nt: 1,
    isSVG: false
  }
];

test('POJO component', ({ deepEqual }) => {
  let Component = {
    world: 'World',
    id: 'example',
    view() {
      return <div id={Component.id}>Hello {Component.world}</div>;
    }
  };

  expect(v(Component)).toEqual(expected);
  expect(<Component />).toEqual(expected);
});

test('Functional stateful component', ({ deepEqual, log }) => {
  let Component = function () {
    return <div id={this.id}>Hello {this.world}</div>;
  };
  let state = {
    world: 'World',
    id: 'example'
  };

  // Initialize as component and assign state
  v.addState(Component, state);

  expect(v(Component)).toEqual(expected);
  expect(<Component />).toEqual(expected);
});

test('Functional stateless component', ({ deepEqual }) => {
  let Component = (props, world) => <div id={props.id}>Hello {world}</div>;

  expect(v(Component, { id: 'example' }, 'World')).toEqual(expected);
  expect(<Component id="example">World</Component>).toEqual(expected);
});

test('Functional stateless component antipattern', ({ deepEqual }) => {
  let state = {
    world: 'World',
    id: 'example'
  };
  let Component = () => <div id={state.id}>Hello {state.world}</div>;

  expect(v(Component)).toEqual(expected);
  expect(<Component>World</Component>).toEqual(expected);
});

test('Functional stateful error context', ({ deepEqual, log }) => {
  // this.id and this.world will be undefined due to the use of an arrow function
  let Component = () => {
    return <div id={this.id}>Hello {this.world}</div>;
  };
  let state = {
    world: 'World',
    id: 'example'
  };

  // Initialize as component
  v.addState(Component, state);

  let expected = [
    {
      name: 'div',
      props: { id: undefined },
      children: ['Hello '],
      dom: null,
      isVnode: true,
      nt: 1,
      isSVG: false
    }
  ];

  expect(v(Component)).toEqual(expected);
  expect(<Component />).toEqual(expected);
});

test('Create POJO component', (t) => {
  let Component = {
    world: 'World',
    id: 'example',
    view() {
      return <div id={Component.id}>Hello {Component.world}</div>;
    }
  };

  expect(typeof Component.view).toEqual('function');
});

test('Create Functional stateful component', (t) => {
  let Component = function () {
    return <div id={this.id}>Hello {this.world}</div>;
  };
  let state = {
    world: 'World',
    id: 'example'
  };

  // Should identify the function as a component
  v.addState(Component, state);

  expect(typeof Component.view).toEqual('function');
  expect(Component.world).toEqual(state.world);
  expect(Component.id).toEqual(state.id);
});

test('Create Functional stateless component', (t) => {
  let Component = (props) => <div id={props.id}>Hello {props.world}</div>;

  // Should identify the function as a component
  v(Component, { id: 'id', world: 'mundo' });

  expect(typeof Component.view).toEqual('function');
});
