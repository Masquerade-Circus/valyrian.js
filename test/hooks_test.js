import "valyrian.js/node";

// eslint-disable-next-line no-unused-vars
import { mount, onCleanup, unmount, update, v } from "valyrian.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "valyrian.js/hooks";

/* eslint-disable max-lines-per-function */
import expect from "expect";

describe("Hooks", () => {
  afterEach(unmount);
  describe("State hook", () => {
    it("should handle a component state", async () => {
      const Counter = () => {
        const [count, setCount] = useState(0);
        const interval = setInterval(() => setCount(count() + 1), 10);
        onCleanup(() => clearInterval(interval));
        return <div>{count()}</div>;
      };

      let result = mount("div", Counter);
      expect(result).toEqual("<div>0</div>");
      await new Promise((resolve) => setTimeout(() => resolve(), 35));
      result = update();
      expect(result).toEqual("<div>2</div>");
      unmount();
    });

    it("should handle subcomponents state and onCleanup", async () => {
      const Ok = () => {
        const [ok, setOk] = useState("ok");
        const interval = setInterval(() => setOk("not ok"), 10);
        onCleanup(() => clearInterval(interval));
        return <div>{ok()}</div>;
      };

      const Counter = () => {
        const [count, setCount] = useState(0);
        const interval = setInterval(() => setCount(count() + 1), 10);
        onCleanup(() => clearInterval(interval));
        return (
          <div>
            {count()} <Ok />
          </div>
        );
      };

      unmount();

      let result = mount("div", Counter);
      expect(result).toEqual("<div>0 <div>ok</div></div>");
      await new Promise((resolve) => setTimeout(() => resolve(), 35));
      result = update();
      expect(result).toEqual("<div>2 <div>not ok</div></div>");
      unmount();
    });

    it("should handle change of components", async () => {
      let change = false;
      const Counter = () => {
        const [count, setCount] = useState(0);
        const [name] = useState("Hello");
        const interval = setInterval(() => setCount(count() + 1), 10);
        onCleanup(() => clearInterval(interval));
        return (
          <div>
            {count()} {name()}
          </div>
        );
      };

      const OtherCounter = () => {
        const [count, setCount] = useState(10);
        const [name] = useState("World");
        const interval = setInterval(() => setCount(count() + 1), 10);
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
      await new Promise((resolve) => setTimeout(() => resolve(), 35));
      change = true;
      result = update();
      expect(result).toEqual("<div>10 World</div>");
      await new Promise((resolve) => setTimeout(() => resolve(), 35));
      result = update();
      expect(result).toEqual("<div>12 World</div>");
      await new Promise((resolve) => setTimeout(() => resolve(), 35));
      result = update();
      expect(result).toEqual("<div>14 World</div>");
      change = false;
      result = update();
      expect(result).toEqual("<div>2 Hello</div>");
      unmount();
    });
  });

  describe("Effect hook", () => {
    it("should call the effect at first render", () => {
      let count = 0;
      const Component = function () {
        useEffect(() => count++, []);
        return <div>{count}</div>;
      };

      let response = mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = update();
      expect(response).toEqual("<div>1</div>");
    });

    it("should call the effect at every update", () => {
      let count = 0;
      const Component = function () {
        useEffect(() => count++);
        return <div>{count}</div>;
      };

      let response = mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = update();
      expect(response).toEqual("<div>2</div>");
    });

    it("should handle onCleanup", () => {
      let count = 0;
      const Component = function () {
        useEffect(() => {
          count++;
          return () => (count -= 2);
        });
        return <div>{count}</div>;
      };

      let response = mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = update();
      expect(response).toEqual("<div>0</div>");
    });

    it("should not call the effect if the change array is passed and there are no changes", () => {
      let count = 0;
      const Component = function () {
        useEffect(() => count++, [1]);
        return <div>{count}</div>;
      };

      let response = mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = update();
      expect(response).toEqual("<div>1</div>");
    });

    it("should not call the effect if the change array is passed and is an empty array", () => {
      let count = 0;
      const Component = function () {
        useEffect(() => count++, []);
        return <div>{count}</div>;
      };

      let response = mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = update();
      expect(response).toEqual("<div>1</div>");
    });

    it("should call the effect if the change array is passed and there are changes", () => {
      let count = 0;
      const Component = function () {
        useEffect(() => count++, [count]);
        return <div>{count}</div>;
      };

      let response = mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = update();
      expect(response).toEqual("<div>2</div>");
    });

    it("should call onCleanup even if the changes array is passed and there are changes", () => {
      let count = 0;
      const Component = function () {
        useEffect(() => {
          count++;
          return () => count++;
        }, [count]);
        return <div>{count}</div>;
      };

      let response = mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = update();
      expect(response).toEqual("<div>3</div>");
      response = update();
      expect(response).toEqual("<div>5</div>");
    });

    it("should handle onCleanup on unMount", () => {
      let count = 0;
      const Component = function () {
        useEffect(() => {
          count++;
          return () => (count -= 2);
        });
        return <div>{count}</div>;
      };

      let response = mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      expect(count).toEqual(1);

      response = update();
      expect(response).toEqual("<div>0</div>");
      expect(count).toEqual(0);

      response = unmount();
      expect(response).toEqual("");
      expect(count).toEqual(-2);
    });

    it("should call the effect only in the unmount", () => {
      let count = 0;
      const Component = function () {
        useEffect(() => {
          count++;
        }, null);
        return <div>{count}</div>;
      };

      let response = mount("body", Component);
      expect(response).toEqual("<div>0</div>");
      expect(count).toEqual(0);

      response = update();
      expect(response).toEqual("<div>0</div>");
      expect(count).toEqual(0);

      response = unmount();
      expect(response).toEqual("");
      expect(count).toEqual(1);
    });
  });

  describe("Ref hook", () => {
    it("should return a ref", () => {
      let ref;
      let updated = false;
      const Component = function () {
        ref = useRef(null);
        if (!updated) {
          expect(ref.current).toEqual(null);
        }
        return <div v-ref={ref}>Hello world</div>;
      };

      const response = mount("body", Component);
      expect(response).toEqual("<div>Hello world</div>");
      expect(ref.current).not.toEqual(null);

      const refCurrent = ref.current;
      updated = true;
      update();
      expect(refCurrent === ref.current).toEqual(true);
    });
  });

  describe("Callback hook", () => {
    it("should test the callback problem", () => {
      let callback;
      const Component = function () {
        callback = () => {};
        return <div>Hello world</div>;
      };

      const response = mount("body", Component);
      expect(response).toEqual("<div>Hello world</div>");
      expect(callback).not.toEqual(null);

      const oldCallback = callback;
      update();
      expect(oldCallback === callback).toEqual(false);
    });

    it("should call the callback", () => {
      let callback;
      const Component = function () {
        callback = useCallback(() => {}, []);
        return <div>Hello world</div>;
      };
      const response = mount("body", Component);
      expect(response).toEqual("<div>Hello world</div>");
      expect(callback).not.toEqual(null);
      const oldCallback = callback;
      update();
      expect(oldCallback === callback).toEqual(true);
    });
  });

  describe("Memo hook", () => {
    it("should test the memo problem", () => {
      let computedTimes = 0;
      let color = "red";
      const Component = function () {
        computedTimes++;
        return <div class={color}>Hello world</div>;
      };

      const response = mount("body", Component);
      expect(response).toEqual('<div class="red">Hello world</div>');
      expect(computedTimes).toEqual(1);

      const response2 = update();
      expect(response2).toEqual('<div class="red">Hello world</div>');
      expect(computedTimes).toEqual(2);

      color = "blue";
      const response3 = update();
      expect(response3).toEqual('<div class="blue">Hello world</div>');
      expect(computedTimes).toEqual(3);
    });

    it("should use the memo", () => {
      let computedTimes = 0;
      let color = "red";
      const Component = function () {
        return useMemo(() => {
          computedTimes++;
          return <div class={color}></div>;
        }, [color]);
      };

      const response = mount("body", Component);
      expect(response).toEqual('<div class="red"></div>');
      expect(computedTimes).toEqual(1);

      const response2 = update();
      expect(response2).toEqual('<div class="red"></div>');
      expect(computedTimes).toEqual(1);

      color = "blue";
      const response3 = update();
      expect(response3).toEqual('<div class="blue"></div>');
      expect(computedTimes).toEqual(2);
    });

    it("Update class with hooks vs v-keep", () => {
      let updateClass = "";
      const Component = () => (
        <div>
          {
            <div class={updateClass === "test" ? "test" : false} v-keep={updateClass}>
              test
            </div>
          }
        </div>
      );

      const Component2 = () => (
        <div>
          {useMemo(
            () => (
              <div class={updateClass === "test" ? "test" : false}>test</div>
            ),
            [updateClass]
          )}
        </div>
      );

      const before = mount("body", Component);
      expect(before).toEqual("<div><div>test</div></div>");
      updateClass = "test";
      const after = update();
      expect(after).toEqual('<div><div class="test">test</div></div>');

      updateClass = "";
      const before2 = mount("body", Component2);
      expect(before2).toEqual("<div><div>test</div></div>");
      updateClass = "test";
      const after2 = update();
      expect(after2).toEqual('<div><div class="test">test</div></div>');
    });
  });
});
