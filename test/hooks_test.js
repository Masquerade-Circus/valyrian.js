import expect from 'expect';
import '../lib';
import nodePlugin from '../plugins/node';
v.usePlugin(nodePlugin);

describe('Hooks like pattern', () => {

  it('should create a simple counter', async () => {
    v.unmount();
    let Counter = () => {
      let [count, setState] = v.useState(0);
      let [ok, setOk] = v.useState('ok');
      let interval = setInterval(() => {
        setState(count + 1);
        setOk('notOk');
      }, 1000);
      v.onCleanup(() => clearInterval(interval));
      return <div>{count} {ok}</div>;
    };

    let result = v.mount('div', Counter);
    expect(result).toEqual('<div>0 ok</div>');
    await new Promise(resolve => setTimeout(() => resolve(), 2050));
    result = v.update();
    expect(result).toEqual('<div>2 notOk</div>');
    result = v.unmount();
  });
});
