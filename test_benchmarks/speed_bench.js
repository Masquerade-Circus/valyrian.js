import '../lib';
import nodePlugin from '../plugins/node';
v.usePlugin(nodePlugin);

bench('Speed', () => {

  let getComponent = () => {
    let Component = {
      world: 'World',
      id: 'example',
      view() {
        return <div id={Component.id}>Hello {Component.world}</div>;
      }
    };
    return Component;
  };

  it('max', () => {
    let Component = getComponent();
    before = v.mount('body', Component);
    Component.world = 'John Doe';
    after = v.update();
  });
});
