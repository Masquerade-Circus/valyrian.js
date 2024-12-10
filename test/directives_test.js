import "valyrian.js/node";

// eslint-disable-next-line no-unused-vars
import { directive, mount, setAttribute, trust, unmount, update, v } from "valyrian.js";

import dayjs from "dayjs";
import { expect, describe, test as it } from "bun:test";

// eslint-disable-next-line max-lines-per-function
describe("Directives", () => {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  describe("Directive creation", () => {
    it("should be able create a directive", () => {
      let result;
      const expected = "Hello world";

      directive("test", (value) => (result = `Hello ${value}`));

      mount("div", () => <div v-test="world" />);
      expect(result).toEqual(expected);
    });

    it("should be able to get the vnode", () => {
      let newVnode;
      let oldProps;

      const app = () => <div v-test2 />;

      directive("test2", (v, vnode, old) => {
        newVnode = vnode;
        oldProps = old;
      });

      mount("div", app);
      update();
      update();
      update();

      expect(newVnode).toEqual({
        tag: "div",
        props: {
          "v-test2": true
        },
        dom: expect.any(Object),
        children: [],
        isSVG: false
      });

      expect(oldProps).toEqual({
        "v-test2": true
      });
    });

    it("should be able to identify if this is first render or update", () => {
      const app = () => <div v-render />;

      directive("render", (v, vnode, oldProps) => {
        if (!oldProps) {
          vnode.children = ["First render, vnode created"];
        } else {
          vnode.children = ["Second render, vnode updated"];
        }
      });

      const result = mount("body", app);

      expect(result).toEqual("<div>First render, vnode created</div>");

      const result2 = update();
      expect(result2).toEqual("<div>Second render, vnode updated</div>");
    });

    it("should be able to modify the children of a vnode", () => {
      const expected = "<div>Hello world</div>";

      directive("test3", (v, vnode) => {
        vnode.children = ["Hello world"];
      });

      const app = () => (
        <div v-test3>
          <span>Hello John Doe</span>
        </div>
      );

      const result = mount("div", app);
      expect(result).toEqual(expected);
    });

    /**
     * Modify properties is not guaranteed because the properties are processed by place
     * If the directive needs to update previous properties you need to update the property using the setAttribute method
     */
    it("Modify properties is not guaranteed", () => {
      let update = false;
      const app = () => <div u="u" v-test4 x="x" />;

      directive("test4", (value, vnode, oldVnode) => {
        // Try to change u property
        vnode.props.u = "property changed";
        if (update) {
          setAttribute("u", "property changed", vnode, oldVnode);
        }

        // Try to change x property
        vnode.props.x = "property changed";
      });

      const result = mount("div", app);
      expect(result).toEqual('<div u="u" x="property changed"></div>');

      update = true;
      const result2 = mount("div", app);
      expect(result2).toEqual('<div u="property changed" x="property changed"></div>');
    });

    /**
     * We don't have flags as vue or ember
     * For this we should be able to use a directive as flag
     */
    it("should be able to use it as a flag", () => {
      const expected = "<div>August 16, 2018</div>";

      const formatDate = (value) => dayjs(value).format("MMMM D, YYYY");

      directive("date-inline", (date, vnode) => (vnode.children = [formatDate(date)]));
      directive("date", (_, vnode) => (vnode.children = [formatDate(vnode.children[0])]));

      const date = "08-16-2018";
      let result = mount("div", () => <div v-date-inline={date} />);
      expect(result).toEqual(expected);

      result = mount("div", () => <div v-date>{date}</div>);
      expect(result).toEqual(expected);
    });

    /**
     * Works as a Switch statement
     * It needs a set of arrays as children of the form [{case}, vnodes]
     * This is not added to the base library but it shows the capabilities of valyrian directives
     */
    it("v-switch example", () => {
      directive("switch", (value, vnode) => {
        for (let i = 0, l = vnode.children.length; i < l; i++) {
          const [test, handler] = vnode.children[i];
          let result = false;
          result = typeof test === "function" ? test(value) : value === test;

          if (result) {
            vnode.children = [typeof handler === "function" ? handler(value) : handler];
            return;
          }
        }

        vnode.children = [value];
      });

      let name;
      const component = () => (
        <div v-switch={name}>
          {["John", <span>Hello John</span>]}
          {[(val) => val === "John Doe", <span>Hello John Doe</span>]}
          {["Jane", (val) => <span>Hello {val} Doe</span>]}
        </div>
      );

      let expected;
      let result;

      // Direct equality
      expected = "<div><span>Hello John</span></div>";
      name = "John";
      result = mount("div", component);
      expect(result).toEqual(expected);

      // Comparison method
      expected = "<div><span>Hello John Doe</span></div>";
      name = "John Doe";
      result = mount("div", component);
      expect(result).toEqual(expected);

      // Result method
      expected = "<div><span>Hello Jane Doe</span></div>";
      name = "Jane";
      result = mount("div", component);
      expect(result).toEqual(expected);

      // If no case return the value as children
      expected = "<div>Hello Anonymous</div>";
      name = "Hello Anonymous";
      result = mount("div", component);
      expect(result).toEqual(expected);
    });
  });

  describe("Official directives", () => {
    /**
     * v-for directive works like this
     * On the element set the v-for directive to an array
     * It needs a function as a child to process the elements of the array
     * Think of it as a map function that returns a list of vnodes
     */
    describe("v-for", () => {
      it("should create 10 list items", () => {
        const items = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta", "iota", "kappa"];
        const expected = "<ul>" + items.reduce((str, word) => str + `<li>${word}</li>`, "") + "</ul>";
        const result = mount("body", () => <ul v-for={items}>{(word) => <li>{word}</li>}</ul>);

        expect(result).toEqual(expected);
      });

      it("should create 10 list items getting its index", () => {
        const items = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta", "iota", "kappa"];
        let i = 0;
        const expected = "<ul>" + items.reduce((str, word) => str + `<li>${i++} - ${word}</li>`, "") + "</ul>";
        const result = mount("body", () => (
          <ul v-for={items}>
            {(word, i) => (
              <li>
                {i} - {word}
              </li>
            )}
          </ul>
        ));

        expect(result).toEqual(expected);
      });
    });

    /**
     * Works as Vue's v-if directive or ember "if" helper
     * It renders a vnode if the referenced value is true
     */
    describe("v-if", () => {
      it("should render vnode if thruthy values", () => {
        const values = [{}, 1, true, [], "string", new Date(), -1];

        const expected = "<div><span>Hello world</span></div>";

        values.forEach((value) => {
          const result = mount("div", () => (
            <div>
              <span v-if={value}>Hello world</span>
            </div>
          ));
          expect(result).toEqual(expected);
        });
      });

      it("should not render vnode with falsy values", () => {
        const values = [false, 0, "", null, , NaN];

        const expected = "<div></div>";

        values.forEach((value) => {
          const result = mount("div", () => (
            <div>
              <span v-if={value}>Hello world</span>
            </div>
          ));
          expect(result).toEqual(expected);
        });
      });

      it("should update oldnode", () => {
        let value = true;
        const expected1 = "<div><span>Hello world</span></div>";
        const expected2 = "<div></div>";

        const app = () => (
          <div>
            <span v-if={value}>Hello world</span>
          </div>
        );
        const result1 = mount("div", app);
        expect(result1).toEqual(expected1);

        value = false;
        const result2 = update();
        expect(result2).toEqual(expected2);
      });
    });

    /**
     * Works as Vue's v-show directive
     * It renders a vnode and only changes it's display style value
     */
    describe("v-show", () => {
      it("should show a vnode if true", () => {
        const value = true;
        const expected = "<div><span>Hello world</span></div>";
        const result = mount("div", () => (
          <div>
            <span v-show={value}>Hello world</span>
          </div>
        ));

        expect(result).toEqual(expected);
      });

      it("should hide a vnode if false", () => {
        const value = false;
        const expected = '<div><span style="display: none;">Hello world</span></div>';
        const result = mount("div", () => (
          <div>
            <span v-show={value}>Hello world</span>
          </div>
        ));

        expect(result).toEqual(expected);
      });
    });

    /**
     * v-class directive receives a object with boolean attributes to toggle classes on the dom
     */
    describe("v-class", () => {
      it("should toggle on a class", () => {
        const classes = {
          world: true
        };

        const app = () => <div v-class={classes} />;
        const result = mount("body", app);
        expect(result).toEqual('<div class="world"></div>');

        classes.world = false;
        const result2 = update();
        expect(result2).toEqual("<div></div>");
      });

      it("should toggle on a class in an element with a class attribute", () => {
        const classes = {
          world: true
        };
        const app = () => <div class="hello" v-class={classes} />;
        const result = mount("body", app);
        expect(result).toEqual('<div class="hello world"></div>');

        classes.world = false;
        const result2 = update();
        expect(result2).toEqual('<div class="hello"></div>');
      });
    });

    /**
     * The directive v-keep is used to render just once and skip all subsequent render updates
     * Similar to write the lifecycle shouldupdate={() => false}
     */
    describe("v-keep", () => {
      it("should not update the dom after first render", () => {
        const Store = { hello: "world" };
        const app = () => <div v-keep>Hello {Store.hello}</div>;

        const result = mount("body", app);
        expect(result).toEqual("<div>Hello world</div>");

        // We update our store
        Store.hello = "John Doe";

        const result2 = update();
        expect(result2).toEqual("<div>Hello world</div>");
      });
      it("should update the dom after the value changes", () => {
        const Store = { hello: "world", id: 1 };
        const app = () => <div v-keep={Store.id}>Hello {Store.hello}</div>;

        const result = mount("body", app);
        expect(result).toEqual("<div>Hello world</div>");

        // We update our store
        Store.hello = "John Doe";

        const result2 = update();
        expect(result2).toEqual("<div>Hello world</div>");

        // We update our id
        Store.id = 2;
        const result3 = update();
        expect(result3).toEqual("<div>Hello John Doe</div>");
      });
    });

    /**
     * The v-html directive is used to direct raw html render. It is just a helper directive
     * and it does not improve performance because Valyrian.js is already very fast with vnodes.
     * We can use this directive to replace the trust use like in this test
     */
    describe("v-html", () => {
      it("should handle direct html render", () => {
        // Using trust example
        const Component = () => <div>{trust("<div>Hello world</div>")}</div>;
        const result = mount("body", Component);

        expect(result).toEqual("<div><div>Hello world</div></div>");

        // Using v-html directive
        const Component2 = () => <div v-html="<div>Hello world</div>" />;
        const result2 = mount("body", Component2);

        expect(result2).toEqual("<div><div>Hello world</div></div>");
      });
    });
  });

  // if the v-if directive resolve to false, we should not execute any other directive or attribute update like v-for
  describe("use v-if with v-for", () => {
    it("should use v-if with v-for directives", () => {
      const arr = [1, 2, 3, 4];
      let show = true;
      const app = () => (
        <div v-if={show} v-for={arr}>
          {(i) => <span>{i}</span>}
        </div>
      );

      const result = mount("body", app);
      expect(result).toEqual("<div><span>1</span><span>2</span><span>3</span><span>4</span></div>");

      show = false;
      const result2 = update();
      expect(result2).toEqual("");
    });
  });

  /**
   * The state directive is used just to pass data without creating an attribute on the node.
   * And its main use is in the lifecycle methods to validate properties or changes
   */
  describe("reserved word state", () => {
    it("should not render an attribute", () => {
      const state = { hello: "world" };
      const Component = () => (
        <div
          state={state}
          shouldupdate={(newVnode, oldVnode) => oldVnode.props.state.hello !== newVnode.props.state.hello}
        />
      );

      const result = mount("body", Component);
      expect(result).toEqual("<div></div>");
    });
  });

  // lifecycle hooks
  describe("lifecycle hooks", () => {
    it("should allow to identify lifecycles", () => {
      const events = [];
      const Component = () => (
        <div
          v-create={() => events.push("create")}
          v-update={() => events.push("update")}
          v-cleanup={() => events.push("cleanup")}
        />
      );
      const result = mount("body", Component); // create and mount
      update(); // cleanup and update
      update(); // cleanup and update
      update(); // cleanup and update
      unmount(); // cleanup
      unmount(); // does nothing because unmounted
      expect(result).toEqual("<div></div>");
      expect(events).toEqual(["create", "cleanup", "update", "cleanup", "update", "cleanup", "update", "cleanup"]);
    });
  });
});
