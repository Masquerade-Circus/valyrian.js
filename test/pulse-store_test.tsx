/* eslint-disable no-console */
/* eslint-disable max-lines-per-function */
import "valyrian.js/node";
import { expect, describe, test as it } from "bun:test";
import { createPulse, createPulseStore, createMutableStore, createEffect } from "valyrian.js/pulses";
import { v, mount, unmount } from "valyrian.js";
import { wait } from "./utils/helpers";

describe("PulseStore", () => {
  it("should create an immutable PulseStore", () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state: any) {
        state.count += 1;
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    expect(pulseStore.state.count).toEqual(0);

    pulseStore.increment();

    expect(pulseStore.state.count).toEqual(1);

    // Should not allow direct state modification
    expect(() => {
      pulseStore.state.count = 5;
    }).toThrow("You need to call a pulse to modify the state");
  });

  it("should create a mutable PulseStore", () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state: any) {
        state.count += 1;
      }
    };

    const pulseStore = createMutableStore(initialState, pulses);

    expect(pulseStore.state.count).toEqual(0);

    pulseStore.increment();

    expect(pulseStore.state.count).toEqual(1);

    // Should allow direct state modification
    pulseStore.state.count = 5;

    expect(pulseStore.state.count).toEqual(5);
  });

  it("should handle asynchronous actions", async () => {
    const initialState = { data: null };
    const pulses = {
      async fetchData(state: any) {
        const data = await new Promise((resolve) => setTimeout(() => resolve("new data"), 100));
        state.data = data;
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    expect(pulseStore.state.data).toEqual(null);

    await pulseStore.fetchData();

    expect(pulseStore.state.data).toEqual("new data" as any);
  });

  it("should catch errors in asynchronous actions", async () => {
    const initialState = { data: null, error: null };
    const pulses = {
      async fetchDataWithError(state: any) {
        try {
          await new Promise((_, reject) => setTimeout(() => reject(new Error("Fetch failed")), 100));
        } catch (error) {
          state.error = (error as Error).message;
        }
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    expect(pulseStore.state.error).toEqual(null);

    await pulseStore.fetchDataWithError();

    expect(pulseStore.state.error).toEqual("Fetch failed" as any);
  });

  it("should update subscribers when state changes", async () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state: any) {
        state.count += 1;
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    const dom = document.createElement("div");
    document.body.appendChild(dom);

    // Subscriber mock
    let renderCount = 0;
    const SubscriberComponent = () => {
      renderCount += 1;
      return <div>{pulseStore.state.count}</div>;
    };

    mount(dom, <SubscriberComponent />);
    expect(renderCount).toEqual(1);
    expect(dom.innerHTML).toEqual("<div>0</div>");

    pulseStore.increment();
    await wait(0); // Wait for reactivity to trigger

    // Component should re-render after increment
    expect(renderCount).toEqual(2);
    expect(dom.innerHTML).toEqual("<div>1</div>");
  });

  it("should register and execute effects correctly", async () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state: any) {
        state.count += 1;
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    let effectTriggered = false;

    createEffect(() => {
      if (pulseStore.state.count === 1) {
        effectTriggered = true;
      }
    });

    expect(effectTriggered).toEqual(false);

    pulseStore.increment();
    await wait(0); // Wait for reactivity to trigger

    expect(effectTriggered).toEqual(true);
  });

  it("should throw an error when accessing a non-existent property", () => {
    const initialState = { count: 0 };
    const pulses = {};

    const pulseStore = createPulseStore(initialState, pulses);

    expect(() => {
      pulseStore.state.nonExistentProperty;
    }).not.toThrow(); // Proxies usually return undefined for non-existent properties
  });

  it("should handle nested object immutability", () => {
    const initialState = { user: { name: "John", age: 30 } };
    const pulses = {
      updateName(state: any) {
        state.user.name = "Doe";
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    expect(pulseStore.state.user.name).toEqual("John");

    pulseStore.updateName();

    expect(pulseStore.state.user.name).toEqual("Doe");

    expect(() => {
      pulseStore.state.user.age = 31;
    }).toThrow("Attempted to assign to readonly property");
  });

  it("should handle nested object mutability", () => {
    const initialState = { user: { name: "John", age: 30 } };
    const pulses = {
      updateName(state: any) {
        state.user.name = "Doe";
      }
    };

    const pulseStore = createMutableStore(initialState, pulses);

    expect(pulseStore.state.user.name).toEqual("John");

    pulseStore.updateName();

    expect(pulseStore.state.user.name).toEqual("Doe");

    pulseStore.state.user.age = 31;

    expect(pulseStore.state.user.age).toEqual(31);
  });

  it("should update nested state immutability", async () => {
    const initialState = { user: { name: "John", age: 30 } };
    const pulses = {
      async updateName(state: any) {
        const name = await new Promise((resolve) => setTimeout(() => resolve("Doe"), 100));
        state.user.name = name;
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    expect(pulseStore.state.user.name).toEqual("John");

    await pulseStore.updateName();

    expect(pulseStore.state.user.name).toEqual("Doe");
  });

  it("should clean up subscribers when vnode is destroyed", async () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state: any) {
        state.count += 1;
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    const dom = document.createElement("div");
    document.body.appendChild(dom);

    let renderCount = 0;
    const SubscriberComponent = () => {
      renderCount += 1;
      return <div>{pulseStore.state.count}</div>;
    };

    mount(dom, <SubscriberComponent />);
    expect(renderCount).toEqual(1);

    pulseStore.increment();
    await wait(0); // Wait for reactivity to trigger
    expect(renderCount).toEqual(2);

    unmount();

    pulseStore.increment();
    expect(renderCount).toEqual(2); // Should not re-render after component unmount
  });

  it("should handle null or undefined initial state", () => {
    const pulses = {
      setValue(state: any) {
        state.value = 42;
      }
    };

    const pulseStoreNull = createPulseStore(null as any, pulses);
    expect(pulseStoreNull.state).toEqual({});
    pulseStoreNull.setValue();
    expect(pulseStoreNull.state.value).toEqual(42);

    const pulseStoreUndefined = createPulseStore(undefined as any, pulses);
    expect(pulseStoreUndefined.state).toEqual({});
    pulseStoreUndefined.setValue();
    expect(pulseStoreUndefined.state.value).toEqual(42);
  });

  it("should handle initializer functions returning null or undefined", () => {
    const pulses = {
      setValue(state: any) {
        state.value = 100;
      }
    };

    const pulseStoreFuncNull = createPulseStore(() => null, pulses);
    expect(pulseStoreFuncNull.state).toEqual({} as any);
    pulseStoreFuncNull.setValue();
    expect(pulseStoreFuncNull.state.value).toEqual(100);

    const pulseStoreFuncUndefined = createPulseStore(() => undefined, pulses);
    expect(pulseStoreFuncUndefined.state).toEqual({} as any);
    pulseStoreFuncUndefined.setValue();
    expect(pulseStoreFuncUndefined.state.value).toEqual(100);
  });

  it("should throw an error when invoking a non-existent pulse", () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state: any) {
        pulseStore.state.count += 1;
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    expect(() => {
      (pulseStore as any).decrement();
    }).toThrow("Pulse 'decrement' does not exist");
  });

  it("should throw an error if a pulse is not a function", () => {
    const initialState = { count: 0 };
    const pulses = {
      invalidPulse: "not a function"
    };

    expect(() => {
      createPulseStore(initialState, pulses as any);
    }).toThrow("Pulse 'invalidPulse' must be a function");
  });

  it("should throw an error if a pulse is called state", () => {
    const initialState = { count: 0 };
    const pulses = {
      state(state: any) {
        state.count += 1;
      }
    };

    expect(() => {
      createPulseStore(initialState, pulses);
    }).toThrow("A pulse cannot be named 'state'");
  });

  it("should handle deeply nested state modifications", () => {
    const initialState = { user: { profile: { name: "Alice", age: 25 } } };
    const pulses = {
      updateName(state: any) {
        state.user.profile.name = "Bob";
      },
      updateAge(state: any, newAge: number) {
        state.user.profile.age = newAge;
      }
    };

    const { state, updateAge, updateName } = createPulseStore(initialState, pulses);

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
      updateAll(state: any) {
        state.number = 20;
        state.string = "updated";
        state.array.push(4);
        state.object.key = "newValue";
        state.bool = false;
        state.nullValue = "not null anymore";
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    pulseStore.updateAll();

    expect(pulseStore.state.number).toEqual(20);
    expect(pulseStore.state.string).toEqual("updated");
    expect(pulseStore.state.array).toEqual([1, 2, 3, 4]);
    expect(pulseStore.state.object.key).toEqual("newValue");
    expect(pulseStore.state.bool).toEqual(false);
    expect(pulseStore.state.nullValue).toEqual("not null anymore" as any);
  });

  it("should not notify subscribers if pulse does not modify the state", () => {
    const initialState = { count: 0 };
    const pulses = {
      noop() {
        // Do nothing
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    let renderCount = 0;
    createEffect(() => {
      renderCount += 1;
    });

    expect(renderCount).toEqual(1);

    pulseStore.noop();

    expect(renderCount).toEqual(1); // Should not re-render
  });

  it('should notify subscribers only once if multiple pulses are called in the same "tick"', async () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state: any) {
        state.count += 1;
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    let renderCount = 0;
    createEffect(() => {
      console.log("Effect triggered");
      renderCount += 1;
    });

    expect(renderCount).toEqual(1);

    pulseStore.increment();
    pulseStore.increment();
    pulseStore.increment();

    expect(renderCount).toEqual(1); // Should only re-render once
    expect(pulseStore.state.count).toEqual(3);
  });

  it('should notify subscribers after a while if multiple pulses are called in the same "tick"', async () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state: any) {
        state.count += 1;
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    let renderCount = 0;
    createEffect(() => {
      pulseStore.state.count; // Access state to trigger reactivity
      renderCount += 1;
    });

    expect(renderCount).toEqual(1);

    pulseStore.increment();
    pulseStore.increment();
    pulseStore.increment();

    expect(renderCount).toEqual(1); // Should only re-render once
    expect(pulseStore.state.count).toEqual(3);

    await wait(0);

    pulseStore.increment();

    expect(renderCount).toEqual(2); // Should re-render after a while
    expect(pulseStore.state.count).toEqual(4);
  });

  it("should notify subscribers only once if a pulse is called in another pulse", async () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state: any) {
        state.count += 1;
      },
      incrementTwice(state: any) {
        state.count += 2;
        this.increment(state);
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    let renderCount = 0;
    createEffect(() => {
      pulseStore.state.count; // Access state to trigger reactivity
      renderCount += 1;
    });

    expect(renderCount).toEqual(1);

    pulseStore.incrementTwice();

    await wait(0); // Wait for reactivity to trigger

    expect(renderCount).toEqual(2); // Should only re-render once
    expect(pulseStore.state.count).toEqual(3);
  });

  it("should handle array mutations correctly in immutable store", () => {
    const initialState = { items: [1, 2, 3] };
    const pulses = {
      addItem(state: any, item: number) {
        state.items.push(item);
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    expect(pulseStore.state.items).toEqual([1, 2, 3]);

    pulseStore.addItem(4);
    expect(pulseStore.state.items).toEqual([1, 2, 3, 4]);

    // Intentar modificar el arreglo directamente debería lanzar un error en modo inmutable
    expect(() => {
      pulseStore.state.items.push(5);
    }).toThrow("Attempted to assign to readonly property");
  });

  it("should update large states efficiently", () => {
    const largeState = { data: Array.from({ length: 10000 }, (_, i) => i) };
    const pulses = {
      updateData(state: any) {
        state.data = state.data.map((item: number) => item + 1);
      }
    };

    const pulseStore = createPulseStore(largeState, pulses);

    const start = performance.now();
    pulseStore.updateData();
    const end = performance.now();

    const duration = end - start;
    console.log(`Update duration: ${duration}ms`);
    expect(duration).toBeLessThan(10); // Less than 10ms
  });

  it("should handle a large number of subscribers", async () => {
    const initialState = { count: 0 };
    const pulses = {
      increment(state: any) {
        state.count += 1;
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    console.log("Creating effects");
    let callCount = 0;
    const subscriberCount = 10000;
    for (let i = 0; i < subscriberCount; i++) {
      createEffect(() => {
        callCount++;
        pulseStore.state.count; // Access state to trigger reactivity
      }); // Empty subscriber
    }
    console.log("Effects created");

    console.log(`Start`);
    const start = performance.now();
    pulseStore.increment();
    await wait(0); // Wait for reactivity to trigger
    const end = performance.now();
    console.log(`End`);

    const duration = end - start;
    console.log(`Notification duration for ${subscriberCount} subscribers: ${duration}ms`);
    expect(callCount).toEqual(subscriberCount * 2); // Each subscriber should be called twice
    expect(duration).toBeLessThan(10); // Less than 10ms
  });

  it("should handle long-running asynchronous pulses without blocking", async () => {
    const initialState = { data: null };
    const pulses = {
      async fetchData(state: any) {
        const data = await new Promise((resolve) => setTimeout(() => resolve("fetched data"), 10));
        state.data = data;
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    const start = performance.now();
    const fetchPromise = pulseStore.fetchData();
    const mid = performance.now();

    expect(pulseStore.state.data).toBeNull();
    expect(mid - start).toBeLessThan(1); // Less than 1ms to test that fetchData is non-blocking

    await fetchPromise;

    const end = performance.now();
    expect(pulseStore.state.data).toEqual("fetched data" as any);
    expect(end - start).toBeGreaterThanOrEqual(6);
  });

  it("should efficiently handle deeply nested state updates", () => {
    const initialState = { level1: { level2: { level3: { value: 0 } } } };
    const pulses = {
      updateValue(state: any, newValue: number) {
        state.level1.level2.level3.value = newValue;
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    const updateIterations = 1000;
    const start = performance.now();

    for (let i = 0; i < updateIterations; i++) {
      pulseStore.updateValue(i);
    }

    const end = performance.now();
    const duration = end - start;
    console.log(`Performed ${updateIterations} nested updates in ${duration}ms`);
    expect(duration).toBeLessThan(5); // Less than 5ms
    expect(pulseStore.state.level1.level2.level3.value).toEqual(updateIterations - 1);
  });

  it("should handle concurrent pulses modifying different state sections correctly", () => {
    const initialState = { count: 0, value: "initial" };
    const pulses = {
      increment(state: any) {
        state.count += 1;
      },
      updateValue(state: any, newValue: string) {
        state.value = newValue;
      }
    };

    const pulseStore = createPulseStore(initialState, pulses);

    pulseStore.increment();
    pulseStore.updateValue("updated");

    expect(pulseStore.state.count).toEqual(1);
    expect(pulseStore.state.value).toEqual("updated");
  });
});

describe("Single pulses", () => {
  describe("createPulse", () => {
    it("should create a signal with an initial value", () => {
      const [count] = createPulse(0);
      expect(count()).toEqual(0);
    });

    it("should update the signal value when the setter is used", () => {
      const [count, setCount] = createPulse(0);
      setCount(5);
      expect(count()).toEqual(5);
    });
  });

  describe("createEffect", () => {
    it("should execute the effect when initialized", () => {
      let effectExecuted = false;
      createEffect(() => {
        effectExecuted = true;
      });
      expect(effectExecuted).toEqual(true);
    });

    it("should re-execute the effect when a signal used in the effect changes", () => {
      const [count, setCount] = createPulse(0);
      let effectValue = null;

      createEffect(() => {
        effectValue = count();
      });

      expect(effectValue).toEqual(0 as any);

      setCount(10);
      expect(effectValue).toEqual(10 as any);
    });
  });

  describe("Iteration between multiple signals", () => {
    it("should update effects when multiple signals change", () => {
      const [signalA, setSignalA] = createPulse(0);
      const [signalB, setSignalB] = createPulse(100);
      let result = null;

      createEffect(() => {
        result = signalA() + signalB();
      });

      expect(result).toEqual(100 as any);

      setSignalA(50);
      expect(result).toEqual(150 as any);

      setSignalB(200);
      expect(result).toEqual(250 as any);
    });
  });

  describe("Effect execution control", () => {
    it("should not re-execute the effect if the value does not change", () => {
      const [count, setCount] = createPulse(0);
      let effectExecutionCount = 0;

      createEffect(() => {
        effectExecutionCount++;
        count();
      });

      expect(effectExecutionCount).toEqual(1);

      setCount(0);
      expect(effectExecutionCount).toEqual(1);
    });
  });

  describe("Components using signals", () => {
    it("should render a component using a signal", () => {
      const dom = document.createElement("div");
      const [count] = createPulse(0);

      function CounterComponent() {
        return v("div", {}, `Count: ${count()}`);
      }

      mount(dom, CounterComponent);

      expect(dom.innerHTML).toEqual("<div>Count: 0</div>");
    });

    it("should re-render the component when the signal changes", () => {
      const dom = document.createElement("div");
      document.body.appendChild(dom);
      const [count, setCount] = createPulse(0);

      function CounterComponent() {
        return v("span", {}, `Count: ${count()}`);
      }

      mount(dom, CounterComponent);

      expect(dom.innerHTML).toEqual("<span>Count: 0</span>");

      setCount(5);

      expect(dom.innerHTML).toEqual("<span>Count: 5</span>");
    });

    it("should update the component when any of the signals change", () => {
      const dom = document.createElement("div");
      document.body.appendChild(dom);
      const [countA, setCountA] = createPulse(1);
      const [countB, setCountB] = createPulse(2);

      function DualCounterComponent() {
        return v("span", {}, `Count A: ${countA()} | Count B: ${countB()}`);
      }

      mount(dom, DualCounterComponent);

      expect(dom.innerHTML).toEqual("<span>Count A: 1 | Count B: 2</span>");

      setCountA(5);
      expect(dom.innerHTML).toEqual("<span>Count A: 5 | Count B: 2</span>");

      setCountB(10);
      expect(dom.innerHTML).toEqual("<span>Count A: 5 | Count B: 10</span>");
    });

    it("should not re-render if the signal does not change", () => {
      const dom = document.createElement("div");
      const [count, setCount] = createPulse(0);
      let renderCount = 0;

      function CounterComponent() {
        renderCount++;
        return v("span", {}, `Count: ${count()}`);
      }

      mount(dom, CounterComponent);

      expect(renderCount).toEqual(1);
      expect(dom.innerHTML).toEqual("<span>Count: 0</span>");

      setCount(0);
      expect(renderCount).toEqual(1);
      expect(dom.innerHTML).toEqual("<span>Count: 0</span>");
    });

    it("should re-render both components when the shared signal changes", () => {
      const dom1 = document.createElement("div");
      const dom2 = document.createElement("div");
      document.body.appendChild(dom1);
      document.body.appendChild(dom2);
      const [sharedSignal, setSharedSignal] = createPulse(0);

      function FirstComponent() {
        return v("span", {}, `First: ${sharedSignal()}`);
      }

      function SecondComponent() {
        return v("span", {}, `Second: ${sharedSignal()}`);
      }

      mount(dom1, FirstComponent);
      mount(dom2, SecondComponent);

      expect(dom1.innerHTML).toEqual("<span>First: 0</span>");
      expect(dom2.innerHTML).toEqual("<span>Second: 0</span>");

      setSharedSignal(100);

      expect(dom1.innerHTML).toEqual("<span>First: 100</span>");
      expect(dom2.innerHTML).toEqual("<span>Second: 100</span>");
    });
  });

  describe("Selective re-rendering within components", () => {
    it("should re-render only the child component affected by the signal", () => {
      const dom = document.createElement("div");
      document.body.appendChild(dom);

      const [childCount, setChildCount] = createPulse(0);
      let parentRenderCount = 0;
      let childRenderCount = 0;

      function ChildComponent() {
        childRenderCount++;
        return v("span", {}, `Child Count: ${childCount()}`);
      }

      function ParentComponent() {
        parentRenderCount++;
        return (
          <div>
            <h1>Parent Component</h1>
            <ChildComponent />
          </div>
        );
      }

      mount(dom, ParentComponent);

      expect(dom.innerHTML).toEqual("<div><h1>Parent Component</h1><span>Child Count: 0</span></div>");
      expect(parentRenderCount).toEqual(1);
      expect(childRenderCount).toEqual(1);

      setChildCount(5);

      expect(dom.innerHTML).toEqual("<div><h1>Parent Component</h1><span>Child Count: 5</span></div>");
      expect(parentRenderCount).toEqual(1);
      expect(childRenderCount).toEqual(2);
    });

    it("should re-render only the affected child component", () => {
      const dom = document.createElement("div");

      const [child1Count, setChild1Count] = createPulse(0);
      const [child2Count, setChild2Count] = createPulse(100);
      let parentRenderCount = 0;
      let child1RenderCount = 0;
      let child2RenderCount = 0;

      function Child1Component() {
        child1RenderCount++;
        return `Child 1 Count: ${child1Count()}`;
      }

      function Child2Component() {
        child2RenderCount++;
        return `Child 2 Count: ${child2Count()}`;
      }

      function ParentComponent() {
        parentRenderCount++;

        return (
          <div>
            <h1>Parent Component</h1>
            <span>
              <Child1Component />
            </span>
            <span>
              <Child2Component />
            </span>
          </div>
        );
      }

      mount(dom, ParentComponent);

      // Verificamos el renderizado inicial
      expect(dom.innerHTML).toEqual(
        "<div><h1>Parent Component</h1><span>Child 1 Count: 0</span><span>Child 2 Count: 100</span></div>"
      );
      expect(parentRenderCount).toEqual(1);
      expect(child1RenderCount).toEqual(1);
      expect(child2RenderCount).toEqual(1);

      setChild1Count(5);

      expect(dom.innerHTML).toEqual(
        "<div><h1>Parent Component</h1><span>Child 1 Count: 5</span><span>Child 2 Count: 100</span></div>"
      );
      expect(parentRenderCount).toEqual(1);
      expect(child1RenderCount).toEqual(2);
      expect(child2RenderCount).toEqual(1);

      setChild2Count(200);

      expect(dom.innerHTML).toEqual(
        "<div><h1>Parent Component</h1><span>Child 1 Count: 5</span><span>Child 2 Count: 200</span></div>"
      );
      expect(parentRenderCount).toEqual(1);
      expect(child1RenderCount).toEqual(2);
      expect(child2RenderCount).toEqual(2);
    });

    it("should re-render only the affected nested component", () => {
      const dom = document.createElement("div");

      const [innerCount, setInnerCount] = createPulse(0);
      let outerRenderCount = 0;
      let innerRenderCount = 0;

      function InnerComponent() {
        innerRenderCount++;
        return <span>Inner Count: {innerCount()}</span>;
      }

      function OuterComponent() {
        outerRenderCount++;
        return (
          <div>
            <h1>Outer Component</h1>
            <InnerComponent />
          </div>
        );
      }

      mount(dom, OuterComponent);

      expect(dom.innerHTML).toEqual("<div><h1>Outer Component</h1><span>Inner Count: 0</span></div>");
      expect(outerRenderCount).toEqual(1);
      expect(innerRenderCount).toEqual(1);

      setInnerCount(10);

      expect(dom.innerHTML).toEqual("<div><h1>Outer Component</h1><span>Inner Count: 10</span></div>");
      expect(outerRenderCount).toEqual(1);
      expect(innerRenderCount).toEqual(2);
    });
  });
});
