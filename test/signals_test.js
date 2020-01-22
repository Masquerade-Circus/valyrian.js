import expect from 'expect';
import '../lib';
import nodePlugin from '../plugins/node';
import signalsPlugin from '../plugins/signals';

v.usePlugin(nodePlugin);
v.usePlugin(signalsPlugin);

describe('Signals', () => {
  it('should create a signal', async () => {
    // Create signal
    let counter = v.Signal(0);

    // Read value
    counter();
    counter.value;

    // Set value
    counter(0);
    counter.value = 0;
    // Set deeply value with function
    // counter('path', (current) => current);
    // Set deeply value
    // counter('path', 0)

    // Effectful computed / Subscription
    let effect = counter((val) => expect(val).toBeGreaterThanOrEqual(0));

    // Named computed / Getter
    counter.getter('hello', (val) => 'hello ' + val);

    // Pure computed
    let computed = counter((val) => 'hello ' + val);

    // Unlinked Pure computed
    let unlinked = v.Signal(() => 'hello ' + counter.value);


    let interval = setInterval(() => counter.value += 1, 1000);
    expect(counter.hello).toEqual('hello 0');
    expect(computed()).toEqual('hello 0');
    expect(computed.value).toEqual('hello 0');
    expect(unlinked()).toEqual('hello 0');
    expect(unlinked.value).toEqual('hello 0');

    await new Promise(resolve => setTimeout(() => resolve(), 3000));
    // effect.unsubscribe();
    counter.cleanup();
    expect(counter.hello).toEqual('hello 2');
    expect(computed()).toEqual('hello 2');
    expect(computed.value).toEqual('hello 2');
    expect(unlinked()).toEqual('hello 2');
    expect(unlinked.value).toEqual('hello 2');

    await new Promise(resolve => setTimeout(() => resolve(), 2000));
    clearInterval(interval);
    expect(counter.hello).toEqual('hello 4');
    expect(computed()).toEqual('hello 4');
    expect(computed.value).toEqual('hello 4');
    expect(unlinked()).toEqual('hello 4');
    expect(unlinked.value).toEqual('hello 4');

  });

  it('should test effect cleanup', async () => {
    let delay = v.Signal(1000);
    let count = v.Signal(0);
    let effectInterval = delay((delay) => {
      let interval = setInterval(() => {
        count.value = count.value + 1;
      }, delay);
      return () => clearInterval(interval);
    });

    await new Promise(resolve => setTimeout(() => resolve(), 1000));
    expect(count()).toEqual(1);
    expect(count.value).toEqual(1);
    delay(500);
    await new Promise(resolve => setTimeout(() => resolve(), 2000));
    expect(count()).toEqual(4);
    expect(count.value).toEqual(4);
    effectInterval.cleanup();
    await new Promise(resolve => setTimeout(() => resolve(), 2000));
    expect(count()).toEqual(4);
    expect(count.value).toEqual(4);
    delay.cleanup();
    count.cleanup();
  });

  it('should test deep state effect cleanup', async () => {
    let state = v.Signal({
      count: 0,
      delay: 1000
    });
    let effectInterval2 = state(() => {
      let interval = setInterval(() => {
        state('count', current => current + 1);
      }, state.value.delay);
      return () => clearInterval(interval);
    });

    await new Promise(resolve => setTimeout(() => resolve(), 2000));
    expect(state()).toEqual({count: 1, delay: 1000});
    expect(state.value).toEqual({count: 1, delay: 1000});
    state('delay', 500);
    await new Promise(resolve => setTimeout(() => resolve(), 2000));
    expect(state()).toEqual({count: 4, delay: 500});
    expect(state.value).toEqual({count: 4, delay: 500});
    effectInterval2.cleanup();
    await new Promise(resolve => setTimeout(() => resolve(), 2000));
    expect(state()).toEqual({count: 4, delay: 500});
    expect(state.value).toEqual({count: 4, delay: 500});
  });
});

describe('Hooks like pattern', () => {

  it('should create a simple counter', async () => {
    let Counter = (ms) => {
      let count = v.Signal(0);
      let interval = setInterval(() => {
        count.value = count.value + 1;
      }, ms);
      return () => <div v-remove={() => clearInterval(interval)}>{count.value}</div>;
    };

    let result = v.mount('div', Counter(1000));
    expect(result).toEqual('<div>0</div>');
    await new Promise(resolve => setTimeout(() => resolve(), 2050));
    result = v.update();
    expect(result).toEqual('<div>2</div>');
    v.unmount();
  });

  it('should create a counter with delay change', async () => {
    let Counter = (ms) => {
      let delay = v.Signal(ms);
      let count = v.Signal(0);
      let interval = delay((delay) => {
        let interval = setInterval(() => {
          count.value = count.value + 1;
        }, delay);
        return () => clearInterval(interval);
      });
      return () => <div v-remove={interval.cleanup}>{count.value}</div>;
    };

    let result = v.mount('div', Counter(1000));
    expect(result).toEqual('<div>0</div>');
    await new Promise(resolve => setTimeout(() => resolve(), 2050));
    result = v.update();
    expect(result).toEqual('<div>2</div>');
    v.unmount();
  });

  it('should create a counter with deep state', async () => {
    let Counter = (ms) => {
      let state = v.Signal({
        count: 0,
        delay: ms
      });
      let interval = state(() => {
        let interval = setInterval(() => {
          state('count', current => current + 1);
        }, state.value.delay);
        return () => clearInterval(interval);
      });
      return () => <div v-remove={interval.cleanup}>{state.value.count}</div>;
    };

    let result = v.mount('div', Counter(1000));
    expect(result).toEqual('<div>0</div>');
    await new Promise(resolve => setTimeout(() => resolve(), 2050));
    result = v.update();
    expect(result).toEqual('<div>2</div>');
    v.unmount();
  });
});
