import expect from 'expect';
import '../lib';
import nodePlugin from '../plugins/node';
v.usePlugin(nodePlugin);

describe('Mount and update', () => {
  it('Mount and update with POJO component', () => {
    let Component = {
      world: 'World',
      id: 'example',
      view() {
        return <div id={this.id}>Hello {this.world}</div>;
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

  it('Mount and update with functional stateful component', () => {
    let Component = function () {
      return <div id={this.id}>Hello {this.world}</div>;
    };
    Component.world = 'World';
    Component.id = 'example';

    let result = {};

    result.before = v.mount('body', Component);
    Component.world = 'John Doe';
    result.after = v.update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it('Mount and update with functional stateless subcomponent', () => {
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

  it('Handle multiple update calls', () => {
    let Component = {
      world: 'World',
      id: 'example',
      view() {
        return <div id={this.id}>Hello {this.world}</div>;
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

  it('Antipattern: Mount and update with functional stateless component', () => {
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

  it('Should update text node with dom node', () => {
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

  it('Should update dom node with text node', () => {
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

  it('Should handle different types of data', () => {
    let date = new Date();

    let Component = () => v('div', null, [null, 'Hello', , 1, date, { hello: 'world' }, ['Hello']]);
    expect(v.mount('body', Component)).toEqual(`<div>nullHelloundefined1${date}[object Object]Hello</div>`);
  });


  it('Should handle svgs', () => {
    // eslint-disable-next-line max-len
    let svg = '<svg enable-background="new 0 0 320.523 320.523" version="1.1" viewBox="0 0 320.523 320.523" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="m254.41 225.55l-69.147-69.148 65.289-65.29-91.113-91.113v130.58l-82.726-82.726-10.607 10.606 93.333 93.333v9.222l-93.333 93.333 10.606 10.606 82.726-82.726v138.3l94.972-94.972zm-79.971-189.34l54.9 54.9-54.683 54.683-0.218-0.217 1e-3 -109.37zm0 131.01l0.218-0.217 58.541 58.542-58.759 58.759v-117.08z"></path></svg>';
    let Component = () => v.trust(svg);
    // eslint-disable-next-line max-len
    expect(v.mount('body', Component)).toEqual(svg);
  });

  it('should fail silently if try to update before mount', () => {
    v.unmount();
    v.update();
  });

  it('should handle text vnode as new node', async () => {
    let vnode = v.trust('<span>Some text</span>');
    let component = () => vnode;
    let result = v.mount('body', component);

    expect(result).toEqual('<span>Some text</span>');

    vnode.children = ['Other text'];
    let result2 = v.update();
    expect(result2).toEqual('<span>Some text</span>');
  });

});
