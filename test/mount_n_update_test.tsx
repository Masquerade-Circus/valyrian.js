/* eslint-disable max-lines-per-function */
import "valyrian.js/node";

import * as Valyrian from "valyrian.js";
import { mount, trust, update, v, unmount, debouncedUpdate, Properties, Children, VnodeWithDom, Component } from "valyrian.js";

import { expect, describe, test as it, beforeEach, afterEach } from "bun:test";

describe("Mount and update", () => {
  type DelegatedEventMock = {
    type: string;
    target: Element;
    defaultPrevented: boolean;
    preventDefault: () => void;
  };

  function createDeferred() {
    let resolve!: () => void;
    const promise = new Promise<void>((nextResolve) => {
      resolve = nextResolve;
    });

    return { promise, resolve };
  }

  function expectPreventUpdateExport() {
    expect(Reflect.has(Valyrian, "preventUpdate")).toEqual(true);

    const preventUpdate = Reflect.get(Valyrian, "preventUpdate");
    expect(typeof preventUpdate).toEqual("function");

    return preventUpdate as () => void;
  }

  async function waitForPostHandlerUpdate(handlerDone: Promise<void>) {
    await handlerDone;
    await Promise.resolve();
  }

  function createDelegatedEvent(target: Element): DelegatedEventMock {
    return {
      type: "click",
      target,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      }
    };
  }

  function mountDelegatedComponent(component: () => any) {
    const listeners: Record<string, (event: Event) => void> = {};
    const dom = document.createElement("div");
    (dom as any).addEventListener = (type: string, callback: EventListenerOrEventListenerObject | null) => {
      listeners[type] = callback as (event: Event) => void;
    };
    (dom as any).removeEventListener = () => {};

    mount(dom, component);

    return {
      dom,
      dispatchClick(event = createDelegatedEvent(dom.childNodes[0] as unknown as Element)) {
        listeners.click(event as unknown as Event);

        return event;
      }
    };
  }

  function withControlledTimeouts() {
    const originalSetTimeout = globalThis.setTimeout;
    const originalClearTimeout = globalThis.clearTimeout;
    let nextId = 1;
    const scheduled = new Map<number, TimerHandler>();

    globalThis.setTimeout = ((handler: TimerHandler) => {
      const id = nextId++;
      scheduled.set(id, handler);
      return id as unknown as Timer;
    }) as typeof setTimeout;

    globalThis.clearTimeout = ((timeoutId?: Timer) => {
      if (typeof timeoutId === "number") {
        scheduled.delete(timeoutId);
      }
    }) as typeof clearTimeout;

    return {
      flushNext() {
        const nextEntry = scheduled.entries().next();
        if (nextEntry.done) {
          throw new Error("No controlled timeout scheduled");
        }

        const [id, handler] = nextEntry.value;
        scheduled.delete(id);
        if (typeof handler === "function") {
          handler();
          return;
        }

        throw new Error("String timeout handlers are not supported in this test");
      },
      restore() {
        globalThis.setTimeout = originalSetTimeout;
        globalThis.clearTimeout = originalClearTimeout;
      }
    };
  }

  it("Mount and update with POJO component", () => {
    const Component = {
      world: "World",
      id: "example",
      view() {
        return <div id={Component.id}>Hello {Component.world}</div>;
      }
    };

    const result: any = {};

    result.before = mount("body", Component.view);
    Component.world = "John Doe";
    result.after = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Mount and update with functional stateful component", () => {
    function Component() {
      return <div id={Component.id}>Hello {Component.world}</div>;
    }
    Component.world = "World";
    Component.id = "example";

    const result: any = {};

    result.before = mount("body", Component);
    Component.world = "John Doe";
    result.after = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Mount and update with functional stateless subcomponent", () => {
    const SubComponent = (props: Properties) => <div id={props.id}>Hello {props.world}</div>;
    const state = {
      world: "World",
      id: "example"
    };
    const Component = function () {
      return <SubComponent {...state} />;
    };

    const result: any = {};

    result.before = mount("body", Component);
    state.world = "John Doe";
    result.after = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Mount and update with Vnode Component", () => {
    const Component = ({ hello }: Properties, ...children: Children) => (
      <div id="example">
        <span>Hello World</span>
        <span>Hello {hello}</span>
        {children}
      </div>
    );

    expect(
      mount(
        "body",
        <Component hello="world">
          <span>Hello John</span>
          <span>Hello Jane</span>
        </Component>
      )
    ).toEqual(
      '<div id="example"><span>Hello World</span><span>Hello world</span><span>Hello John</span><span>Hello Jane</span></div>'
    );
  });

  it("Mount with class component", () => {
    class Component {
      id: string;
      world: string;
      constructor() {
        this.id = "example";
        this.world = "World";
      }
      view() {
        return <div id={this.id}>Hello {this.world}</div>;
      }
    }

    const ComponentInstance = new Component();

    const result: any = {};

    result.before = mount("body", ComponentInstance);
    ComponentInstance.world = "John Doe";
    result.after = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Mount with non component", () => {
    const result = mount("body", "Hello world");
    expect(result).toEqual("Hello world");

    const result2 = mount("body", 123);
    expect(result2).toEqual("123");

    const result3 = mount("body", new Date(Date.UTC(2012, 11, 20, 3, 0, 0)));
    expect(result3).toEqual("Thu Dec 20 2012 03:00:00 GMT+0000 (Coordinated Universal Time)");
  });

  it("Handle multiple update calls", () => {
    const Component = {
      world: "World",
      id: "example",
      view() {
        return <div id={Component.id}>Hello {Component.world}</div>;
      }
    };
    const result: any = {};

    result.before = mount("body", Component);
    Component.world = "John Doe";
    result.after = update();
    result.afteragain = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>',
      afteragain: '<div id="example">Hello John Doe</div>'
    });
  });

  it("should auto-update delegated events even when preventDefault is called", () => {
    unmount();

    const state = { count: 0 };
    const Component = () => (
      <button
        onclick={(event: Event) => {
          state.count += 1;
          if (state.count === 2) {
            event.preventDefault();
          }
        }}
      >
        {state.count}
      </button>
    );

    const { dom, dispatchClick } = mountDelegatedComponent(Component);

    dispatchClick();
    expect(dom.innerHTML).toEqual("<button>1</button>");

    const secondEvent = dispatchClick();
    expect(secondEvent.defaultPrevented).toEqual(true);
    expect(dom.innerHTML).toEqual("<button>2</button>");
  });

  it("should expose preventUpdate as a public runtime api", () => {
    expectPreventUpdateExport();
  });

  it("should let preventUpdate suppress sync delegated auto-updates until a manual update", () => {
    unmount();

    const preventUpdate = expectPreventUpdateExport();

    const state = { count: 0 };
    const Component = () => (
      <button
        onclick={() => {
          state.count += 1;
          preventUpdate();
        }}
      >
        {state.count}
      </button>
    );

    const { dom, dispatchClick } = mountDelegatedComponent(Component);
    dispatchClick();
    expect(dom.innerHTML).toEqual("<button>0</button>");
    expect(update()).toEqual("<button>1</button>");
  });

  it("should keep the outer delegated event active for preventUpdate after a nested delegated dispatch", () => {
    unmount();

    const preventUpdate = expectPreventUpdateExport();
    const state = { outer: 0, inner: 0 };
    let triggerInnerClick = () => {
      throw new Error("Inner click dispatcher not initialized");
    };

    const Component = () => (
      <div>
        <button
          onclick={() => {
            triggerInnerClick();
            state.outer += 1;
            preventUpdate();
          }}
        >
          outer:{state.outer}
        </button>
        <button
          onclick={() => {
            state.inner += 1;
          }}
        >
          inner:{state.inner}
        </button>
      </div>
    );

    const { dom, dispatchClick } = mountDelegatedComponent(Component);
    triggerInnerClick = () => dispatchClick(createDelegatedEvent(dom.childNodes[0].childNodes[1] as unknown as Element));

    dispatchClick(createDelegatedEvent(dom.childNodes[0].childNodes[0] as unknown as Element));
    expect(dom.innerHTML).toEqual("<div><button>outer:0</button><button>inner:1</button></div>");
    expect(update()).toEqual("<div><button>outer:1</button><button>inner:1</button></div>");
  });

  it("should auto-update delegated events after async state changes resolve", async () => {
    unmount();
    const state = { phase: "idle" };
    const settled = createDeferred();
    const handlerDone = createDeferred();

    const Component = () => (
      <button
        onclick={async () => {
          state.phase = "loading";
          await settled.promise;
          state.phase = "done";
          handlerDone.resolve();
        }}
      >
        {state.phase}
      </button>
    );

    const { dom, dispatchClick } = mountDelegatedComponent(Component);

    dispatchClick();
    expect(dom.innerHTML).toEqual("<button>loading</button>");

    settled.resolve();
    await waitForPostHandlerUpdate(handlerDone.promise);
    expect(dom.innerHTML).toEqual("<button>done</button>");
  });

  it("should keep immediate and settled async auto-updates when preventDefault is called in delegated events", async () => {
    unmount();
    const state = { phase: "idle" };
    const settled = createDeferred();
    const handlerDone = createDeferred();

    const Component = () => (
      <button
        onclick={async (event: Event) => {
          event.preventDefault();
          state.phase = "loading";
          await settled.promise;
          state.phase = "done";
          handlerDone.resolve();
        }}
      >
        {state.phase}
      </button>
    );

    const { dom, dispatchClick } = mountDelegatedComponent(Component);

    const event = dispatchClick();
    expect(event.defaultPrevented).toEqual(true);
    expect(dom.innerHTML).toEqual("<button>loading</button>");

    settled.resolve();
    await waitForPostHandlerUpdate(handlerDone.promise);
    expect(dom.innerHTML).toEqual("<button>done</button>");
  });

  it("should let preventUpdate skip both automatic async updates in delegated events", async () => {
    unmount();

    const preventUpdate = expectPreventUpdateExport();
    const state = { phase: "idle" };
    const settled = createDeferred();
    const handlerDone = createDeferred();

    const Component = () => (
      <button
        onclick={async () => {
          preventUpdate();
          state.phase = "loading";
          await settled.promise;
          state.phase = "done";
          handlerDone.resolve();
        }}
      >
        {state.phase}
      </button>
    );

    const { dom, dispatchClick } = mountDelegatedComponent(Component);
    dispatchClick();
    expect(dom.innerHTML).toEqual("<button>idle</button>");

    settled.resolve();
    await waitForPostHandlerUpdate(handlerDone.promise);
    expect(dom.innerHTML).toEqual("<button>idle</button>");
    expect(update()).toEqual("<button>done</button>");
  });

  it("should let debouncedUpdate suppress the current delegated event auto-updates", async () => {
    unmount();
    const state = { phase: "idle" };
    const settled = createDeferred();
    const handlerDone = createDeferred();
    const controlledTimeouts = withControlledTimeouts();

    try {
      const Component = () => (
        <button
          onclick={async () => {
            state.phase = "loading";
            debouncedUpdate(5);
            await settled.promise;
            state.phase = "done";
            handlerDone.resolve();
          }}
        >
          {state.phase}
        </button>
      );

      const { dom, dispatchClick } = mountDelegatedComponent(Component);

      dispatchClick();
      expect(dom.innerHTML).toEqual("<button>idle</button>");

      controlledTimeouts.flushNext();
      expect(dom.innerHTML).toEqual("<button>loading</button>");

      settled.resolve();
      await waitForPostHandlerUpdate(handlerDone.promise);
      expect(dom.innerHTML).toEqual("<button>loading</button>");
      expect(update()).toEqual("<button>done</button>");
    } finally {
      controlledTimeouts.restore();
    }
  });

  it("Antipattern: Mount and update with functional stateless component", () => {
    const Component = ({ props }: Properties) => <div id={props.id}>Hello {props.world}</div>;
    const props = {
      world: "World",
      id: "example"
    };

    const result: any = {};

    const app = <Component props={props} />;

    result.before = mount("body", app);
    props.world = "John Doe";
    result.after = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>'
    });
  });

  it("Should update text node with dom node", () => {
    let text = true;
    const Component = () => (text ? "Hello world" : <div>Hello world</div>);

    const result: any = {};

    result.before = mount("body", Component);
    text = false;
    result.after = update();

    expect(result).toEqual({
      before: "Hello world",
      after: "<div>Hello world</div>"
    });
  });

  it("Should update dom node with text node", () => {
    let text = false;
    const Component = () => (text ? "Hello world" : <div>Hello world</div>);

    const result: any = {};

    result.before = mount("body", Component);
    text = true;
    result.after = update();

    expect(result).toEqual({
      before: "<div>Hello world</div>",
      after: "Hello world"
    });
  });

  it("Should remove property if it is set to false", () => {
    let disabled = true;
    const Component = () => <div disabled={disabled}>Hello world</div>;

    const result: any = {};

    result.before = mount("body", Component);
    disabled = false;
    result.after = update();

    expect(result).toEqual({
      before: '<div disabled="true">Hello world</div>',
      after: "<div>Hello world</div>"
    });
  });

  it("Should not add property if it is set to false on first render", () => {
    let disabled = false;
    const Component = () => <div disabled={disabled}>Hello world</div>;

    const result: any = {};

    result.before = mount("body", Component);
    disabled = true;
    result.after = update();

    expect(result).toEqual({
      before: "<div>Hello world</div>",
      after: '<div disabled="true">Hello world</div>'
    });
  });

  it("Should handle different types of data", () => {
    const date = new Date();

    const Component = () => v("div", null, [null, "Hello", , 1, date, { hello: "world" }, ["Hello"]]);
    expect(mount("body", Component)).toEqual(`<div>Hello1${date}[object Object]Hello</div>`);
  });

  it("Should handle svgs", () => {
    const svg =
      // eslint-disable-next-line max-len
      '<svg enable-background="new 0 0 320.523 320.523" version="1.1" viewBox="0 0 320.523 320.523" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="m254.41 225.55l-69.147-69.148 65.289-65.29-91.113-91.113v130.58l-82.726-82.726-10.607 10.606 93.333 93.333v9.222l-93.333 93.333 10.606 10.606 82.726-82.726v138.3l94.972-94.972zm-79.971-189.34l54.9 54.9-54.683 54.683-0.218-0.217 1e-3 -109.37zm0 131.01l0.218-0.217 58.541 58.542-58.759 58.759v-117.08z"></path></svg>';
    const Component = () => trust(svg);

    // eslint-disable-next-line max-len
    expect(mount("body", Component)).toEqual(svg);
  });

  it("should fail silently if try to update before mount", () => {
    unmount();
    update();
  });

  it("should handle text vnode as new node", () => {
    const [vnode] = trust("<span>Some text</span>") as VnodeWithDom[];

    const component = () => vnode;
    const result = mount("body", component);
    expect(result).toEqual("<span>Some text</span>");

    vnode.children = ["Other text"];
    const result2 = update();
    expect(result2).toEqual("<span>Other text</span>");
  });

  it("should handle the passing of state with the state property", () => {
    const state = { foo: "bar" };
    let called = false;
    const component = () => (
      <div
        state={state}
        v-update={(vnode: VnodeWithDom, oldProps: Properties) => {
          called = true;
          expect(vnode.props.state).toEqual(oldProps.state);
        }}
      />
    );

    const result = mount("body", component);
    expect(result).toEqual("<div></div>");

    const result2 = update();
    expect(result2).toEqual("<div></div>");

    expect(called).toEqual(true);
  });

  it("should allow to use fragments", () => {
    const Component = () => (
      <>
        <span>Hello</span>
        <span>World</span>
      </>
    );

    const result = mount("body", Component);
    expect(result).toEqual("<span>Hello</span><span>World</span>");
  });

  it("should allow to use fragments in subcomponents", () => {
    const SubComponent = () => (
      <>
        <span>Hello</span>
        <span>World</span>
      </>
    );

    const Component = () => (
      <>
        <div>
          Simon says <SubComponent />
        </div>
      </>
    );

    const result = mount("body", Component);
    expect(result).toEqual("<div>Simon says <span>Hello</span><span>World</span></div>");
  });

  it("should allow to mount direct text and vnode", () => {
    // Direct text
    const result1 = mount("body", "Hello world");

    // Direct component that return text
    const result2 = mount("body", () => "Hello world 2");

    // Direct vnode
    const result3 = mount("body", <div>Hello world 3</div>);

    // Direct component that return vnode
    const result4 = mount("body", () => <div>Hello world 4</div>);

    const Component = () => <span>Hello world 5</span>;

    // Vnode component
    const result5 = mount("body", <Component />);

    // Direct fragment
    const result6 = mount(
      "body",
      <>
        <Component /> - 6
      </>
    );

    // Direct component that return fragment
    const result7 = mount("body", () => (
      <>
        <Component /> - 7
      </>
    ));

    // POJO component
    const pojo = {
      view() {
        return <div>Hello world 8</div>;
      }
    };
    const result8 = mount("body", pojo.view);

    class ClassComponent {
      view() {
        return <div>Hello world 9</div>;
      }
    }

    const InstanceClassComponent = new ClassComponent() as unknown as Component;

    // Class component
    const result9 = mount("body", InstanceClassComponent);

    // Vnode component from class component
    const result10 = mount("body", <InstanceClassComponent />);

    expect(result1).toEqual("Hello world");
    expect(result2).toEqual("Hello world 2");
    expect(result3).toEqual("<div>Hello world 3</div>");
    expect(result4).toEqual("<div>Hello world 4</div>");
    expect(result5).toEqual("<span>Hello world 5</span>");
    expect(result6).toEqual("<span>Hello world 5</span> - 6");
    expect(result7).toEqual("<span>Hello world 5</span> - 7");
    expect(result8).toEqual("<div>Hello world 8</div>");
    expect(result9).toEqual("<div>Hello world 9</div>");
    expect(result10).toEqual("<div>Hello world 9</div>");
  });

  it("should test deepley nested components", () => {
    const ChildComponent = () => (
      <>
        <div>Hello World</div>Hello 2
      </>
    );
    const Component = () => (
      <>
        <div>
          <span>Hello</span>
          <span>World</span>
          <ChildComponent />
        </div>
        <div>
          <span>Hello</span>
          <span>World</span>
          <ChildComponent />
        </div>
      </>
    );
    const result = mount("body", Component);

    expect(result).toEqual(
      "<div><span>Hello</span><span>World</span><div>Hello World</div>Hello 2</div><div><span>Hello</span><span>World</span><div>Hello World</div>Hello 2</div>"
    );

    /* for (let i = 0; i < 1000000; i++) {
      update();
    } */
  });
});

describe("Benchmark Test: Mount and update", function () {
  beforeEach(unmount);
  afterEach(unmount);

  it("should benchmark mount and update times", function () {
    const iterations = 1000;
    const createComponent = (index: number) =>
      v("div", { id: `test-${index}`, class: `class-${index}` }, [
        v("span", { "data-index": index }, `Texto del nodo ${index}`),
        v("input", { type: "text", value: `input-${index}` })
      ]);

    const children: any = [];
    for (let i = 0; i < iterations; i++) {
      children.push(createComponent(i));
    }
    function Component() {
      return v("div", null, children);
    }

    // eslint-disable-next-line no-console
    console.time("Mount");
    mount("body", Component);
    // eslint-disable-next-line no-console
    console.timeEnd("Mount");

    children.length = 0;
    // eslint-disable-next-line no-console
    console.time("Update");
    for (let i = 0; i < iterations; i++) {
      children.push(createComponent(i));
      update();
    }
    // eslint-disable-next-line no-console
    console.timeEnd("Update");
  });
});
