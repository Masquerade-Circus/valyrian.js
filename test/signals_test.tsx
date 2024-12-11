import { expect, describe, test as it } from "bun:test";

import { v, mount } from "valyrian.js";
import { createSignalStore, createSignal, createEffect } from "valyrian.js/signals";

describe("Signals", () => {
  describe("createSignal", () => {
    it("should create a signal with an initial value", () => {
      const [count] = createSignal(0);
      expect(count()).toEqual(0);
    });

    it("should update the signal value when the setter is used", () => {
      const [count, setCount] = createSignal(0);
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
      const [count, setCount] = createSignal(0);
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
      const [signalA, setSignalA] = createSignal(0);
      const [signalB, setSignalB] = createSignal(100);
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
      const [count, setCount] = createSignal(0);
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
      const [count] = createSignal(0);

      function CounterComponent() {
        return v("div", {}, `Count: ${count()}`);
      }

      mount(dom, CounterComponent);

      expect(dom.innerHTML).toEqual("<div>Count: 0</div>");
    });

    it("should re-render the component when the signal changes", () => {
      const dom = document.createElement("div");
      const [count, setCount] = createSignal(0);

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
      const [countA, setCountA] = createSignal(1);
      const [countB, setCountB] = createSignal(2);

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
      const [count, setCount] = createSignal(0);
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
      const [sharedSignal, setSharedSignal] = createSignal(0);

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

      const [childCount, setChildCount] = createSignal(0);
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

      const [child1Count, setChild1Count] = createSignal(0);
      const [child2Count, setChild2Count] = createSignal(100);
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

      const [innerCount, setInnerCount] = createSignal(0);
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

describe("Signal Store", () => {
  describe("createSignalStore", () => {
    it("should create a store with an initial state", () => {
      const [state] = createSignalStore({ count: 0 });
      expect(state()).toEqual({ count: 0 });
    });

    it("should update a nested property in the store", () => {
      const [state, setState] = createSignalStore({ user: { name: "Alice", age: 25 } });
      expect(state().user.name).toEqual("Alice");
      setState("user.name", "Bob");
      expect(state().user.name).toEqual("Bob");
    });

    it("should execute the effect when the store state changes", () => {
      const [state, setState] = createSignalStore({ count: 0 });
      let effectValue = null;

      createEffect(() => {
        effectValue = state().count;
      });

      expect(effectValue).toEqual(0 as any);

      setState("count", 5);
      expect(effectValue).toEqual(5 as any);
    });

    it("should not re-execute the effect if the value does not change", () => {
      const [state, setState] = createSignalStore({ count: 0 });
      let effectExecutionCount = 0;

      createEffect(() => {
        effectExecutionCount++;
        state().count;
      });

      expect(effectExecutionCount).toEqual(1);

      setState("count", 0);
      expect(effectExecutionCount).toEqual(1);
    });

    it("should handle complex values (objects and arrays) correctly", () => {
      const [state, setState] = createSignalStore({
        users: [{ name: "Alice" }, { name: "Bob" }]
      });

      setState("users.0.name", "Charlie");

      expect(state().users[0].name).toEqual("Charlie");
    });

    it("should update only one property without affecting the others", () => {
      const [state, setState] = createSignalStore({
        countA: 0,
        countB: 100
      });

      setState("countA", 50);
      expect(state().countA).toEqual(50);
      expect(state().countB).toEqual(100);
    });
  });

  describe("Reactivity with components", () => {
    it("should re-render a component when the store state changes", () => {
      const dom = document.createElement("div");
      const [state, setState] = createSignalStore({ count: 0 });

      function CounterComponent() {
        return v("div", {}, `Count: ${state().count}`);
      }

      mount(dom, CounterComponent);

      expect(dom.innerHTML).toEqual("<div>Count: 0</div>");

      setState("count", 5);
      expect(dom.innerHTML).toEqual("<div>Count: 5</div>");
    });

    it("should not re-render the component if the state does not change", () => {
      const dom = document.createElement("div");
      const [state, setState] = createSignalStore({ count: 0 });
      let renderCount = 0;

      function CounterComponent() {
        renderCount++;
        return v("span", {}, `Count: ${state().count}`);
      }

      mount(dom, CounterComponent);

      expect(renderCount).toEqual(1);
      expect(dom.innerHTML).toEqual("<span>Count: 0</span>");

      setState("count", 0);
      expect(renderCount).toEqual(1);
      expect(dom.innerHTML).toEqual("<span>Count: 0</span>");
    });

    it("should re-render components that depend on specific properties of the store", () => {
      const dom = document.createElement("div");
      const [state, setState] = createSignalStore({
        countA: 1,
        countB: 2
      });

      function DualCounterComponent() {
        return v("span", {}, `Count A: ${state().countA} | Count B: ${state().countB}`);
      }

      mount(dom, DualCounterComponent);

      expect(dom.innerHTML).toEqual("<span>Count A: 1 | Count B: 2</span>");

      setState("countA", 5);
      expect(dom.innerHTML).toEqual("<span>Count A: 5 | Count B: 2</span>");

      setState("countB", 10);
      expect(dom.innerHTML).toEqual("<span>Count A: 5 | Count B: 10</span>");
    });
  });
});
