import "valyrian.js/node";

import { mount, onCleanup, unmount, update, v } from "valyrian.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "valyrian.js/hooks";

/* eslint-disable max-lines-per-function */
import expect from "expect";

describe("Hooks", () => {
  describe("State hook", () => {
    it("should handle a component state", async () => {
      let Counter = () => {
        let [count, setCount] = useState(0);
        let interval = setInterval(() => setCount(count + 1), 10);
        onCleanup(() => clearInterval(interval));
        return <div>{count}</div>;
      };

      let result = mount("div", Counter);
      expect(result).toEqual("<div>0</div>");
      await new Promise((resolve) => setTimeout(() => resolve(), 28));
      result = update();
      expect(result).toEqual("<div>2</div>");
      unmount();
    });

    it("should handle subcomponents state and onCleanup", async () => {
      let Ok = () => {
        let [ok, setOk] = useState("ok");
        let interval = setInterval(() => setOk("not ok"), 10);
        onCleanup(() => clearInterval(interval));
        return <div>{ok}</div>;
      };

      let Counter = () => {
        let [count, setCount] = useState(0);
        let interval = setInterval(() => setCount(count + 1), 10);
        onCleanup(() => clearInterval(interval));
        return (
          <div>
            {count} <Ok />
          </div>
        );
      };

      unmount();

      let result = mount("div", Counter);
      expect(result).toEqual("<div>0 <div>ok</div></div>");
      await new Promise((resolve) => setTimeout(() => resolve(), 29));
      result = update();
      expect(result).toEqual("<div>2 <div>not ok</div></div>");
      unmount();
    });

    it("should handle change of components", async () => {
      let change = false;
      let Counter = () => {
        let [count, setCount] = useState(0);
        let [name, setName] = useState("Hello");
        let interval = setInterval(() => setCount(count + 1), 10);
        onCleanup(() => clearInterval(interval));
        return (
          <div>
            {count} {name}
          </div>
        );
      };

      let OtherCounter = () => {
        let [count, setCount] = useState(10);
        let [name, setName] = useState("World");
        let interval = setInterval(() => setCount(count + 1), 10);
        onCleanup(() => clearInterval(interval));
        return (
          <div>
            {count} {name}
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
      unmount();
    });
  });

  describe("Effect hook", () => {
    it("should call the effect at first render", () => {
      let count = 0;
      let Component = function () {
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
      let Component = function () {
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
      let Component = function () {
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
      let Component = function () {
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
      let Component = function () {
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
      let Component = function () {
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
      let Component = function () {
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
      let Component = function () {
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
      let Component = function () {
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

    describe("Compare lifecycle vs hooks", () => {
      let lifecycleCount = 0;
      let plusLifeCycle = () => (lifecycleCount += 1);

      let hooksCount = 0;
      let plusHooks = () => (hooksCount += 1);

      let LifecycleComponent = () => {
        return (
          <div oncreate={plusLifeCycle} onupdate={plusLifeCycle} onremove={plusLifeCycle}>
            Hello world
          </div>
        );
      };

      let HooksComponent = () => {
        // useEffect(plusHooks, []); // Only create replaced by the next line
        useEffect(plusHooks); // Create & update
        useEffect(plusHooks, null); // Remove
        return <div>Hello world</div>;
      };

      it.skip("should call the lifecycle", () => {
        mount("body", LifecycleComponent);
        expect(lifecycleCount).toEqual(1);
        update();
        expect(lifecycleCount).toEqual(2);
        unmount();
        expect(lifecycleCount).toEqual(3);
      });

      it("should call the hooks", () => {
        mount("body", HooksComponent);
        expect(hooksCount).toEqual(1);
        update();
        expect(hooksCount).toEqual(2);
        unmount();
        expect(hooksCount).toEqual(3);
      });
    });
  });

  describe("Ref hook", () => {
    it("should return a ref", () => {
      let ref;
      let updated = false;
      let Component = function () {
        ref = useRef(null);
        if (!updated) {
          expect(ref.current).toEqual(null);
        }
        return <div v-ref={ref}>Hello world</div>;
      };

      let response = mount("body", Component);
      expect(response).toEqual("<div>Hello world</div>");
      expect(ref.current).not.toEqual(null);

      let refCurrent = ref.current;
      updated = true;
      update();
      expect(refCurrent === ref.current).toEqual(true);
    });
  });

  describe("Callback hook", () => {
    it("should test the callback problem", () => {
      let callback;
      let Component = function () {
        callback = () => {};
        return <div>Hello world</div>;
      };

      let response = mount("body", Component);
      expect(response).toEqual("<div>Hello world</div>");
      expect(callback).not.toEqual(null);

      let oldCallback = callback;
      update();
      expect(oldCallback === callback).toEqual(false);
    });

    it("should call the callback", () => {
      let callback;
      let Component = function () {
        callback = useCallback(() => {}, []);
        return <div>Hello world</div>;
      };
      let response = mount("body", Component);
      expect(response).toEqual("<div>Hello world</div>");
      expect(callback).not.toEqual(null);
      let oldCallback = callback;
      update();
      expect(oldCallback === callback).toEqual(true);
    });
  });

  describe("Memo hook", () => {
    it("should test the memo problem", () => {
      let computedTimes = 0;
      let color = "red";
      let Component = function () {
        computedTimes++;
        return <div class={color}>Hello world</div>;
      };

      let response = mount("body", Component);
      expect(response).toEqual('<div class="red">Hello world</div>');
      expect(computedTimes).toEqual(1);

      let response2 = update();
      expect(response2).toEqual('<div class="red">Hello world</div>');
      expect(computedTimes).toEqual(2);

      color = "blue";
      let response3 = update();
      expect(response3).toEqual('<div class="blue">Hello world</div>');
      expect(computedTimes).toEqual(3);
    });

    it("should use the memo", () => {
      let computedTimes = 0;
      let color = "red";
      let Component = function () {
        return useMemo(() => {
          computedTimes++;
          return <div class={color}></div>;
        }, [color]);
      };

      let response = mount("body", Component);
      expect(response).toEqual('<div class="red"></div>');
      expect(computedTimes).toEqual(1);

      let response2 = update();
      expect(response2).toEqual('<div class="red"></div>');
      expect(computedTimes).toEqual(1);

      color = "blue";
      let response3 = update();
      expect(response3).toEqual('<div class="blue"></div>');
      expect(computedTimes).toEqual(2);
    });

    it("Update class with hooks vs shouldupdate property", () => {
      let updateClass = "";
      let Component = () => (
        <div>
          {
            <div
              class={updateClass === "test" ? "test" : false}
              shouldupdate={(vnode, oldVnode) => vnode.props.class !== oldVnode.props.class}
            >
              test
            </div>
          }
        </div>
      );

      let Component2 = () => (
        <div>
          {useMemo(
            () => (
              <div class={updateClass === "test" ? "test" : false}>test</div>
            ),
            [updateClass]
          )}
        </div>
      );

      let before = mount("body", Component);
      expect(before).toEqual("<div><div>test</div></div>");
      updateClass = "test";
      let after = update();
      expect(after).toEqual('<div><div class="test">test</div></div>');

      updateClass = "";
      let before2 = mount("body", Component2);
      expect(before2).toEqual("<div><div>test</div></div>");
      updateClass = "test";
      let after2 = update();
      expect(after2).toEqual('<div><div class="test">test</div></div>');
    });
  });
});
