import "../plugins/node";

import { v } from "../lib/index";
import plugin, { useEffect, useState, useRef, useCallback, useMemo } from "../plugins/hooks";

import expect from "expect";
import { v } from "../lib";

v.use(plugin);

describe("Hooks", () => {
  describe("State hook", () => {
    it("should handle a component state", async () => {
      let Counter = () => {
        let [count, setCount] = useState(0);
        let interval = setInterval(() => setCount(count + 1), 1000);
        v.onCleanup(() => clearInterval(interval));
        return <div>{count}</div>;
      };

      let result = v.mount("div", Counter);
      expect(result).toEqual("<div>0</div>");
      await new Promise((resolve) => setTimeout(() => resolve(), 2050));
      result = v.update(Counter);
      expect(result).toEqual("<div>2</div>");
    });

    it("should handle subcomponents state and v.onCleanup", async () => {
      let Ok = () => {
        let [ok, setOk] = useState("ok");
        let interval = setInterval(() => setOk("not ok"), 1000);
        v.onCleanup(() => clearInterval(interval));
        return <div>{ok}</div>;
      };

      let Counter = () => {
        let [count, setCount] = useState(0);
        let interval = setInterval(() => setCount(count + 1), 1000);
        v.onCleanup(() => clearInterval(interval));
        return (
          <div>
            {count} <Ok />
          </div>
        );
      };

      let result = v.mount("div", Counter);
      expect(result).toEqual("<div>0 <div>ok</div></div>");
      await new Promise((resolve) => setTimeout(() => resolve(), 2050));
      result = v.update(Counter);
      expect(result).toEqual("<div>2 <div>not ok</div></div>");
    });

    it("array getter-setter based state", async () => {
      let Counter = () => {
        let [count, setCount] = useState(0);
        let interval = setInterval(() => setCount(count + 1), 1000);
        v.onCleanup(() => clearInterval(interval));
        return <div>{count}</div>;
      };

      let result = v.mount("div", Counter);
      expect(result).toEqual("<div>0</div>");
      await new Promise((resolve) => setTimeout(() => resolve(), 2050));
      result = v.update(Counter);
      expect(result).toEqual("<div>2</div>");
    });
  });

  describe("Effect hook", () => {
    it("should call the effect at first render", () => {
      let count = 0;
      let Component = function () {
        useEffect(() => count++);
        return <div>{count}</div>;
      };

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>1</div>");
    });

    it("should call the effect at every v.update", () => {
      let count = 0;
      let Component = function () {
        useEffect(() => count++);
        return <div>{count}</div>;
      };

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = v.update(Component);
      expect(response).toEqual("<div>2</div>");
    });

    it("should handle v.onCleanup", () => {
      let count = 0;
      let Component = function () {
        useEffect(() => {
          count++;
          return () => (count -= 2);
        });
        return <div>{count}</div>;
      };

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = v.update(Component);
      expect(response).toEqual("<div>0</div>");
    });

    it("should not call the effect if the change array is passed and there are no changes", () => {
      let count = 0;
      let Component = function () {
        useEffect(() => count++, [1]);
        return <div>{count}</div>;
      };

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = v.update(Component);
      expect(response).toEqual("<div>1</div>");
    });

    it("should not call the effect if the change array is passed and is an empty array", () => {
      let count = 0;
      let Component = function () {
        useEffect(() => count++, []);
        return <div>{count}</div>;
      };

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = v.update(Component);
      expect(response).toEqual("<div>1</div>");
    });

    it("should call the effect if the change array is passed and there are changes", () => {
      let count = 0;
      let Component = function () {
        useEffect(() => count++, [count]);
        return <div>{count}</div>;
      };

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = v.update(Component);
      expect(response).toEqual("<div>2</div>");
    });

    it("should call v.onCleanup even if the changes array is passed and there are changes", () => {
      let count = 0;
      let Component = function () {
        useEffect(() => {
          count++;
          return () => count++;
        }, [count]);
        return <div>{count}</div>;
      };

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = v.update(Component);
      expect(response).toEqual("<div>3</div>");
      response = v.update(Component);
      expect(response).toEqual("<div>5</div>");
    });

    it("should handle v.onCleanup on unMount", () => {
      let count = 0;
      let Component = function () {
        useEffect(() => {
          count++;
          return () => (count -= 2);
        });
        return <div>{count}</div>;
      };

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      expect(count).toEqual(1);

      response = v.update(Component);
      expect(response).toEqual("<div>0</div>");
      expect(count).toEqual(0);

      response = v.unmount(Component);
      expect(response).toEqual("");
      expect(count).toEqual(-2);
    });

    it("should call the effect only in the v.unmount", () => {
      let count = 0;
      let Component = function () {
        useEffect(() => {
          count++;
        }, null);
        return <div>{count}</div>;
      };

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>0</div>");
      expect(count).toEqual(0);

      response = v.update(Component);
      expect(response).toEqual("<div>0</div>");
      expect(count).toEqual(0);

      response = v.unmount(Component);
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
        useEffect(plusHooks); // Create & v.update
        useEffect(plusHooks, null); // Remove
        return <div>Hello world</div>;
      };

      it("should call the lifecycle", () => {
        v.mount("body", LifecycleComponent);
        expect(lifecycleCount).toEqual(1);
        v.update(LifecycleComponent);
        expect(lifecycleCount).toEqual(2);
        v.unmount(LifecycleComponent);
        expect(lifecycleCount).toEqual(3);
      });

      it("should call the hooks", () => {
        v.mount("body", HooksComponent);
        expect(hooksCount).toEqual(1);
        v.update(HooksComponent);
        expect(hooksCount).toEqual(2);
        v.unmount(HooksComponent);
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

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>Hello world</div>");
      expect(ref.current).not.toEqual(null);

      let refCurrent = ref.current;
      updated = true;
      v.update(Component);
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

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>Hello world</div>");
      expect(callback).not.toEqual(null);

      let oldCallback = callback;
      v.update(Component);
      expect(oldCallback === callback).toEqual(false);
    });

    it("should call the callback", () => {
      let callback;
      let Component = function () {
        callback = useCallback(() => {}, []);
        return <div>Hello world</div>;
      };
      let response = v.mount("body", Component);
      expect(response).toEqual("<div>Hello world</div>");
      expect(callback).not.toEqual(null);
      let oldCallback = callback;
      v.update(Component);
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

      let response = v.mount("body", Component);
      expect(response).toEqual('<div class="red">Hello world</div>');
      expect(computedTimes).toEqual(1);

      let response2 = v.update(Component);
      expect(response2).toEqual('<div class="red">Hello world</div>');
      expect(computedTimes).toEqual(2);

      color = "blue";
      let response3 = v.update(Component);
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

      let response = v.mount("body", Component);
      expect(response).toEqual('<div class="red"></div>');
      expect(computedTimes).toEqual(1);

      let response2 = v.update(Component);
      expect(response2).toEqual('<div class="red"></div>');
      expect(computedTimes).toEqual(1);

      color = "blue";
      let response3 = v.update(Component);
      expect(response3).toEqual('<div class="blue"></div>');
      expect(computedTimes).toEqual(2);
    });
  });
});
