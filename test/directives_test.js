import expect from 'expect';
import faker from 'faker';
import dayjs from 'dayjs';
import '../lib';
import nodePlugin from '../plugins/node';
v.usePlugin(nodePlugin);

// eslint-disable-next-line max-lines-per-function
describe('Directives', () => {

  describe('Directive creation', () => {

    let result;

    it('should be able create a directive', () => {
      let expected = 'Hello world';
      v.directive('test', (value) => result = `Hello ${value}`);
      v.mount('div', () => <div v-test={'world'}></div>);
      expect(result).toEqual(expected);
    });

    it('should not be able overwrite a directive', () => {
      let expected = 'Hello world';
      v.directive('test', () => result = 'Something else');
      v.mount('div', () => <div v-test={'world'}></div>);
      expect(result).toEqual(expected);
    });

    it('should be able to get the vnode', () => {
      let newVnode;
      let oldVnode;

      v.directive('test2', (v, vnode, oldvnode) => {
        newVnode = vnode;
        oldVnode = oldvnode;
      });

      v.mount('div', () => <div v-test2></div>);
      v.update();

      expect(newVnode).toEqual({
        name: 'div',
        props: {
          'v-test2': true
        },
        dom: expect.any(Object),
        children: [],
        isSVG: false
      });

      expect(oldVnode).toEqual({
        name: 'div',
        props: {
          'v-test2': true
        },
        dom: expect.any(Object),
        children: [],
        isSVG: false
      });
    });

    it('should be able to identify if this is first render or update', () => {
      v.directive('create', (placeholder, vnode, oldvnode) => {
        if (!oldvnode) {
          vnode.children = ['First render, vnode created'];
        } else {
          vnode.children = ['Second render, vnode updated'];
        }
      });
      let component = () => <div v-create></div>;

      let result = v.mount('body', component);
      expect(result).toEqual('<div>First render, vnode created</div>');

      let result2 = v.update();
      expect(result2).toEqual('<div>Second render, vnode updated</div>');
    });

    it('should be able to modify the children of a vnode', () => {
      let expected = '<div>Hello world</div>';
      v.directive('test3', (v, vnode) => vnode.children = 'Hello world');
      let result = v.mount('div', () => <div v-test3><span>Hello John Doe</span></div>);
      expect(result).toEqual(expected);
    });

    /**
     * Modify properties is not guaranteed because the properties are processed by place
     * If the directive needs to do update previous properties you need to update the property using the v.updateProperty method
     */
    it('Modify properties is not guaranteed', () => {
      let update = false;
      v.directive('test4', (p, vnode, oldVnode) => {
        // Try to change u property
        vnode.props.u = 'property changed';
        if (update) {
          v.updateProperty('u', vnode, oldVnode);
        }

        // Try to change x property
        vnode.props.x = 'property changed';
      });
      let result = v.mount('div', () => <div u="u" v-test4 x="x"></div>);
      expect(result).toEqual('<div u="u" x="property changed"></div>');
      v.unMount();

      update = true;
      let result2 = v.mount('div', () => <div u="u" v-test4 x="x"></div>);
      expect(result2).toEqual('<div u="property changed" x="property changed"></div>');
    });

    /**
     * We don't have flags as vue or ember
     * For this we should be able to use a directive as flag
     */
    it('should be able to use it as a flag', () => {
      let expected = '<div>August 16, 2018</div>';

      let formatDate = (value) => dayjs(value).format('MMMM D, YYYY');

      v.directive('date-inline', (date, vnode) => vnode.children = formatDate(date));
      v.directive('date', (v, vnode) => vnode.children = formatDate(vnode.children[0]));

      let date = "08-16-2018";
      let result = v.mount('div', () => <div v-date-inline={date}></div>);
      expect(result).toEqual(expected);

      result = v.mount('div', () => <div v-date>{date}</div>);
      expect(result).toEqual(expected);
    });

    /**
   * Works as a Switch statement
   * It needs a set of arrays as children of the form [{case}, vnodes]
   * This is not added to the base library but it shows the capabilities of valyrian directives
   */
    it('v-switch example', () => {
      v.directive('switch', (value, vnode) => {
        for (let i = 0, l = vnode.children.length; i < l; i++) {
          let [test, handler] = vnode.children[i];
          let result = false;
          result = typeof test === 'function' ?
            test(value) :
            value === test;

          if (result) {
            vnode.children = typeof handler === 'function' ? handler(value) : handler;
            return;
          }
        }

        vnode.children = value;
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

  describe('Official directives', () => {
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

      it('should render vnode if thruthy values', () => {
        let values = [
          {},
          1,
          true,
          [],
          "string",
          new Date(),
          -1
        ];

        let expected = '<div><span>Hello world</span></div>';

        values.forEach(value => {
          v.unMount();
          let result = v.mount('div', () => <div><span v-if={value}>Hello world</span></div>);
          expect(result).toEqual(expected);
        });
      });

      it('should not render vnode with falsy values', () => {
        let values = [
          false,
          0,
          '',
          null,,
          NaN
        ];

        let expected = '<div></div>';

        values.forEach(value => {
          v.unMount();
          let result = v.mount('div', () => <div><span v-if={value}>Hello world</span></div>);
          expect(result).toEqual(expected);
        });
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
     * Valyrian isn't template based so we can't handle a v-else like directive
     * Instead of v-else we will have a v-unless directive
     *
     * Works as embers "unless" helper
     * It renders a vnode if the referenced value is false
     */
    describe('v-unless', () => {

      it('should render vnode with falsy values', () => {
        let values = [
          false,
          0,
          '',
          null,,
          NaN
        ];

        let expected = '<div><span>Hello world</span></div>';

        values.forEach(value => {
          v.unMount();
          let result = v.mount('div', () => <div><span v-unless={value}>Hello world</span></div>);
          expect(result).toEqual(expected);
        });
      });

      it('should not render vnode if thruthy values', () => {
        let values = [
          {},
          1,
          true,
          [],
          "string",
          new Date(),
          -1
        ];

        let expected = '<div></div>';

        values.forEach(value => {
          v.unMount();
          let result = v.mount('div', () => <div><span v-unless={value}>Hello world</span></div>);
          expect(result).toEqual(expected);
        });
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
     * v-class directive receives a object with boolean attributes to toggle classes on the dom
     */
    describe('v-class', () => {

      it('should toggle on a class', () => {
        let classes = {
          world: true
        };

        let result = v.mount('body', () => <div v-class={classes}></div>);
        expect(result).toEqual('<div class="world"></div>');

        classes.world = false;
        let result2 = v.update();
        expect(result2).toEqual('<div></div>');

      });

      it('should toggle on a class in an element with a class attribute', () => {
        let classes = {
          world: true
        };

        let result = v.mount('body', () => <div class="hello" v-class={classes}></div>);
        expect(result).toEqual('<div class="hello world"></div>');

        classes.world = false;
        let result2 = v.update();
        expect(result2).toEqual('<div class="hello"></div>');

      });
    });

    /**
     * The directive v-once is used to render just once and skip all subsequent render updates
     * Similar to write the lifecycle onbeforeupdate={() => false}
     */
    describe('v-once', () => {
      it('should not update the dom after first render', () => {
        let Store = {hello: 'world'};
        let Component = () => <div v-once>Hello {Store.hello}</div>;

        let result = v.mount('body', Component);
        expect(result).toEqual('<div>Hello world</div>');

        // We update our store
        Store.hello = 'John Doe';

        let result2 = v.update();
        expect(result2).toEqual('<div>Hello world</div>');
      });
    });

    /**
     * The v-html directive is used to direct raw html render. It is just a helper directive
     * and it does not improve performance because Valyrian.js is already very fast with vnodes.
     * We can use this directive to replace the v.trust use like in this test
     */
    describe('v-html', () => {
      it('should handle direct html render', () => {
        // Using v.trust example
        let Component = () => <div>{v.trust('<div>Hello world</div>')}</div>;
        let result = v.mount('body', Component);

        expect(result).toEqual('<div><div>Hello world</div></div>');

        // Unmount to clean the instance
        v.unMount();

        // Using v-html directive
        let Component2 = () => <div v-html="<div>Hello world</div>"></div>;
        let result2 = v.mount('body', Component2);

        expect(result2).toEqual('<div><div>Hello world</div></div>');
      });
    });
  });


  // if the v-if directive resolve to false, we should not execute any other directive or attribute update like v-for
  describe('use v-if with v-for', () => {
    it('should use v-if with v-for directives', () => {
      let arr = [1, 2, 3, 4];
      let show = true;
      let component = () => <div v-if={show} v-for={arr}>{i => <span>{i}</span>}</div>;

      let result = v.mount('body', component);
      expect(result).toEqual('<div><span>1</span><span>2</span><span>3</span><span>4</span></div>');

      show = false;
      let result2 = v.update();
      expect(result2).toEqual('');
    });
  });

  /**
   * The data directive is used just to pass data without creating an attribute on the node.
   * And its main use is in the lifecycle methods to validate properties or changes
   */
  describe('reserved word data', () => {
    it('should not render an attribute', () => {
      let data = {hello: 'world'};
      let Component = () => <div
        data={data}
        onbeforeupdate={(oldVnode, newVnode) => oldVnode.props.data.hello !== newVnode.props.data.hello}
      ></div>;

      let result = v.mount('body', Component);
      expect(result).toEqual('<div></div>');
    });

  });

});

