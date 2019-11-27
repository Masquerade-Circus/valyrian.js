import expect from 'expect';
import '../lib';
import nodePlugin from '../plugins/node';
import hooksPlugin from '../plugins/hooks';
v.usePlugin(nodePlugin);
v.usePlugin(hooksPlugin);

describe('Hooks', () => {

  it('should handle a component state', async () => {
    v.unmount();

    let Counter = () => {
      let count = v.useState(0);
      let interval = setInterval(() => count(count + 1), 1000);
      v.onCleanup(() => clearInterval(interval));
      return <div>{count}</div>;
    };

    let result = v.mount('div', Counter);
    expect(result).toEqual('<div>0</div>');
    await new Promise(resolve => setTimeout(() => resolve(), 2050));
    result = v.update();
    expect(result).toEqual('<div>2</div>');
    result = v.unmount();
  });

  it('should handle subcomponents state and cleanup', async () => {
    v.unmount();

    let Ok = () => {
      let ok = v.useState('ok');
      let interval = setInterval(() => ok('not ok'), 1000);
      v.onCleanup(() => clearInterval(interval));
      return <div>{ok.state}</div>;
    };


    let Counter = () => {
      let count = v.useState(0);
      let interval = setInterval(() => count(count + 1), 1000);
      v.onCleanup(() => clearInterval(interval));
      return <div>{count} <Ok /></div>;
    };

    let result = v.mount('div', Counter);
    expect(result).toEqual('<div>0 <div>ok</div></div>');
    await new Promise(resolve => setTimeout(() => resolve(), 2050));
    result = v.update();
    expect(result).toEqual('<div>2 <div>not ok</div></div>');
    result = v.unmount();
  });

  it('getter-setter based state', async () => {
    v.unmount();

    let Counter = () => {
      let count = v.useState(0);
      let interval = setInterval(() => count(count() + 1), 1000);
      v.onCleanup(() => clearInterval(interval));
      return <div>{count()}</div>;
    };

    let result = v.mount('div', Counter);
    expect(result).toEqual('<div>0</div>');
    await new Promise(resolve => setTimeout(() => resolve(), 2050));
    result = v.update();
    expect(result).toEqual('<div>2</div>');
    result = v.unmount();
  });

  it('state property based state', async () => {
    v.unmount();

    let Counter = () => {
      let count = v.useState(0);
      let interval = setInterval(() => count.setState(count.state + 1), 1000);
      v.onCleanup(() => clearInterval(interval));
      return <div>{count.state}</div>;
    };

    let result = v.mount('div', Counter);
    expect(result).toEqual('<div>0</div>');
    await new Promise(resolve => setTimeout(() => resolve(), 2050));
    result = v.update();
    expect(result).toEqual('<div>2</div>');
    result = v.unmount();
  });

});
