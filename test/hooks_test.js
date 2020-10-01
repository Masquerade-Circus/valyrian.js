import expect from "expect";
import "../lib";
import nodePlugin from "../plugins/node";
import hooksPlugin from "../plugins/hooks";
v.usePlugin(nodePlugin);
v.usePlugin(hooksPlugin);

describe("Hooks", () => {
  describe("State hook", () => {
    it("should handle a component state", async () => {
      v.unMount();

      let Counter = () => {
        let [count, setCount] = v.useState(0);
        let interval = setInterval(() => setCount(count + 1), 1000);
        v.onCleanup(() => clearInterval(interval));
        return <div>{count}</div>;
      };

      let result = v.mount("div", Counter);
      expect(result).toEqual("<div>0</div>");
      await new Promise((resolve) => setTimeout(() => resolve(), 2050));
      result = v.update();
      expect(result).toEqual("<div>2</div>");
      result = v.unMount();
    });

    it("should handle subcomponents state and cleanup", async () => {
      v.unMount();

      let Ok = () => {
        let [ok, setOk] = v.useState("ok");
        let interval = setInterval(() => setOk("not ok"), 1000);
        v.onCleanup(() => clearInterval(interval));
        return <div>{ok}</div>;
      };

      let Counter = () => {
        let [count, setCount] = v.useState(0);
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
      result = v.update();
      expect(result).toEqual("<div>2 <div>not ok</div></div>");
      result = v.unMount();
    });

    it("array getter-setter based state", async () => {
      v.unMount();

      let Counter = () => {
        let [count, setCount] = v.useState(0);
        let interval = setInterval(() => setCount(count + 1), 1000);
        v.onCleanup(() => clearInterval(interval));
        return <div>{count}</div>;
      };

      let result = v.mount("div", Counter);
      expect(result).toEqual("<div>0</div>");
      await new Promise((resolve) => setTimeout(() => resolve(), 2050));
      result = v.update();
      expect(result).toEqual("<div>2</div>");
      result = v.unMount();
    });
  });

  describe("Effect hook", () => {
    it("should call the effect at first render", () => {
      let count = 0;
      let Component = function () {
        v.useEffect(() => count++);
        return <div>{count}</div>;
      };

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>1</div>");
    });

    it("should call the effect at every update", () => {
      let count = 0;
      let Component = function () {
        v.useEffect(() => count++);
        return <div>{count}</div>;
      };

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = v.update();
      expect(response).toEqual("<div>2</div>");
    });

    it("should handle cleanup", () => {
      let count = 0;
      let Component = function () {
        v.useEffect(() => {
          count++;
          return () => (count -= 2);
        });
        return <div>{count}</div>;
      };

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = v.update();
      expect(response).toEqual("<div>0</div>");
    });

    it("should not call the effect if the change array is passed and there are no changes", () => {
      let count = 0;
      let Component = function () {
        v.useEffect(() => count++, [0]);
        return <div>{count}</div>;
      };

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = v.update();
      expect(response).toEqual("<div>1</div>");
    });

    it("should call the effect if the change array is passed and there are changes", () => {
      let count = 0;
      let Component = function () {
        v.useEffect(() => count++, [count]);
        return <div>{count}</div>;
      };

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = v.update();
      expect(response).toEqual("<div>2</div>");
    });

    it("should call cleanup even if the changes array is passed and there are changes", () => {
      let count = 0;
      let Component = function () {
        v.useEffect(() => {
          count++;
          return () => count++;
        }, [count]);
        return <div>{count}</div>;
      };

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      response = v.update();
      expect(response).toEqual("<div>3</div>");
      response = v.update();
      expect(response).toEqual("<div>5</div>");
    });

    it("should handle cleanup on unMount", () => {
      let count = 0;
      let Component = function () {
        v.useEffect(() => {
          count++;
          return () => (count -= 2);
        });
        return <div>{count}</div>;
      };

      let response = v.mount("body", Component);
      expect(response).toEqual("<div>1</div>");
      expect(count).toEqual(1);

      response = v.update();
      expect(response).toEqual("<div>0</div>");
      expect(count).toEqual(0);

      response = v.unMount();
      expect(response).toEqual("");
      expect(count).toEqual(-2);
    });
  });
});
