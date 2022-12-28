/* eslint-disable max-lines-per-function */
/* eslint-disable no-console */
import "valyrian.js/node";

import { afterEach, describe, it } from "mocha";
// eslint-disable-next-line no-unused-vars
import { mount, onCleanup, unmount, update, v } from "valyrian.js";

import { Signal } from "valyrian.js/signal";
import expect from "expect";

describe("Signal", () => {
  afterEach(unmount);

  it("should test basic signal", () => {
    let [count, setCount, subscribe] = Signal(0);
    subscribe(() => console.log(`The count is now ${count()}`));
    expect(count()).toEqual(0);
    setCount(1);
    expect(count()).toEqual(1);
    expect(`${count()}`).toEqual("1");
  });

  it("should test basic signal inside a component", async () => {
    let setCountOut = null;
    let countOut = null;

    function increment() {
      setCountOut(countOut() + 1);
    }

    function decrement() {
      setCountOut(countOut() - 1);
    }

    let componentCalls = 0;
    function Counter() {
      componentCalls++;
      const [count, setCount, subscribe] = Signal(0);
      setCountOut = setCount;
      countOut = count;
      subscribe(() => console.log(`The count is now ${count()}`));
      return (
        <div>
          <button onClick={decrement}>-</button>
          <span>{count()}</span>
          <button onClick={increment}>+</button>
        </div>
      );
    }

    let div = document.createElement("div");

    let res = mount(div, <Counter />);
    expect(res).toEqual("<div><button>-</button><span>0</span><button>+</button></div>");
    expect(div.innerHTML).toEqual("<div><button>-</button><span>0</span><button>+</button></div>");
    expect(componentCalls).toEqual(1);
    increment();
    expect(div.innerHTML).toEqual("<div><button>-</button><span>1</span><button>+</button></div>");
    expect(componentCalls).toEqual(2);
    increment();
    expect(componentCalls).toEqual(3);
    expect(div.innerHTML).toEqual("<div><button>-</button><span>2</span><button>+</button></div>");
    res = update();
    expect(res).toEqual("<div><button>-</button><span>2</span><button>+</button></div>");
  });

  it("should test basic signal outside a component", async () => {
    let [count, setCount, subscribe] = Signal(0);
    subscribe(() => console.log(`The count is now ${count()}`));

    function Counter() {
      return (
        <div>
          <button onClick={() => setCount(count() - 1)}>-</button>
          <button onClick={() => setCount(count() + 1)}>+</button>
        </div>
      );
    }

    function Display() {
      return (
        <div>
          <span>{count()}</span>
        </div>
      );
    }

    function App() {
      return (
        <div>
          <Counter />
          <Display />
        </div>
      );
    }

    let div = document.createElement("div");

    let res = mount(div, <App />);
    expect(res).toEqual("<div><div><button>-</button><button>+</button></div><div><span>0</span></div></div>");
    setCount(1);
    expect(div.innerHTML).toEqual(
      "<div><div><button>-</button><button>+</button></div><div><span>1</span></div></div>"
    );
    setCount(2);
    expect(div.innerHTML).toEqual(
      "<div><div><button>-</button><button>+</button></div><div><span>2</span></div></div>"
    );
    res = update();
    expect(res).toEqual("<div><div><button>-</button><button>+</button></div><div><span>2</span></div></div>");
  });

  it("should test multiple signals", () => {
    let setCountOut = null;
    let setCount2Out = null;
    function Counter() {
      const [count, setCount, subscribe] = Signal(0);
      const [count2, setCount2, subscribe2] = Signal(0);
      setCountOut = setCount;
      setCount2Out = setCount2;
      subscribe(() => console.log(`The count is now ${count()}`));
      subscribe2(() => console.log(`The count2 is now ${count2()}`));
      return (
        <div>
          <button onClick={() => setCount(count() - 1)}>-</button>
          <span>{count()}</span>
          <button onClick={() => setCount(count() + 1)}>+</button>
          <button onClick={() => setCount2(count2() - 1)}>-</button>
          <span>{count2()}</span>
          <button onClick={() => setCount2(count2() + 1)}>+</button>
        </div>
      );
    }

    let div = document.createElement("div");

    let res = mount(div, <Counter />);
    expect(res).toEqual(
      "<div><button>-</button><span>0</span><button>+</button><button>-</button><span>0</span><button>+</button></div>"
    );
    setCountOut(1);
    expect(div.innerHTML).toEqual(
      "<div><button>-</button><span>1</span><button>+</button><button>-</button><span>0</span><button>+</button></div>"
    );
    setCount2Out(1);
    expect(div.innerHTML).toEqual(
      "<div><button>-</button><span>1</span><button>+</button><button>-</button><span>1</span><button>+</button></div>"
    );
  });

  it("should test multiple component instances with signal inside component", () => {
    let setCountOut = null;
    function Counter() {
      const [count, setCount, subscribe] = Signal(0);
      setCountOut = setCount;
      subscribe(() => console.log(`The count is now ${count()}`));
      return (
        <div>
          <button onClick={() => setCount(count() - 1)}>-</button>
          <span>{count()}</span>
          <button onClick={() => setCount(count() + 1)}>+</button>
        </div>
      );
    }

    function App() {
      return (
        <div>
          <Counter />
          <Counter />
        </div>
      );
    }

    let div = document.createElement("div");

    let res = mount(div, <App />);
    expect(res).toEqual(
      "<div><div><button>-</button><span>0</span><button>+</button></div><div><button>-</button><span>0</span><button>+</button></div></div>"
    );
    setCountOut(1);
    expect(div.innerHTML).toEqual(
      "<div><div><button>-</button><span>0</span><button>+</button></div><div><button>-</button><span>1</span><button>+</button></div></div>"
    );
    setCountOut(2);
    expect(div.innerHTML).toEqual(
      "<div><div><button>-</button><span>0</span><button>+</button></div><div><button>-</button><span>2</span><button>+</button></div></div>"
    );
  });

  it("should test multiple component instances with signal outside component", () => {
    const [count, setCount] = Signal(0);
    function Counter() {
      return (
        <div>
          <button onClick={() => setCount(count() - 1)}>-</button>
          <span>{count()}</span>
          <button onClick={() => setCount(count() + 1)}>+</button>
        </div>
      );
    }

    function App() {
      return (
        <div>
          <Counter />
          <Counter />
        </div>
      );
    }

    let div = document.createElement("div");

    let res = mount(div, <App />);
    expect(res).toEqual(
      "<div><div><button>-</button><span>0</span><button>+</button></div><div><button>-</button><span>0</span><button>+</button></div></div>"
    );
    setCount(1);
    expect(div.innerHTML).toEqual(
      "<div><div><button>-</button><span>1</span><button>+</button></div><div><button>-</button><span>1</span><button>+</button></div></div>"
    );
    setCount(2);
    expect(div.innerHTML).toEqual(
      "<div><div><button>-</button><span>2</span><button>+</button></div><div><button>-</button><span>2</span><button>+</button></div></div>"
    );
  });

  it("should test signal inside a component with a signal outside the component", () => {
    let setCount1Out = null;
    let setCount2Out = null;
    let setCount3Out = null;

    function Counter() {
      let [count, setCount, subscribe] = Signal(0);
      if (!setCount1Out) {
        setCount1Out = setCount;
      } else if (!setCount2Out) {
        setCount2Out = setCount;
      }
      subscribe(() => console.log(`The count is now ${count()}`));
      return (
        <div id="counter">
          <button onClick={() => setCount(count() - 1)}>-</button>
          <span>{count()}</span>
          <button onClick={() => setCount(count() + 1)}>+</button>
        </div>
      );
    }

    function App() {
      let [count, setCount, subscribe] = Signal(0);
      setCount3Out = setCount;
      subscribe(() => console.log(`The app count is now ${count()}`));
      return (
        <div>
          <Counter />
          <Counter />
          <div id="count">{count()}</div>
        </div>
      );
    }

    let div = document.createElement("div");

    let res = mount(div, <App />);
    expect(res).toEqual(
      '<div><div id="counter"><button>-</button><span>0</span><button>+</button></div><div id="counter"><button>-</button><span>0</span><button>+</button></div><div id="count">0</div></div>'
    );
    setCount1Out(1);
    expect(div.innerHTML).toEqual(
      '<div><div id="counter"><button>-</button><span>1</span><button>+</button></div><div id="counter"><button>-</button><span>0</span><button>+</button></div><div id="count">0</div></div>'
    );
    setCount2Out(1);
    expect(div.innerHTML).toEqual(
      '<div><div id="counter"><button>-</button><span>1</span><button>+</button></div><div id="counter"><button>-</button><span>1</span><button>+</button></div><div id="count">0</div></div>'
    );
    setCount3Out(1);
    expect(div.innerHTML).toEqual(
      '<div><div id="counter"><button>-</button><span>1</span><button>+</button></div><div id="counter"><button>-</button><span>1</span><button>+</button></div><div id="count">1</div></div>'
    );
  });

  it("should handle change of components", async () => {
    let change = false;
    let Counter = () => {
      let [count, setCount] = Signal(0);
      let [name] = Signal("Hello");
      let interval = setInterval(() => setCount(count() + 1), 10);
      onCleanup(() => clearInterval(interval));
      return (
        <div>
          {count()} {name()}
        </div>
      );
    };

    let OtherCounter = () => {
      let [count, setCount] = Signal(10);
      let [name] = Signal("World");
      let interval = setInterval(() => setCount(count() + 1), 10);
      onCleanup(() => clearInterval(interval));
      return (
        <div>
          {count()} {name()}
        </div>
      );
    };

    function Component() {
      return change ? <OtherCounter /> : <Counter />;
    }

    let result = mount("div", Component);
    expect(result).toEqual("<div>0 Hello</div>");
    await new Promise((resolve) => setTimeout(() => resolve(), 28));
    change = true;
    result = update();
    expect(result).toEqual("<div>10 World</div>");
    await new Promise((resolve) => setTimeout(() => resolve(), 28));
    result = update();
    expect(result).toEqual("<div>12 World</div>");
    await new Promise((resolve) => setTimeout(() => resolve(), 28));
    result = update();
    expect(result).toEqual("<div>14 World</div>");
    change = false;
    result = update();
    expect(result).toEqual("<div>2 Hello</div>");
    unmount();
  });

  it("should handle a component with a v-for directive", () => {
    let [count, setCount] = Signal(0);
    let [items, setItems] = Signal([1, 2, 3]);
    let mainComponentCalls = 0;
    let itemComponentCalls = 0;
    function Item({ item }) {
      itemComponentCalls++;
      return (
        <div>
          {item} {item === 3 ? count() : ""}
        </div>
      );
    }
    let Component = () => {
      mainComponentCalls++;
      return <div v-for={items()}>{(item) => <Item item={item} />}</div>;
    };
    let div = document.createElement("div");
    let result = mount(div, Component);
    expect(result).toEqual("<div><div>1 </div><div>2 </div><div>3 0</div></div>");
    expect(mainComponentCalls).toEqual(1);
    expect(itemComponentCalls).toEqual(3);
    setCount(1);
    expect(div.innerHTML).toEqual("<div><div>1 </div><div>2 </div><div>3 1</div></div>");
    expect(mainComponentCalls).toEqual(1);
    expect(itemComponentCalls).toEqual(4); // Only the third item component should be called again
    setItems([1, 2, 3, 4]);
    expect(div.innerHTML).toEqual("<div><div>1 </div><div>2 </div><div>3 1</div><div>4 </div></div>");
    expect(mainComponentCalls).toEqual(2);
    expect(itemComponentCalls).toEqual(8); // All item components should be called again plus the new one
    setCount(2);
    expect(div.innerHTML).toEqual("<div><div>1 </div><div>2 </div><div>3 2</div><div>4 </div></div>");
    expect(mainComponentCalls).toEqual(2);
    expect(itemComponentCalls).toEqual(9); // Only the third item component should be called again
    setCount(3);
    expect(mainComponentCalls).toEqual(2);
    expect(itemComponentCalls).toEqual(10); // Only the third item component should be called again
    setItems([1, 2, 3, 4]);
    expect(mainComponentCalls).toEqual(3);
    expect(itemComponentCalls).toEqual(14); // All item components should be called again
    setCount(4);
    expect(mainComponentCalls).toEqual(3);
    expect(itemComponentCalls).toEqual(15); //Only the third item component should be called again
  });

  it("should handle a component with a v-for directive and child components", () => {
    let [count, setCount] = Signal(0);
    let [items, setItems] = Signal([1, 2, 3]);
    let mainComponentCalls = 0;
    let itemComponentCalls = 0;
    function Item({ item }) {
      itemComponentCalls++;
      return `${item} ${item === 3 ? count() : ""}`;
    }
    let Component = () => {
      mainComponentCalls++;
      return (
        <div v-for={items()}>
          {(item) => (
            <div>
              <Item item={item} />
            </div>
          )}
        </div>
      );
    };
    let div = document.createElement("div");
    let result = mount(div, Component);
    expect(result).toEqual("<div><div>1 </div><div>2 </div><div>3 0</div></div>");
    expect(mainComponentCalls).toEqual(1);
    expect(itemComponentCalls).toEqual(3);
    setCount(1);
    expect(div.innerHTML).toEqual("<div><div>1 </div><div>2 </div><div>3 1</div></div>");
    expect(mainComponentCalls).toEqual(1);
    expect(itemComponentCalls).toEqual(4); // Only the third item component should be called again
    setItems([1, 2, 3, 4]);
    expect(div.innerHTML).toEqual("<div><div>1 </div><div>2 </div><div>3 1</div><div>4 </div></div>");
    expect(mainComponentCalls).toEqual(2);
    expect(itemComponentCalls).toEqual(8); // All item components should be called again plus the new one
    setCount(2);
    expect(div.innerHTML).toEqual("<div><div>1 </div><div>2 </div><div>3 2</div><div>4 </div></div>");
    expect(mainComponentCalls).toEqual(2);
    expect(itemComponentCalls).toEqual(9); // Only the third item component should be called again
    setCount(3);
    expect(mainComponentCalls).toEqual(2);
    expect(itemComponentCalls).toEqual(10); // Only the third item component should be called again
    setItems([1, 2, 3, 4]);
    expect(mainComponentCalls).toEqual(3);
    expect(itemComponentCalls).toEqual(14); // All item components should be called again
    setCount(4);
    expect(mainComponentCalls).toEqual(3);
    expect(itemComponentCalls).toEqual(15); //Only the third item component should be called again
  });

  it("should handle the update from different children", () => {
    let [count, setCount] = Signal(0);
    function Child({ id }) {
      return <div id={id}>{count()}</div>;
    }
    function Child2({ id }) {
      return <div id={id}>{count()}</div>;
    }
    function Component() {
      return (
        <div>
          <div>
            <Child id="1" />
          </div>
          <div>
            <Child2 id="2" />
          </div>
        </div>
      );
    }
    let div = document.createElement("div");
    let result = mount(div, Component);
    expect(result).toEqual('<div><div><div id="1">0</div></div><div><div id="2">0</div></div></div>');
    setCount(1);
    expect(div.innerHTML).toEqual('<div><div><div id="1">1</div></div><div><div id="2">1</div></div></div>');
    setCount(2);
    expect(div.innerHTML).toEqual('<div><div><div id="1">2</div></div><div><div id="2">2</div></div></div>');
  });
});
