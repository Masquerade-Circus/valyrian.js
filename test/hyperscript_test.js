
import expect from 'expect';
import '../lib';
import nodePlugin from '../plugins/node';
v.usePlugin(nodePlugin);

describe('Hyperscript', () => {

  let und;

  it('should create a div element', () => {
    expect(v('div')).toEqual({
      name: 'div',
      props: {},
      children: [],
      isSVG: false
    });
  });

  it('should create a div element with a text child', () => {
    expect(v('div', null, 'Hello')).toEqual({
      name: 'div',
      props: {},
      children: ['Hello'],
      isSVG: false
    });
  });

  it('should create a div element with an element child', () => {
    expect(v('div', null, v('span'))).toEqual({
      name: 'div',
      props: {},
      children: [
        {
          name: 'span',
          props: {},
          children: [],
          isSVG: false
        }
      ],
      isSVG: false
    });
  });

  it('should create a div element with comma separated children', () => {
    expect(v('div', null, 'Hello ', 'world')).toEqual({
      name: 'div',
      props: {},
      children: [
        'Hello ',
        'world'
      ],
      isSVG: false
    });
  });

  it('should create a div element with array of children', () => {
    expect(v('div', null, ['Hello ', 'world'])).toEqual({
      name: 'div',
      props: {},
      children: [
        ['Hello ',
          'world']
      ],
      isSVG: false
    });
  });

  it('should create a div element with mixed array of children and comma separated children', () => {
    expect(v('div', null, ['Hello ', 'world'], v('span', null, 'Whats up'))).toEqual({
      name: 'div',
      props: {},
      children: [
        ['Hello ', 'world'],
        {
          name: 'span',
          props: {},
          children: ['Whats up'],
          isSVG: false
        }
      ],
      isSVG: false
    });
  });

  it('should create a div element with mixed nested arrays of children ', () => {
    expect(v('div', null, ['Hello ', 'world', ['Only', ['for', 'this', ['time']]]])).toEqual({
      name: 'div',
      props: {},
      children: [
        ['Hello ', 'world', ['Only', ['for', 'this', ['time']]]]
      ],
      isSVG: false
    });
  });

  it('should create a div element with props', () => {
    expect(v('div', { id: 'unique', class: 'unique' })).toEqual({
      name: 'div',
      props: {
        id: 'unique',
        class: 'unique'
      },
      children: [],
      isSVG: false
    });
  });

  it('should create a div element from string', () => {
    expect(v.trust('<div id="unique" class="unique"></div>')).toEqual([
      {
        name: 'DIV', // jsdom sets this to the uppercase form
        props: {
          id: 'unique',
          class: 'unique'
        },
        children: [],
        dom: expect.anything(),
        isSVG: false
      }
    ]);
  });

  it('should handle different types of data', () => {
    let date = new Date();

    expect(v('div', null, [null, 'Hello', , 1, date, { hello: 'world' }, ['Hello']])).toEqual({
      name: 'div',
      props: {},
      children: [
        [null, 'Hello', undefined, 1, date, { hello: 'world' }, ['Hello']]
      ],
      isSVG: false
    });
  });

});
