import "../lib";
import "../plugins/node";

import { mount, onCleanup, unmount, update } from "../lib/index";
import { useEffect, useState } from "../plugins/hooks";

import expect from "expect";

describe("Hooks", () => {
  describe("State hook", () => {
    it("should handle a component state", async () => {
      let Counter = () => {
        let [count, setCount] = useState(0);
        let interval = setInterval(() => setCount(count + 1), 1000);
        onCleanup(() => clearInterval(interval));
        return <div>{count}</div>;
      };

      let result = mount("div", Counter);
      expect(result).toEqual("<div>0</div>");
      await new Promise((resolve) => setTimeout(() => resolve(), 2050));
      result = update(Counter);
      expect(result).toEqual("<div>2</div>");
    });

    it("should handle subcomponents state and onCleanup", async () => {
      let Ok = () => {
        let [ok, setOk] = useState("ok");
        let interval = setInterval(() => setOk("not ok"), 1000);
        onCleanup(() => clearInterval(interval));
        return <div>{ok}</div>;
      };

      let Counter = () => {
        let [count, setCount] = useState(0);
        let interval = setInterval(() => setCount(count + 1), 1000);
        onCleanup(() => clearInterval(interval));
        return (
          <div>
            {count} <Ok />
          </div>
        );
      };

      let result = mount("div", Counter);
      expect(result).toEqual("<div>0 <div>ok</div></div>");
      await new Promise((resolve) => setTimeout(() => resolve(), 2050));
      result = update(Counter);
      expect(result).toEqual("<div>2 <div>not ok</div></div>");
    });

    it("array getter-setter based state", async () => {
      let Counter = () => {
        let [count, setCount] = useState(0);
        let interval = setInterval(() => setCount(count + 1), 1000);
        onCleanup(() => clearInterval(interval));
        return <div>{count}</div>;
      };

      let result = mount("div", Counter);
      expect(result).toEqual("<div>0</div>");
      await new Promise((resolve) => setTimeout(() => resolve(), 2050));
      result = update(Counter);
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

      let response = mount("body", Component);
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
      response = update(Component);
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
      response = update(Component);
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
      response = update(Component);
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
      response = update(Component);
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
      response = update(Component);
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
      response = update(Component);
      expect(response).toEqual("<div>3</div>");
      response = update(Component);
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

      response = update(Component);
      expect(response).toEqual("<div>0</div>");
      expect(count).toEqual(0);

      response = unmount(Component);
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

      response = update(Component);
      expect(response).toEqual("<div>0</div>");
      expect(count).toEqual(0);

      response = unmount(Component);
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
        useEffect(plusHooks); // Create & Update
        useEffect(plusHooks, null); // Remove
        return <div>Hello world</div>;
      };

      it("should call the lifecycle", () => {
        mount("body", LifecycleComponent);
        expect(lifecycleCount).toEqual(1);
        update(LifecycleComponent);
        expect(lifecycleCount).toEqual(2);
        unmount(LifecycleComponent);
        expect(lifecycleCount).toEqual(3);
      });

      it("should call the hooks", () => {
        mount("body", HooksComponent);
        expect(hooksCount).toEqual(1);
        update(HooksComponent);
        expect(hooksCount).toEqual(2);
        unmount(HooksComponent);
        expect(hooksCount).toEqual(3);
      });
    });
  });
});
