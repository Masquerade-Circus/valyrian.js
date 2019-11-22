import expect from 'expect';
import faker from 'faker';
import dayjs from 'dayjs';
import '../lib';
import nodePlugin from '../plugins/node';
v.usePlugin(nodePlugin);

describe('Directives', () => {

  describe('Directive creation', () => {

    let result;

    it('should be able create a directive', () => {
      let expected = 'Hello world';
      v.directive('v-test', (value) => result = `Hello ${value}`);
      v.mount('div', () => <div v-test={'world'}></div>);
      expect(result).toEqual(expected);
    });

    it('should not be able overwrite a directive', () => {
      let expected = 'Hello world';
      v.directive('v-test', (value) => result = 'Something else');
      v.mount('div', () => <div v-test={'world'}></div>);
      expect(result).toEqual(expected);
    });

    // We get the old node after an update but this can only be tested in the browser side
    it('should be able to get the vnode', () => {
      let expected = {
        name: 'div',
        props: {
          'v-test2': true
        },
        dom: expect.any(Object),
        children: []
      };

      let result;
      v.directive('v-test2', (v, vnode) => result = vnode);
      v.mount('div', () => <div v-test2></div>);
      expect(result).toEqual(expected);
    });

    it('should be able to modify the children of a vnode', () => {
      let expected = '<div>Hello world</div>';
      v.directive('v-test3', (v, vnode) => vnode.children = 'Hello world');
      let result = v.mount('div', () => <div v-test3><span>Hello John Doe</span></div>);
      expect(result).toEqual(expected);
    });

    /**
     * Modify properties is not guaranteed
     * If the directive needs to do this you need to set the directive before any other props
     * because the properties are processed by place
     */
    it('Modify properties is not guaranteed', () => {
      let expected = '<div u="u" x="property changed"></div>';
      v.directive('v-test4', (v, vnode) => {
        // Try to change u property
        vnode.props.u = 'property changed';

        // Try to change x property
        vnode.props.x = 'property changed';
      });
      let result = v.mount('div', () => <div u="u" v-test4 x="x"></div>);
      expect(result).toEqual(expected);
    });

    /**
     * We don't have flags as vue or ember
     * For this we should be able to use a directive as flag
     */
    it('should be able to use it as a flag', () => {
      let expected = '<div>August 16, 2018</div>';

      let formatDate = (value) => dayjs(value).format('MMMM D, YYYY');

      v.directive('v-date-inline', (date, vnode) => vnode.children = formatDate(date));
      v.directive('v-date', (v, vnode) => vnode.children = formatDate(vnode.children[0]));

      let date = "08-16-2018";
      let result = v.mount('div', () => <div v-date-inline={date}></div>);
      expect(result).toEqual(expected);

      result = v.mount('div', () => <div v-date>{date}</div>);
      expect(result).toEqual(expected);
    });
  });

  /**
   * v-for directive works like this
   * On the element set the v-for directive to an array
   * It needs a function as a child to process the elements of the array
   * Think of it as a map function that returns a list of vnodes
   */
  describe('v-for', () => {

    it('should create 10 list items', () => {
      let items = faker.lorem.words(10).split(' ');
      let expected = '<ul>' + items.reduce((str, word) => str + `<li>${word}</li>`, '') + '</ul>';
      let result = v.mount('body', () => <ul v-for={items}>{word => <li>{word}</li>}</ul>);

      expect(result).toEqual(expected);
    });

    it('should create 10 list items getting its index', () => {
      let items = faker.lorem.words(10).split(' ');
      let i = 0;
      let expected = '<ul>' + items.reduce((str, word) => str + `<li>${i++} - ${word}</li>`, '') + '</ul>';
      let result = v.mount('body', () => <ul v-for={items}>{(word, i) => <li>{i} - {word}</li>}</ul>);

      expect(result).toEqual(expected);
    });

  });

  /**
   * Works as Vue's v-if directive or ember "if" helper
   * It renders a vnode if the referenced value is true
   */
  describe('v-if', () => {

    it('should render vnode if true', () => {
      let value = true;
      let expected = '<div><span>Hello world</span></div>';
      let result = v.mount('div', () => <div><span v-if={value}>Hello world</span></div>);

      expect(result).toEqual(expected);
    });

    it('should not render vnode if false', () => {
      let value = false;
      let expected = '<div></div>';
      let result = v.mount('div', () => <div><span v-if={value}>Hello world</span></div>);

      expect(result).toEqual(expected);
    });

    it('should update oldnode', () => {
      let value = true;
      let expected1 = '<div><span>Hello world</span></div>';
      let expected2 = '<div></div>';

      let result1 = v.mount('div', () => <div><span v-if={value}>Hello world</span></div>);
      expect(result1).toEqual(expected1);

      value = false;
      let result2 = v.update();
      expect(result2).toEqual(expected2);
    });

  });

  /**
   * Valyrian isn't template bassed so we can't handle a v-else like directive
   * Instead  of v-else we will have a v-unless directive
   *
   * Works as embers "unless" helper
   * It renders a vnode if the referenced value is false
   */
  describe('v-unless', () => {

    it('should render vnode if false', () => {
      let value = false;
      let expected = '<div><span>Hello world</span></div>';
      let result = v.mount('div', () => <div><span v-unless={value}>Hello world</span></div>);

      expect(result).toEqual(expected);
    });

    it('should not render vnode if true', () => {
      let value = true;
      let expected = '<div></div>';
      let result = v.mount('div', () => <div><span v-unless={value}>Hello world</span></div>);

      expect(result).toEqual(expected);
    });

  });

  /**
   * Works as Vue's v-show directive
   * It renders a vnode and only changes it's display style value
   */
  describe('v-show', () => {

    it('should show a vnode if true', () => {
      let value = true;
      let expected = '<div><span>Hello world</span></div>';
      let result = v.mount('div', () => <div><span v-show={value}>Hello world</span></div>);

      expect(result).toEqual(expected);
    });

    it('should hide a vnode if false', () => {
      let value = false;
      let expected = '<div><span style="display: none;">Hello world</span></div>';
      let result = v.mount('div', () => <div><span v-show={value}>Hello world</span></div>);

      expect(result).toEqual(expected);
    });

  });

  /**
   * Works as a Switch statement
   * It needs a set of arrays as children of the form [{case}, vnodes]
   * This is not added to the base library but it shows the capabilities of valyrian directives
   */
  describe('v-switch', () => {
    v.directive('v-switch', (value, vnode) => {
      let useDefault = true;
      for (let i = 0, l = vnode.children.length; i < l; i++) {
        let [test, handler] = vnode.children[i];
        let result = false;
        result = typeof test === 'function' ?
          test(value) :
          value === test;

        if (result) {
          useDefault = false;
          vnode.children = typeof handler === 'function' ? handler(value) : handler;
          break;
        }
      }
      if (useDefault) {
        vnode.children = value;
      }
    });

    let name;
    let component = () => <div v-switch={name}>
      {['John', <span>Hello John</span>]}
      {[(val) => val === 'John Doe', <span>Hello John Doe</span>]}
      {['Jane', (val) => <span>Hello {val} Doe</span>]}
    </div>;

    let expected;
    let result;

    // Direct equality
    expected = '<div><span>Hello John</span></div>';
    name = 'John';
    result = v.mount('div', component);
    expect(result).toEqual(expected);

    // Comparison method
    expected = '<div><span>Hello John Doe</span></div>';
    name = 'John Doe';
    result = v.mount('div', component);
    expect(result).toEqual(expected);

    // Result method
    expected = '<div><span>Hello Jane Doe</span></div>';
    name = 'Jane';
    result = v.mount('div', component);
    expect(result).toEqual(expected);

    // If no case return the value as children
    expected = '<div>Hello Anonymous</div>';
    name = 'Hello Anonymous';
    result = v.mount('div', component);
    expect(result).toEqual(expected);
  });
});