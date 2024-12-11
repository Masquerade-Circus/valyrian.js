import { expect, describe, test as it, beforeEach, afterEach } from "bun:test";
import { v, mount, unmount, Children, ValyrianComponent, Component } from "valyrian.js";
import { Suspense } from "valyrian.js/suspense";

describe("Suspense", () => {
  beforeEach(unmount);
  afterEach(unmount);

  it("should render the fallback while the children are loading", () => {
    const dom = document.createElement("div");

    async function LazyComponent() {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return <div>Component loaded</div>;
    }

    function App() {
      return <Suspense fallback={<div>Loading...</div>}>{<LazyComponent />}</Suspense>;
    }

    mount(dom, App);

    expect(dom.innerHTML).toEqual("<div>Loading...</div>");
  });

  it("should render the children after they have loaded", async () => {
    const dom = document.createElement("div");

    async function LazyComponent({}, ...children: Children) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return <div>Component loaded {children}</div>;
    }

    function App() {
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <LazyComponent>Hello World</LazyComponent>
        </Suspense>
      );
    }

    mount(dom, App);

    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(dom.innerHTML).toEqual("<div>Component loaded Hello World</div>");
  });

  it("should render the error component if an error occurs during loading", async () => {
    const dom = document.createElement("div");

    async function FailingComponent() {
      await new Promise((resolve) => setTimeout(resolve, 5));
      throw new Error("Load error");
    }

    function App() {
      return (
        <Suspense fallback={<div>Loading...</div>} error={(e) => <div>Error: {e.message}</div>}>
          <FailingComponent />
        </Suspense>
      );
    }

    unmount();
    mount(dom, App);

    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(dom.innerHTML).toEqual("<div>Error: Load error</div>");
  });

  it("should render correctly with a mix of functional components, POJOComponents, and content", async () => {
    const dom = document.createElement("div");

    async function FunctionalComponent() {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return <span>Funcional</span>;
    }

    const POJOComponent = {
      view() {
        return new Promise((resolve) => setTimeout(() => resolve(<div>POJOComponent</div>), 5));
      }
    } as unknown as Component;

    function App() {
      return (
        <Suspense fallback={<div>Cargando...</div>}>
          <FunctionalComponent />
          <POJOComponent />
          Hello World
        </Suspense>
      );
    }

    mount(dom, App);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(dom.innerHTML).toEqual("<span>Funcional</span><div>POJOComponent</div>Hello World");
  });

  it("should handle empty or immediately resolved promises", async () => {
    const dom = document.createElement("div");

    async function EmptyComponent() {
      return <div>Empty component</div>;
    }

    function App() {
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <EmptyComponent />
        </Suspense>
      );
    }

    mount(dom, App);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(dom.innerHTML).toEqual("<div>Empty component</div>");
  });
});
