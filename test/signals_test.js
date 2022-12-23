/* eslint-disable no-console */
import "valyrian.js/node";

import { describe, it } from "mocha";
// eslint-disable-next-line no-unused-vars
import { mount, update, v } from "valyrian.js";

import { Signal } from "valyrian.js/signal";
import expect from "expect";

describe("Signal", () => {
  it("should test basic signal", () => {
    let [count, setCount, subscribe] = Signal(0);
    subscribe(() => console.log(`The count is now ${count}`));
    expect(count()).toEqual(0);
    setCount(1);
    expect(count.value).toEqual(1);
    expect(`${count}`).toEqual("1");
  });

  it("should test basic signal inside a component", async () => {
    let setCountOut = null;
    let countOut = null;

    function increment() {
      setCountOut(countOut + 1);
    }

    function decrement() {
      setCountOut(countOut - 1);
    }

    function Counter() {
      const [count, setCount, subscribe] = Signal(0);
      setCountOut = setCount;
      countOut = count;
      subscribe(() => console.log(`The count is now ${count}`));
      return (
        <div>
          <button onClick={decrement}>-</button>
          <span>{count}</span>
          <button onClick={increment}>+</button>
        </div>
      );
    }

    let div = document.createElement("div");

    let res = mount(div, <Counter />);
    expect(res).toEqual("<div><button>-</button><span>0</span><button>+</button></div>");
    increment();
    expect(div.innerHTML).toEqual("<div><button>-</button><span>1</span><button>+</button></div>");
    increment();
    expect(div.innerHTML).toEqual("<div><button>-</button><span>2</span><button>+</button></div>");
    res = update();
    expect(res).toEqual("<div><button>-</button><span>2</span><button>+</button></div>");
  });

  it("should test basic signal outside a component", async () => {
    let [count, setCount, subscribe] = Signal(0);
    subscribe(() => console.log(`The count is now ${count}`));

    function Counter() {
      return (
        <div>
          <button onClick={() => setCount(count - 1)}>-</button>
          <button onClick={() => setCount(count + 1)}>+</button>
        </div>
      );
    }

    function Display() {
      return (
        <div>
          <span>{count}</span>
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
      subscribe(() => console.log(`The count is now ${count}`));
      subscribe2(() => console.log(`The count2 is now ${count2}`));
      return (
        <div>
          <button onClick={() => setCount(count - 1)}>-</button>
          <span>{count}</span>
          <button onClick={() => setCount(count + 1)}>+</button>
          <button onClick={() => setCount2(count2 - 1)}>-</button>
          <span>{count2}</span>
          <button onClick={() => setCount2(count2 + 1)}>+</button>
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
      subscribe(() => console.log(`The count is now ${count}`));
      return (
        <div id="counter">
          <button onClick={() => setCount(count - 1)}>-</button>
          <span>{count}</span>
          <button onClick={() => setCount(count + 1)}>+</button>
        </div>
      );
    }

    function App() {
      let [count, setCount, subscribe] = Signal(0);
      setCount3Out = setCount;
      subscribe(() => console.log(`The app count is now ${count}`));
      return (
        <div>
          <Counter />
          <Counter />
          <div id="count">{count}</div>
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
});
