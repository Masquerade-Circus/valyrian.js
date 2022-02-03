import "../lib";
import "../plugins/node";

import { cleanup, mount, unmount, update } from "../lib";
import { useEffect, useState } from "../plugins/hooks";

import expect from "expect";

describe("Hooks", () => {
  describe("State hook", () => {
    it("should handle a component state", async () => {
      let Counter = () => {
        let [count, setCount] = useState(0);
        let interval = setInterval(() => setCount(count + 1), 1000);
        cleanup(() => clearInterval(interval));
        return <div>{count}</div>;
      };

      let result = mount("div", Counter);
      expect(result).toEqual("<div>0</div>");
      await new Promise((resolve) => setTimeout(() => resolve(), 2050));
      result = update(Counter);
      expect(result).toEqual("<div>2</div>");
    });

    it("should handle subcomponents state and cleanup", async () => {
      let Ok = () => {
        let [ok, setOk] = useState("ok");
        let interval = setInterval(() => setOk("not ok"), 1000);
        cleanup(() => clearInterval(interval));
        return <div>{ok}</div>;
      };

      let Counter = () => {
        let [count, setCount] = useState(0);
        let interval = setInterval(() => setCount(count + 1), 1000);
        cleanup(() => clearInterval(interval));
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
        cleanup(() => clearInterval(interval));
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

    it("should handle cleanup", () => {
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
        useEffect(() => count++, [0]);
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

    it("should call cleanup even if the changes array is passed and there are changes", () => {
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

    it("should handle cleanup on unMount", () => {
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
  });
});
