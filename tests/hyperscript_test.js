import test from 'ava';
import expect from 'expect';
import '../lib';
import nodePlugin from '../plugins/node';
v.use(nodePlugin);

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

test('should create a div element', (t) => {
  expect(v('div')).toEqual({
    name: 'div',
    props: {},
    children: [],
    dom: null,
    isVnode: true,
    nt: 1,
    isSVG: false
  });
});

test('should create a div element with a text child', (t) => {
  expect(v('div', null, 'Hello')).toEqual({
    name: 'div',
    props: {},
    children: ['Hello'],
    dom: null,
    isVnode: true,
    nt: 1,
    isSVG: false
  });
});

test('should create a div element with an element child', (t) => {
  expect(v('div', null, v('span'))).toEqual({
    name: 'div',
    props: {},
    children: [
      {
        name: 'span',
        props: {},
        children: [],
        dom: null,
        isVnode: true,
        nt: 1,
        isSVG: false
      }
    ],
    dom: null,
    isVnode: true,
    nt: 1,
    isSVG: false
  });
});

test('should create a div element with comma separated children', (t) => {
  expect(v('div', null, 'Hello ', 'world')).toEqual({
    name: 'div',
    props: {},
    children: ['Hello ', 'world'],
    dom: null,
    isVnode: true,
    nt: 1,
    isSVG: false
  });
});

test('should create a div element with array of children', (t) => {
  expect(v('div', null, ['Hello ', 'world'])).toEqual({
    name: 'div',
    props: {},
    children: ['Hello ', 'world'],
    dom: null,
    isVnode: true,
    nt: 1,
    isSVG: false
  });
});

test('should create a div element with mixed array of children and comma separated children', (t) => {
  expect(v('div', null, ['Hello ', 'world'], v('span', null, 'Whats up'))).toEqual({
    name: 'div',
    props: {},
    children: [
      'Hello ',
      'world',
      {
        name: 'span',
        props: {},
        children: ['Whats up'],
        dom: null,
        isVnode: true,
        nt: 1,
        isSVG: false
      }
    ],
    dom: null,
    isVnode: true,
    nt: 1,
    isSVG: false
  });
});

test('should create a div element with mixed nested arrays of children ', (t) => {
  expect(v('div', null, ['Hello ', 'world', ['Only', ['for', 'this', ['time']]]])).toEqual({
    name: 'div',
    props: {},
    children: ['Hello ', 'world', 'Only', 'for', 'this', 'time'],
    dom: null,
    isVnode: true,
    nt: 1,
    isSVG: false
  });
});

test('should create a div element with props', (t) => {
  expect(v('div', { id: 'unique', class: 'unique' })).toEqual({
    name: 'div',
    props: {
      id: 'unique',
      class: 'unique'
    },
    children: [],
    dom: null,
    isVnode: true,
    nt: 1,
    isSVG: false
  });
});

// TODO: This could not be working with undom for server side
// See: https://github.com/developit/undom/issues/7
test.skip('should create a div element from string', (t) => {
  expect(v.trust('<div id="unique" class="unique"></div>')).toEqual({
    name: 'div',
    props: {
      id: 'unique',
      class: 'unique'
    },
    children: [],
    dom: null,
    isVnode: true,
    nt: 1,
    isSVG: false
  });
});
