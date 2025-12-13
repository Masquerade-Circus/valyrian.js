import { expect, describe, test as it, beforeEach, afterEach } from "bun:test";
import "valyrian.js/node";
import { v, mount, unmount, Children, Component } from "valyrian.js";
import { Suspense } from "valyrian.js/suspense";
import { wait } from "./utils/helpers";

describe("Suspense", () => {
  beforeEach(unmount);
  afterEach(unmount);

  it("should render the fallback while the children are loading", async () => {
    const dom = document.createElement("div");

    async function LazyComponent() {
      await wait(5);
      return <div>Component loaded</div>;
    }

    function App() {
      return (
        <Suspense key="lazy" fallback={<div>Loading...</div>}>
          {<LazyComponent />}
        </Suspense>
      );
    }

    mount(dom, App);

    expect(dom.innerHTML).toEqual("<div>Loading...</div>");
  });

  it("should render the children after they have loaded", async () => {
    const dom = document.createElement("div");

    async function LazyComponent({}, children: Children) {
      await wait(5);
      return <div>Component loaded {children}</div>;
    }

    function App() {
      return (
        <Suspense key="lazy" fallback={<div>Loading...</div>}>
          <LazyComponent>Hello World</LazyComponent>
        </Suspense>
      );
    }

    mount(dom, App);
    expect(dom.innerHTML).toEqual("<div>Loading...</div>");

    await wait(60);
    expect(dom.innerHTML).toEqual("<div>Component loaded Hello World</div>");
  });

  it("should render the error component if an error occurs during loading", async () => {
    const dom = document.createElement("div");

    async function FailingComponent() {
      await wait(5);
      throw new Error("Load error");
    }

    function App() {
      return (
        <Suspense key="lazy" fallback={<div>Loading...</div>} error={(e) => <div>Error: {e.message}</div>}>
          <FailingComponent />
        </Suspense>
      );
    }

    unmount();
    mount(dom, App);

    await wait(60);
    expect(dom.innerHTML).toEqual("<div>Error: Load error</div>");
  });

  it("should render correctly with a mix of functional components, POJOComponents, and content", async () => {
    const dom = document.createElement("div");

    async function FunctionalComponent() {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return <span>Funcional</span>;
    }

    const POJOComponent = {
      async view() {
        await wait(5);
        return <div>POJOComponent</div>;
      }
    } as unknown as Component;

    function App() {
      return (
        <Suspense key="lazy" fallback={<div>Cargando...</div>}>
          <FunctionalComponent />
          <POJOComponent />
          Hello World
        </Suspense>
      );
    }

    mount(dom, App);

    await wait(60);
    expect(dom.innerHTML).toEqual("<span>Funcional</span><div>POJOComponent</div>Hello World");
  });

  it("should handle empty or immediately resolved promises", async () => {
    const dom = document.createElement("div");

    async function EmptyComponent() {
      return <div>Empty component</div>;
    }

    function App() {
      return (
        <Suspense key="lazy" fallback={<div>Loading...</div>}>
          <EmptyComponent />
        </Suspense>
      );
    }

    mount(dom, App);

    await wait(60);
    expect(dom.innerHTML).toEqual("<div>Empty component</div>");
  });
});
