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
    el: true,
    isSVG: false
  }
];

test('should create a div element', (t) => {
  expect(v('div')).toEqual({
    name: 'div',
    props: {},
    children: [],
    el: true,
    isSVG: false
  });
});

test('should create a div element with a text child', (t) => {
  expect(v('div', null, 'Hello')).toEqual({
    name: 'div',
    props: {},
    children: [{ props: {}, nodeValue: 'Hello', children: [], el: false }],
    el: true,
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
        el: true,
        isSVG: false
      }
    ],
    el: true,
    isSVG: false
  });
});

test('should create a div element with comma separated children', (t) => {
  expect(v('div', null, 'Hello ', 'world')).toEqual({
    name: 'div',
    props: {},
    children: [
      { props: {}, nodeValue: 'Hello ', children: [], el: false },
      { props: {}, nodeValue: 'world', children: [], el: false }
    ],
    el: true,
    isSVG: false
  });
});

test('should create a div element with array of children', (t) => {
  expect(v('div', null, ['Hello ', 'world'])).toEqual({
    name: 'div',
    props: {},
    children: [
      { props: {}, nodeValue: 'Hello ', children: [], el: false },
      { props: {}, nodeValue: 'world', children: [], el: false }
    ],
    el: true,
    isSVG: false
  });
});

test('should create a div element with mixed array of children and comma separated children', (t) => {
  expect(v('div', null, ['Hello ', 'world'], v('span', null, 'Whats up'))).toEqual({
    name: 'div',
    props: {},
    children: [
      { props: {}, nodeValue: 'Hello ', children: [], el: false },
      { props: {}, nodeValue: 'world', children: [], el: false },
      {
        name: 'span',
        props: {},
        children: [{ props: {}, nodeValue: 'Whats up', children: [], el: false }],
        el: true,
        isSVG: false
      }
    ],
    el: true,
    isSVG: false
  });
});

test('should create a div element with mixed nested arrays of children ', (t) => {
  expect(v('div', null, ['Hello ', 'world', ['Only', ['for', 'this', ['time']]]])).toEqual({
    name: 'div',
    props: {},
    children: [
      { props: {}, nodeValue: 'Hello ', children: [], el: false },
      { props: {}, nodeValue: 'world', children: [], el: false },
      { props: {}, nodeValue: 'Only', children: [], el: false },
      { props: {}, nodeValue: 'for', children: [], el: false },
      { props: {}, nodeValue: 'this', children: [], el: false },
      { props: {}, nodeValue: 'time', children: [], el: false }
    ],
    el: true,
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
    el: true,
    isSVG: false
  });
});

test('should create a div element from string', (t) => {
  expect(v.trust('<div id="unique" class="unique"></div>')).toEqual([
    {
      name: 'div',
      props: {
        id: 'unique',
        class: 'unique'
      },
      children: [],
      dom: expect.anything(),
      el: true,
      isSVG: false
    }
  ]);
});

test('should different types of data', (t) => {
  let date = new Date();

  expect(v('div', null, [null, 'Hello', , 1, date, { hello: 'world' }, ['Hello']])).toEqual({
    name: 'div',
    props: {},
    children: [
      { props: {}, nodeValue: 'Hello', children: [], el: false },
      { props: {}, nodeValue: '1', children: [], el: false },
      { props: {},
       nodeValue: String(date),
       children: [],
       el: false },
      { props: {},
       nodeValue: '[object Object]',
       children: [],
       el: false },
      { props: {}, nodeValue: 'Hello', children: [], el: false }
    ],
    el: true,
    isSVG: false
  });
});
