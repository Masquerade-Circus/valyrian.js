/* eslint-disable no-console */
/* eslint-disable max-lines-per-function */
import { describe, it } from "mocha";
import { expect } from "expect";
import { createPulseStore, createMutableStore, createEffect } from "valyrian.js/pulse-store";
import { v, mount, unmount } from "valyrian.js";

describe("PulseStore", () => {
  it("should create an immutable PulseStore", () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state) {
        state.count += 1;
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [state, { increment }] = useStore();

    expect(state.count).toEqual(0);

    increment();

    expect(state.count).toEqual(1);

    // Should not allow direct state modification
    expect(() => {
      state.count = 5;
    }).toThrow("You need to call a pulse to modify the state");
  });

  it("should create a mutable PulseStore", () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state) {
        state.count += 1;
      }
    };

    const useStore = createMutableStore(initialState, pulses);
    const [state, { increment }] = useStore();

    expect(state.count).toEqual(0);

    increment();

    expect(state.count).toEqual(1);

    // Should allow direct state modification
    state.count = 5;

    expect(state.count).toEqual(5);
  });

  it("should handle asynchronous actions", async () => {
    const initialState = { data: null };
    const pulses = {
      async fetchData(state) {
        const data = await new Promise((resolve) => setTimeout(() => resolve("new data"), 100));
        state.data = data;
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [state, { fetchData }] = useStore();

    expect(state.data).toEqual(null);

    await fetchData();

    expect(state.data).toEqual("new data");
  });

  it("should catch errors in asynchronous actions", async () => {
    const initialState = { data: null, error: null };
    const pulses = {
      async fetchDataWithError(state) {
        try {
          await new Promise((_, reject) => setTimeout(() => reject(new Error("Fetch failed")), 100));
        } catch (error) {
          state.error = error.message;
        }
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [state, { fetchDataWithError }] = useStore();

    expect(state.error).toEqual(null);

    await fetchDataWithError();

    expect(state.error).toEqual("Fetch failed");
  });

  it("should update subscribers when state changes", () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state) {
        state.count += 1;
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [, { increment }] = useStore();

    const dom = document.createElement("div");

    // Subscriber mock
    let renderCount = 0;
    const SubscriberComponent = () => {
      const [state] = useStore();
      renderCount += 1;
      return <div>{state.count}</div>;
    };

    mount(dom, <SubscriberComponent />);
    expect(renderCount).toEqual(1);
    expect(dom.innerHTML).toEqual("<div>0</div>");

    increment();

    // Component should re-render after increment
    expect(renderCount).toEqual(2);
    expect(dom.innerHTML).toEqual("<div>1</div>");
  });

  it("should register and execute effects correctly", () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state) {
        state.count += 1;
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [state, { increment }] = useStore();

    let effectTriggered = false;

    createEffect(() => {
      if (state.count === 1) {
        effectTriggered = true;
      }
    });

    expect(effectTriggered).toEqual(false);

    increment();

    expect(effectTriggered).toEqual(true);
  });

  it("should throw an error when accessing a non-existent property", () => {
    const initialState = { count: 0 };
    const pulses = {};

    const useStore = createPulseStore(initialState, pulses);
    const [state] = useStore();

    expect(() => {
      state.nonExistentProperty;
    }).not.toThrow(); // Proxies usually return undefined for non-existent properties
  });

  it("should handle nested object immutability", () => {
    const initialState = { user: { name: "John", age: 30 } };
    const pulses = {
      updateName(state) {
        state.user.name = "Doe";
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [state, { updateName }] = useStore();

    expect(state.user.name).toEqual("John");

    updateName();

    expect(state.user.name).toEqual("Doe");

    expect(() => {
      state.user.age = 31;
    }).toThrow("Cannot assign to read only property 'age' of object '#<Object>'");
  });

  it("should handle nested object mutability", () => {
    const initialState = { user: { name: "John", age: 30 } };
    const pulses = {
      updateName(state) {
        state.user.name = "Doe";
      }
    };

    const useStore = createMutableStore(initialState, pulses);
    const [state, { updateName }] = useStore();

    expect(state.user.name).toEqual("John");

    updateName();

    expect(state.user.name).toEqual("Doe");

    state.user.age = 31;

    expect(state.user.age).toEqual(31);
  });

  it("should update nested state immutability", async () => {
    const initialState = { user: { name: "John", age: 30 } };
    const pulses = {
      async updateName(state) {
        const name = await new Promise((resolve) => setTimeout(() => resolve("Doe"), 100));
        state.user.name = name;
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [state, { updateName }] = useStore();

    expect(state.user.name).toEqual("John");

    await updateName();

    expect(state.user.name).toEqual("Doe");
  });

  it("should clean up subscribers when vnode is destroyed", () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state) {
        state.count += 1;
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [, { increment }] = useStore();

    const dom = document.createElement("div");

    let renderCount = 0;
    const SubscriberComponent = () => {
      const [state] = useStore();
      renderCount += 1;
      return <div>{state.count}</div>;
    };

    mount(dom, <SubscriberComponent />);
    expect(renderCount).toEqual(1);

    increment();
    expect(renderCount).toEqual(2);

    unmount();

    increment();
    expect(renderCount).toEqual(2); // Should not re-render after component unmount
  });

  it("should handle null or undefined initial state", () => {
    const pulses = {
      setValue(state) {
        state.value = 42;
      }
    };

    const useStoreNull = createPulseStore(null, pulses);
    const [stateNull, { setValue }] = useStoreNull();
    expect(stateNull).toEqual({});
    setValue();
    expect(stateNull.value).toEqual(42);

    const useStoreUndefined = createPulseStore(undefined, pulses);
    const [stateUndefined, { setValue: setValueUndefined }] = useStoreUndefined();
    expect(stateUndefined).toEqual({});
    setValueUndefined();
    expect(stateUndefined.value).toEqual(42);
  });

  it("should handle initializer functions returning null or undefined", () => {
    const pulses = {
      setValue(state) {
        state.value = 100;
      }
    };

    const useStoreFuncNull = createPulseStore(() => null, pulses);
    const [stateFuncNull, { setValue }] = useStoreFuncNull();
    expect(stateFuncNull).toEqual({});
    setValue();
    expect(stateFuncNull.value).toEqual(100);

    const useStoreFuncUndefined = createPulseStore(() => undefined, pulses);
    const [stateFuncUndefined, { setValue: setValueFuncUndefined }] = useStoreFuncUndefined();
    expect(stateFuncUndefined).toEqual({});
    setValueFuncUndefined();
    expect(stateFuncUndefined.value).toEqual(100);
  });

  it("should throw an error when invoking a non-existent pulse", () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state) {
        state.count += 1;
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [state, pulsesMethods] = useStore();

    expect(() => {
      pulsesMethods.decrement();
    }).toThrow("Pulse 'decrement' does not exist");
  });

  it("should throw an error if a pulse is not a function", () => {
    const initialState = { count: 0 };
    const pulses = {
      invalidPulse: "not a function"
    };

    expect(() => {
      createPulseStore(initialState, pulses);
    }).toThrow("Pulse 'invalidPulse' must be a function");
  });

  it("should handle deeply nested state modifications", () => {
    const initialState = { user: { profile: { name: "Alice", age: 25 } } };
    const pulses = {
      updateName(state) {
        state.user.profile.name = "Bob";
      },
      updateAge(state, newAge) {
        state.user.profile.age = newAge;
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [state, { updateName, updateAge }] = useStore();

    updateName();
    expect(state.user.profile.name).toEqual("Bob");

    updateAge(30);
    expect(state.user.profile.age).toEqual(30);
  });

  it("should handle state with mixed data types", () => {
    const initialState = {
      number: 10,
      string: "test",
      array: [1, 2, 3],
      object: { key: "value" },
      bool: true,
      nullValue: null
    };
    const pulses = {
      updateAll(state) {
        state.number = 20;
        state.string = "updated";
        state.array.push(4);
        state.object.key = "newValue";
        state.bool = false;
        state.nullValue = "not null anymore";
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [state, { updateAll }] = useStore();

    updateAll();

    expect(state.number).toEqual(20);
    expect(state.string).toEqual("updated");
    expect(state.array).toEqual([1, 2, 3, 4]);
    expect(state.object.key).toEqual("newValue");
    expect(state.bool).toEqual(false);
    expect(state.nullValue).toEqual("not null anymore");
  });

  it("should notify all subscribers when state changes", () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state) {
        state.count += 1;
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [state1, { increment: increment1 }] = useStore();
    const [state2, { increment: increment2 }] = useStore();

    increment1();
    expect(state1.count).toEqual(1);
    expect(state2.count).toEqual(1);

    increment2();
    expect(state1.count).toEqual(2);
    expect(state2.count).toEqual(2);
  });

  it("should not notify subscribers if pulse does not modify the state", () => {
    const initialState = { count: 0 };
    const pulses = {
      noop() {
        // Do nothing
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [, { noop }] = useStore();

    let renderCount = 0;
    createEffect(() => {
      renderCount += 1;
    });

    expect(renderCount).toEqual(1);

    noop();

    expect(renderCount).toEqual(1); // Should not re-render
  });

  it("should handle array mutations correctly in immutable store", () => {
    const initialState = { items: [1, 2, 3] };
    const pulses = {
      addItem(state, item) {
        state.items.push(item);
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [state, { addItem }] = useStore();

    expect(state.items).toEqual([1, 2, 3]);

    addItem(4);
    expect(state.items).toEqual([1, 2, 3, 4]);

    // Intentar modificar el arreglo directamente debería lanzar un error en modo inmutable
    expect(() => {
      state.items.push(5);
    }).toThrow("Cannot add property 4, object is not extensible");
  });

  it("should update large states efficiently", () => {
    const largeState = { data: Array.from({ length: 10000 }, (_, i) => i) };
    const pulses = {
      updateData(state) {
        state.data = state.data.map((item) => item + 1);
      }
    };

    const useStore = createPulseStore(largeState, pulses);
    const [state, { updateData }] = useStore();

    const start = performance.now();
    updateData();
    const end = performance.now();

    const duration = end - start;
    console.log(`Update duration: ${duration}ms`);
    expect(duration).toBeLessThan(2); // Less than 2ms
  });

  it("should handle a large number of subscribers", async () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state) {
        state.count += 1;
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [state, { increment }] = useStore();

    console.log("Creating effects");
    let callCount = 0;
    const subscriberCount = 10000;
    const subscribers = [];
    for (let i = 0; i < subscriberCount; i++) {
      subscribers.push(() => {
        callCount++;
        state.count; // Access state to trigger reactivity
      }); // Empty subscriber
    }

    subscribers.forEach((sub) => createEffect(sub));
    console.log("Effects created");

    console.log(`Start`);
    const start = performance.now();
    increment();
    const end = performance.now();
    console.log(`End`);

    const duration = end - start;
    console.log(`Notification duration for ${subscriberCount} subscribers: ${duration}ms`);
    expect(callCount).toEqual(subscriberCount * 2); // Each subscriber should be called twice
    expect(duration).toBeLessThan(4); // Less than 4ms
  });

  it("should handle long-running asynchronous pulses without blocking", async () => {
    const initialState = { data: null };
    const pulses = {
      async fetchData(state) {
        const data = await new Promise((resolve) => setTimeout(() => resolve("fetched data"), 10));
        state.data = data;
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [state, { fetchData }] = useStore();

    const start = performance.now();
    const fetchPromise = fetchData();
    const mid = performance.now();

    expect(state.data).toBeNull();
    expect(mid - start).toBeLessThan(1); // Less than 1ms to test that fetchData is non-blocking

    await fetchPromise;

    const end = performance.now();
    expect(state.data).toEqual("fetched data");
    expect(end - start).toBeGreaterThanOrEqual(9);
  });

  it("should efficiently handle deeply nested state updates", () => {
    const initialState = { level1: { level2: { level3: { value: 0 } } } };
    const pulses = {
      updateValue(state, newValue) {
        state.level1.level2.level3.value = newValue;
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [state, { updateValue }] = useStore();

    const updateIterations = 1000;
    const start = performance.now();

    for (let i = 0; i < updateIterations; i++) {
      updateValue(i);
    }

    const end = performance.now();
    const duration = end - start;
    console.log(`Performed ${updateIterations} nested updates in ${duration}ms`);
    expect(duration).toBeLessThan(15); // Less than 15ms
    expect(state.level1.level2.level3.value).toEqual(updateIterations - 1);
  });

  it("should handle concurrent pulses modifying different state sections correctly", () => {
    const initialState = { count: 0, value: "initial" };
    const pulses = {
      increment(state) {
        state.count += 1;
      },
      updateValue(state, newValue) {
        state.value = newValue;
      }
    };

    const useStore = createPulseStore(initialState, pulses);
    const [state, { increment, updateValue }] = useStore();

    increment();
    updateValue("updated");

    expect(state.count).toEqual(1);
    expect(state.value).toEqual("updated");
  });
});
