import expect from 'expect';
import '../lib';
import nodePlugin from '../plugins/node';
import hooksPlugin from '../plugins/hooks';
v.usePlugin(nodePlugin);
// v.usePlugin(hooksPlugin);

describe('Hooks like pattern', () => {

  it('should create a simple counter', async () => {
    v.unmount();
    let Counter = () => {
      let [count, setState] = v.useState(0);
      let interval = setInterval(() => setState(count + 1), 1000);
      v.useCleanup(() => clearInterval(interval));
      return <div>{count}</div>;
    };

    let result = v.mount('div', Counter);
    expect(result).toEqual('<div>0</div>');
    await new Promise(resolve => setTimeout(() => resolve(), 2050));
    result = v.update();
    expect(result).toEqual('<div>2</div>');
    result = v.unmount();
  });
});
