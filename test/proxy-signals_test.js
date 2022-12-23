import "valyrian.js/node";

import { mount, onUnmount, unmount, update, v } from "valyrian.js";

import { ProxySignal } from "../lib/proxy-signal";
import expect from "expect";

describe("ProxySignals", () => {
  it("should create a signal", async () => {
    // Create signal
    let counter = ProxySignal(0);

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
    counter.getter("hello", (val) => "hello " + val);

    // Pure computed
    let computed = counter((val) => "hello " + val);

    // Unlinked Pure computed
    let unlinked = ProxySignal(() => "hello " + counter.value);

    let interval = setInterval(() => (counter.value += 1), 10);
    expect(counter.hello).toEqual("hello 0");
    expect(computed()).toEqual("hello 0");
    expect(computed.value).toEqual("hello 0");
    expect(unlinked()).toEqual("hello 0");
    expect(unlinked.value).toEqual("hello 0");

    await new Promise((resolve) => setTimeout(() => resolve(), 22));
    // effect.unsubscribe();
    counter.cleanup();
    expect(counter.hello).toEqual("hello 2");
    expect(computed()).toEqual("hello 2");
    expect(computed.value).toEqual("hello 2");
    expect(unlinked()).toEqual("hello 2");
    expect(unlinked.value).toEqual("hello 2");

    await new Promise((resolve) => setTimeout(() => resolve(), 22));
    clearInterval(interval);
    expect(counter.hello).toEqual("hello 4");
    expect(computed()).toEqual("hello 4");
    expect(computed.value).toEqual("hello 4");
    expect(unlinked()).toEqual("hello 4");
    expect(unlinked.value).toEqual("hello 4");
  });

  it("should test effect cleanup", async () => {
    let delay = ProxySignal(10);
    let count = ProxySignal(0);
    let effectInterval = delay((delay) => {
      let interval = setInterval(() => {
        count.value = count.value + 1;
      }, delay);
      return () => clearInterval(interval);
    });

    await new Promise((resolve) => setTimeout(() => resolve(), 10));
    expect(count()).toEqual(1);
    expect(count.value).toEqual(1);
    delay(5);
    await new Promise((resolve) => setTimeout(() => resolve(), 20));
    expect(count()).toEqual(4);
    expect(count.value).toEqual(4);
    effectInterval.cleanup();
    await new Promise((resolve) => setTimeout(() => resolve(), 20));
    expect(count()).toEqual(4);
    expect(count.value).toEqual(4);
    delay.cleanup();
    count.cleanup();
  });

  it("should test deep state effect cleanup", async () => {
    let state = ProxySignal({
      count: 0,
      delay: 10
    });
    let effectInterval2 = state(() => {
      let interval = setInterval(() => {
        state("count", (current) => current + 1);
      }, state.value.delay);
      return () => clearInterval(interval);
    });

    await new Promise((resolve) => setTimeout(() => resolve(), 10));
    expect(state()).toEqual({ count: 1, delay: 10 });
    expect(state.value).toEqual({ count: 1, delay: 10 });
    state("delay", 5);
    await new Promise((resolve) => setTimeout(() => resolve(), 20));
    expect(state()).toEqual({ count: 4, delay: 5 });
    expect(state.value).toEqual({ count: 4, delay: 5 });
    effectInterval2.cleanup();
    await new Promise((resolve) => setTimeout(() => resolve(), 20));
    expect(state()).toEqual({ count: 4, delay: 5 });
    expect(state.value).toEqual({ count: 4, delay: 5 });
  });
});

describe("Hooks like pattern", () => {
  it("should create a simple counter", async () => {
    let Counter = (ms) => {
      let count = ProxySignal(0);
      let interval = setInterval(() => {
        count.value = count.value + 1;
      }, ms);
      onUnmount(() => clearInterval(interval));
      return () => <div>{count.value}</div>;
    };

    let Component = Counter(10);

    let result = mount("div", Component);
    expect(result).toEqual("<div>0</div>");
    await new Promise((resolve) => setTimeout(() => resolve(), 25));
    result = update();
    expect(result).toEqual("<div>2</div>");
    unmount();
  });

  it("should create a counter with delay change", async () => {
    let Counter = (ms) => {
      let delay = ProxySignal(ms);
      let count = ProxySignal(0);
      let interval = delay((delay) => {
        let interval = setInterval(() => {
          count.value = count.value + 1;
        }, delay);
        return () => clearInterval(interval);
      });
      onUnmount(() => interval.cleanup());
      return () => <div>{count.value}</div>;
    };

    let Component = Counter(10);

    let result = mount("div", Component);
    expect(result).toEqual("<div>0</div>");
    await new Promise((resolve) => setTimeout(() => resolve(), 22));
    result = update();
    expect(result).toEqual("<div>2</div>");
    unmount();
  });

  it("should create a counter with deep state", async () => {
    let Counter = (ms) => {
      let state = ProxySignal({
        count: 0,
        delay: ms
      });
      let interval = state(() => {
        let interval = setInterval(() => {
          state("count", (current) => current + 1);
        }, state.value.delay);
        return () => clearInterval(interval);
      });
      onUnmount(() => interval.cleanup());
      return () => <div>{state.value.count}</div>;
    };

    let Component = Counter(10);

    let result = mount("div", Component);
    expect(result).toEqual("<div>0</div>");
    await new Promise((resolve) => setTimeout(() => resolve(), 25));
    result = update();
    expect(result).toEqual("<div>2</div>");
    unmount();
  });
});
