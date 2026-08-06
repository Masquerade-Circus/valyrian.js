/* eslint-disable sonarjs/no-nested-functions */
import "valyrian.js/node";

import { directive, DomElement, mount, Properties, setAttribute, trust, unmount, update, v, VnodeWithDom } from "valyrian.js";

import dayjs from "dayjs";
import { expect, describe, test as it } from "bun:test";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe("Directives", () => {
  describe("Directive creation", () => {
    it("should be able create a directive", () => {
      let result;
      const expected = "Hello world";

      directive("test", (value) => (result = `Hello ${value}`));

      mount("div", () => <div v-test="world" />);
      expect(result).toEqual(expected as any);
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
        hasKeys: false,
        isSVG: false
      } as any);

      expect(oldProps).toEqual({
        "v-test2": true
      } as any);
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

      directive("test4", (value, vnode) => {
        // Try to change u property
        vnode.props.u = "property changed";
        if (update) {
          setAttribute("u", "property changed", vnode);
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

      const formatDate = (value: string) => dayjs(value).format("MMMM D, YYYY");

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

      let name = "John";
      const component = () => (
        <div v-switch={name}>
          {["John", <span>Hello John</span>]}
          {[(val: string) => val === "John Doe", <span>Hello John Doe</span>]}
          {["Jane", (val: string) => <span>Hello {val} Doe</span>]}
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
        const result = mount("body", () => <ul v-for={items}>{(word: string) => <li>{word}</li>}</ul>);

        expect(result).toEqual(expected);
      });

      it("should create 10 list items getting its index", () => {
        const items = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta", "iota", "kappa"];
        let i = 0;
        const expected = "<ul>" + items.reduce((str, word) => str + `<li>${i++} - ${word}</li>`, "") + "</ul>";
        const result = mount("body", () => (
          <ul v-for={items}>
            {(word: string, i: number) => (
              <li>
                {i} - {word}
              </li>
            )}
          </ul>
        ));

        expect(result).toEqual(expected);
      });

      it("preserves ascending callback order and final order with nested arrays", () => {
        const items = ["alpha", "beta", "gamma"];
        const calls: string[] = [];
        const result = mount("body", () => (
          <ul v-for={items}>
            {(word: string, index: number) => {
              calls.push(`${index}:${word}`);
              return [<li>{word}</li>];
            }}
          </ul>
        ));

        expect(calls).toEqual(["0:alpha", "1:beta", "2:gamma"]);
        expect(result).toEqual("<ul><li>alpha</li><li>beta</li><li>gamma</li></ul>");
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
        // eslint-disable-next-line no-sparse-arrays
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

      it("should not crash when matching a kept sibling from a live NodeList", () => {
        const Store = { showFirst: true };
        const host = document.createElement("div");
        const app = () => (
          <main>
            {Store.showFirst ? <section v-keep="first">First</section> : null}
            <section v-keep="second">Second</section>
          </main>
        );

        expect(mount(host, app)).toEqual("<main><section>First</section><section>Second</section></main>");

        const main = host.childNodes[0] as HTMLElement;
        const originalChildNodes = main.childNodes;
        const liveNodeList = Object.assign({}, originalChildNodes) as NodeListOf<ChildNode>;
        let snapshotOnlyIndexReads = 0;
        Object.defineProperty(liveNodeList, "1", {
          get() {
            snapshotOnlyIndexReads++;
            return originalChildNodes[1];
          }
        });
        Object.defineProperty(liveNodeList, "length", {
          get() {
            return originalChildNodes.length;
          }
        });
        let childNodesReads = 0;
        Object.defineProperty(main, "childNodes", {
          configurable: true,
          get() {
            childNodesReads++;
            return childNodesReads === 1 ? liveNodeList : originalChildNodes;
          }
        });

        Store.showFirst = false;

        expect(() => update()).not.toThrow();
        expect(host.innerHTML).toEqual("<main><section>Second</section></main>");
        expect(snapshotOnlyIndexReads).toEqual(1);
      });
    });

    describe("v-model", () => {
      it("should not bind model handlers for dangerous property names", () => {
        for (const name of ["__proto__", "constructor", "prototype"]) {
          const model = {} as Record<string, any>;
          const host = document.createElement("div");
          const app = () => <input name={name} v-model={model} />;

          mount(host, app);

          const input = host.childNodes[0] as HTMLInputElement & { vnode: VnodeWithDom };
          input.value = "polluted";
          input.dispatchEvent(new Event("input", { bubbles: true }) as any);

          expect(input.vnode.props.oninput).toBeUndefined();
          expect(Object.hasOwn(model, name)).toBeFalse();
        }
      });

      it("should keep select option order while updating selected values", () => {
        const model = { choice: "b", choices: ["a", "c"] };
        const host = document.createElement("div");
        const options = ["a", "b", "c"];
        let multiple = false;
        const app = () => (
          <select name={multiple ? "choices" : "choice"} multiple={multiple} v-model={model}>
            {options.map((option) => (
              <option value={option}>{option}</option>
            ))}
          </select>
        );

        mount(host, app);
        expect(Array.from((host.childNodes[0] as HTMLSelectElement).childNodes).map((child) => child.textContent)).toEqual([
          "a",
          "b",
          "c"
        ]);
        expect(host.innerHTML).toEqual(
          '<select name="choice"><option value="a">a</option><option value="b" selected="true">b</option><option value="c">c</option></select>'
        );

        multiple = true;
        update();

        const select = host.childNodes[0] as HTMLSelectElement;
        expect(Array.from(select.childNodes).map((child) => child.textContent)).toEqual(["a", "b", "c"]);
        expect(host.innerHTML).toEqual(
          '<select name="choices" multiple="true"><option value="a" selected="true">a</option><option value="b">b</option><option value="c" selected="true">c</option></select>'
        );
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
          {(i: number) => <span>{i}</span>}
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
          v-update={(newVnode: VnodeWithDom, oldProps: Properties) =>
            oldProps.state.hello !== newVnode.props.state.hello
          }
        />
      );

      const result = mount("body", Component);
      expect(result).toEqual("<div></div>");
    });

    it("should not apply raw DOM HTML properties as attributes or DOM properties", () => {
      const Component = () => (
        <iframe
          innerHTML="<span>ignored</span>"
          outerHTML="<section>ignored</section>"
          srcdoc="<script>ignored()</script>"
        >
          safe
        </iframe>
      );

      const div = document.createElement("div");

      const result = mount(div, Component);
      const iframe = div.childNodes[0] as HTMLIFrameElement;
      const attributeNames = Array.from(iframe.attributes).map((attr) => attr.nodeName);

      expect(result).toEqual("<iframe>safe</iframe>");
      expect(attributeNames).not.toContain("innerHTML");
      expect(attributeNames).not.toContain("outerHTML");
      expect(attributeNames).not.toContain("srcdoc");
      expect(iframe.innerHTML).toEqual("safe");
      expect(iframe.outerHTML).toEqual("<iframe>safe</iframe>");
      expect(iframe.srcdoc).not.toEqual("<script>ignored()</script>");
    });
  });

  // lifecycle hooks
  describe("lifecycle hooks", () => {
    it("runs v-create after the root patch has committed the full DOM", () => {
      const host = document.createElement("div");
      const observed: string[] = [];
      const Component = () => (
        <section v-create={() => observed.push(host.innerHTML)}>
          <span>child</span>
        </section>
      );

      expect(mount(host, Component)).toEqual("<section><span>child</span></section>");
      expect(observed).toEqual(["<section><span>child</span></section>"]);
    });

    it("runs v-update after the root patch has committed the full DOM", () => {
      const host = document.createElement("div");
      const observed: string[] = [];
      const state = { label: "first" };
      const Component = () => (
        <section v-update={() => observed.push(host.innerHTML)}>
          <span>{state.label}</span>
        </section>
      );

      expect(mount(host, Component)).toEqual("<section><span>first</span></section>");
      state.label = "second";

      expect(update()).toEqual("<section><span>second</span></section>");
      expect(observed).toEqual(["<section><span>second</span></section>"]);
    });

    it("keeps commit queue order stable after the root patch finishes", () => {
      const host = document.createElement("div");
      const events: string[] = [];
      const state = { label: "first" };
      const Component = () => (
        <section v-create={() => events.push(`create:section:${host.innerHTML}`)} v-update={() => events.push(`update:section:${host.innerHTML}`)}>
          <span v-create={() => events.push(`create:first:${host.innerHTML}`)} v-update={() => events.push(`update:first:${host.innerHTML}`)}>
            {state.label}
          </span>
          <span v-create={() => events.push(`create:second:${host.innerHTML}`)} v-update={() => events.push(`update:second:${host.innerHTML}`)}>
            static
          </span>
        </section>
      );

      expect(mount(host, Component)).toEqual("<section><span>first</span><span>static</span></section>");
      expect(events).toEqual([
        "create:first:<section><span>first</span><span>static</span></section>",
        "create:second:<section><span>first</span><span>static</span></section>",
        "create:section:<section><span>first</span><span>static</span></section>"
      ]);

      events.length = 0;
      state.label = "second";

      expect(update()).toEqual("<section><span>second</span><span>static</span></section>");
      expect(events).toEqual([
        "update:first:<section><span>second</span><span>static</span></section>",
        "update:second:<section><span>second</span><span>static</span></section>",
        "update:section:<section><span>second</span><span>static</span></section>"
      ]);
    });

    it("keeps v-cleanup before detach and v-remove after detach", () => {
      const host = document.createElement("div");
      const events: string[] = [];
      let show = true;
      const Component = () => (
        <div>
          {show ? (
            <span
              v-cleanup={() => events.push(`cleanup:${host.innerHTML}`)}
              v-remove={() => events.push(`remove:${host.innerHTML}`)}
            >
              old
            </span>
          ) : (
            <p>new</p>
          )}
        </div>
      );

      expect(mount(host, Component)).toEqual("<div><span>old</span></div>");
      show = false;

      expect(update()).toEqual("<div><p>new</p></div>");
      expect(events).toEqual(["cleanup:<div><span>old</span></div>", "remove:<div><p></p></div>"]);
    });

    it("keeps lifecycle cleanup for children appended through a fragment", () => {
      const host = document.createElement("div");
      const events: string[] = [];
      let show = false;
      const Component = () => (
        <main>
          {show
            ? [
                <i>static</i>,
                <span
                  v-cleanup={() => events.push(`cleanup:${host.innerHTML}`)}
                  v-remove={() => events.push(`remove:${host.innerHTML}`)}
                >
                  tracked
                </span>
              ]
            : null}
        </main>
      );

      expect(mount(host, Component)).toEqual("<main></main>");
      show = true;
      expect(update()).toEqual("<main><i>static</i><span>tracked</span></main>");

      show = false;
      expect(update()).toEqual("<main></main>");
      expect(events).toEqual([
        "cleanup:<main><i>static</i><span>tracked</span></main>",
        "remove:<main><i>static</i></main>"
      ]);
    });

    it("runs persistent vnode cleanup before applying updated attributes", () => {
      const events: string[] = [];
      const state = { phase: "old" };
      const Component = () => (
        <div
          data-phase={state.phase}
          v-cleanup={(vnode: VnodeWithDom) => {
            events.push(vnode.dom.getAttribute("data-phase") as string);
          }}
        />
      );

      expect(mount("body", Component)).toEqual('<div data-phase="old"></div>');
      state.phase = "new";

      expect(update()).toEqual('<div data-phase="new"></div>');
      expect(events).toEqual(["old"]);
    });

    it("keeps directive false scoped to later attribute processing", () => {
      const events: string[] = [];
      const state = { label: "first", blocked: "old" };
      directive("stop-attrs", () => false);
      directive("after-stop", () => events.push("after-stop"));
      const Component = () => (
        <div v-stop-attrs data-blocked={state.blocked} v-after-stop>
          {state.label}
        </div>
      );

      expect(mount("body", Component)).toEqual("<div>first</div>");
      state.label = "second";
      state.blocked = "new";

      expect(update()).toEqual("<div>second</div>");
      expect(events).toEqual([]);
    });

    it("registers v-update returned cleanup for the next cycle", () => {
      const events: string[] = [];
      const state = { phase: "first" };
      const Component = () => (
        <div
          data-phase={state.phase}
          v-update={(vnode: VnodeWithDom) => {
            events.push(`update:${vnode.dom.getAttribute("data-phase")}`);
            return () => {
              events.push(`cleanup:${vnode.dom.getAttribute("data-phase")}`);
            };
          }}
        />
      );

      expect(mount("body", Component)).toEqual('<div data-phase="first"></div>');
      state.phase = "second";
      expect(update()).toEqual('<div data-phase="second"></div>');
      expect(events).toEqual(["update:second"]);

      state.phase = "third";
      expect(update()).toEqual('<div data-phase="third"></div>');
      expect(events).toEqual(["update:second", "cleanup:second", "update:third"]);
    });

    it("calls function refs with DOM and then null on removal", () => {
      const events: Array<string | null> = [];
      let show = true;
      const Component = () => <div>{show ? <span v-ref={(dom: DomElement | null) => events.push(dom?.nodeName.toLowerCase() || null)} /> : null}</div>;

      expect(mount("body", Component)).toEqual("<div><span></span></div>");
      show = false;

      expect(update()).toEqual("<div></div>");
      expect(events).toEqual(["span", null]);
    });

    it("cleans the old function ref when the callback changes", () => {
      const events: string[] = [];
      const refA = (dom: DomElement | null) => events.push(`a:${dom?.nodeName.toLowerCase() || "null"}`);
      const refB = (dom: DomElement | null) => events.push(`b:${dom?.nodeName.toLowerCase() || "null"}`);
      let ref = refA;
      const Component = () => <span v-ref={ref} />;

      expect(mount("body", Component)).toEqual("<span></span>");
      ref = refB;

      expect(update()).toEqual("<span></span>");
      expect(events).toEqual(["a:span", "a:null", "b:span"]);
    });

    it("cleans a function ref when it disappears from a persistent vnode", () => {
      const events: string[] = [];
      const ref = (dom: DomElement | null) => events.push(dom?.nodeName.toLowerCase() || "null");
      let useRef = true;
      const Component = () => <span {...(useRef ? { "v-ref": ref } : {})} />;

      expect(mount("body", Component)).toEqual("<span></span>");
      useRef = false;

      expect(update()).toEqual("<span></span>");
      expect(events).toEqual(["span", "null"]);
    });

    it("cleans a function ref on unmount", () => {
      const events: string[] = [];
      const Component = () => <span v-ref={(dom: DomElement | null) => events.push(dom?.nodeName.toLowerCase() || "null")} />;

      expect(mount("body", Component)).toEqual("<span></span>");
      expect(unmount()).toEqual("");
      expect(events).toEqual(["span", "null"]);
    });

    it("cleans object refs on removal", () => {
      const ref: { current: DomElement | null } = { current: null };
      let show = true;
      const Component = () => <div>{show ? <span v-ref={ref} /> : null}</div>;

      expect(mount("body", Component)).toEqual("<div><span></span></div>");
      expect(ref.current?.nodeName.toLowerCase()).toEqual("span");

      show = false;
      expect(update()).toEqual("<div></div>");
      expect(ref.current).toBeNull();
    });

    it("cleans the old object ref when the object changes", () => {
      const refA: { current: DomElement | null } = { current: null };
      const refB: { current: DomElement | null } = { current: null };
      let ref = refA;
      const Component = () => <span v-ref={ref} />;

      expect(mount("body", Component)).toEqual("<span></span>");
      expect(refA.current?.nodeName.toLowerCase()).toEqual("span");

      ref = refB;
      expect(update()).toEqual("<span></span>");
      expect(refA.current).toBeNull();
      expect(refB.current?.nodeName.toLowerCase()).toEqual("span");
    });

    it("cleans an object ref when it disappears from a persistent vnode", () => {
      const ref: { current: DomElement | null } = { current: null };
      let useRef = true;
      const Component = () => <span {...(useRef ? { "v-ref": ref } : {})} />;

      expect(mount("body", Component)).toEqual("<span></span>");
      expect(ref.current?.nodeName.toLowerCase()).toEqual("span");

      useRef = false;
      expect(update()).toEqual("<span></span>");
      expect(ref.current).toBeNull();
    });

    it("defers update calls made during commit until the current commit finishes", () => {
      const state = { label: "first", rerendered: false };
      const Component = () => (
        <section
          v-update={() => {
            if (!state.rerendered) {
              state.rerendered = true;
              state.label = "third";
              update();
            }
          }}
        >
          {state.label}
        </section>
      );

      expect(mount("body", Component)).toEqual("<section>first</section>");
      state.label = "second";

      expect(update()).toEqual("<section>third</section>");
    });

    it("should allow to identify lifecycles", () => {
      const events: string[] = [];
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

    it("keeps v-create sync-only when a Promise is returned", async () => {
      const deferred = createDeferred<() => void>();
      const state = { phase: "idle" };
      const events: string[] = [];
      const host = document.createElement("div");

      const Component = () => (
        <div
          v-create={() =>
            deferred.promise.then(() => {
              state.phase = "settled";
              return () => {
                events.push("cleanup");
              };
            })
          }
        >
          <span>{state.phase}</span>
        </div>
      );

      expect(mount(host, Component)).toEqual("<div><span>idle</span></div>");

      deferred.resolve(() => {
        events.push("cleanup");
      });
      await Promise.resolve();
      await wait(60);

      expect(host.innerHTML).toEqual("<div><span>idle</span></div>");
      expect(update()).toEqual("<div><span>settled</span></div>");

      expect(unmount()).toEqual("");
      expect(events).toEqual([]);
    });

    it("keeps v-update sync-only when a Promise is returned", async () => {
      const deferred = createDeferred<() => void>();
      const state = { phase: "idle", version: 0 };
      const events: string[] = [];
      const host = document.createElement("div");

      const Component = () => (
        <div
          v-update={() =>
            deferred.promise.then(() => {
              state.phase = "settled";
              return () => {
                events.push("cleanup");
              };
            })
          }
        >
          <span>{state.phase}</span>
          <span>{state.version}</span>
        </div>
      );

      expect(mount(host, Component)).toEqual("<div><span>idle</span><span>0</span></div>");

      state.version = 1;
      expect(update()).toEqual("<div><span>idle</span><span>1</span></div>");

      deferred.resolve(() => {
        events.push("cleanup");
      });
      await Promise.resolve();
      await wait(60);

      expect(host.innerHTML).toEqual("<div><span>idle</span><span>1</span></div>");
      expect(update()).toEqual("<div><span>settled</span><span>1</span></div>");

      expect(unmount()).toEqual("");
      expect(events).toEqual([]);
    });
  });
});
