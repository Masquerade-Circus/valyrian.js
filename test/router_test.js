/* eslint-disable no-console */
import plugin, { Router } from "../lib/router";

import expect from "expect";
import nodePlugin from "../lib/node";
import v from "../lib/index";

v.use(plugin);
v.use(nodePlugin);

// eslint-disable-next-line max-lines-per-function
describe("Router", () => {
  it("Hard test", async () => {
    let Component = () => <div>Hello world</div>;
    let router = new Router();
    router
      .add(
        "/",
        () => console.log("Hello 1"),
        () => Component
      )
      .add("/hello", [() => console.log("Hello 2"), () => Component])
      .add("/hello/", [() => console.log("Hello 3"), () => Component])
      .add("/:hello", [() => console.log("Hello 4"), () => Component])
      .add("/hello/(.*)", [() => console.log("Hello 5"), () => Component])
      .add(
        "/:hello/world",
        () => console.log("Hello 6"),
        [() => console.log("Hello 6")],
        () => Component
      )
      .add("/hello/:world", [() => console.log("Hello 7"), () => Component], () => console.log("Hello 7"));

    let subrouter = new Router();

    subrouter
      .add(
        "/",
        () => console.log("Hello 1"),
        () => Component
      )
      .add("/hello", [() => console.log("Hello 2"), () => Component])
      .add("/hello/", [() => console.log("Hello 3"), () => Component])
      .add("/:hello", [() => console.log("Hello 4"), () => Component])
      .add("/hello/(.*)", [() => console.log("Hello 5"), () => Component])
      .add(
        "/:hello/world",
        () => console.log("Hello 6"),
        [() => console.log("Hello 6")],
        () => Component
      )
      .add("/hello/:world", [() => console.log("Hello 7"), () => Component], () => console.log("Hello 7"))
      .use(() => () => "Not ok");

    router.use("/ok", subrouter);
    router.use(() => () => "Not found");

    v.mountRouter("body", router);
    expect(await router.go("/ok/not/found/url?hello=world")).toEqual("Not ok");
    expect(await router.go("/not/found/url?hello=world")).toEqual("Not found");
  });

  it("Mount and update with POJO component", async () => {
    let Component = {
      world: "World",
      id: "example",
      view() {
        return <div id={this.id}>Hello {this.world}</div>;
      }
    };

    let result = {};
    let router = new Router();
    router.add("/", () => Component);
    v.mountRouter("body", router);

    result.before = await router.go("/");
    Component.world = "John Doe";
    result.after = await router.go("/");
    Component.world = "World";
    result.final = v.update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>',
      final: '<div id="example">Hello World</div>'
    });
  });

  it("Mount and update with functional stateful component", async () => {
    let Component = function () {
      return <div id={this.id}>Hello {this.world}</div>;
    };

    Component.world = "World";
    Component.id = "example";

    let result = {};
    let router = new Router();
    router.add("/", () => Component);
    v.mountRouter("body", router);

    result.before = await router.go("/");
    Component.world = "John Doe";
    result.after = await router.go("/");
    Component.world = "World";
    result.final = v.update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>',
      final: '<div id="example">Hello World</div>'
    });
  });

  it("Mount and update with functional stateless subcomponent", async () => {
    let SubComponent = (props) => <div id={props.id}>Hello {props.world}</div>;
    let state = {
      world: "World",
      id: "example"
    };
    let Component = function () {
      return <SubComponent {...state} />;
    };

    let result = {};
    let router = new Router();
    router.add("/", () => Component);
    v.mountRouter("body", router);

    result.before = await router.go("/");
    state.world = "John Doe";
    result.after = await router.go("/");
    state.world = "World";
    result.final = v.update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>',
      final: '<div id="example">Hello World</div>'
    });
  });

  it("Antipattern: Mount and update with functional stateless component", async () => {
    let Component = (props) => <div id={props.id}>Hello {props.world}</div>;
    let props = {
      world: "World",
      id: "example"
    };

    let result = {};
    let router = new Router();
    router.add("/", () => <Component {...props} />);
    v.mountRouter("body", router);

    result.before = await router.go("/");
    props.world = "John Doe";
    result.after = await router.go("/");
    props.world = "World";
    result.final = await router.go("/");

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>',
      final: '<div id="example">Hello World</div>'
    });
  });

  it("Test not found url", async () => {
    let Hello = () => "Hello world";
    let NotFound = () => <div>Ups, no route was found.</div>;

    let router = new Router();
    router.add("/", () => Hello);
    router.use(() => NotFound);

    v.mountRouter("body", router);

    let result = {};
    result.found = await router.go("/");
    result.notFound = await router.go("/not_found");

    expect(result).toEqual({
      found: "Hello world",
      notFound: "<div>Ups, no route was found.</div>"
    });
  });

  it("Test params", async () => {
    let Store = {
      world: "world",
      up: "up"
    };
    let Hello = function () {
      return (
        <div>
          Hello {this.world}, what's {this.up}
        </div>
      );
    };

    let router = new Router();
    router.add(
      "/hello",
      () => Object.assign(Hello, Store),
      () => Hello
    );
    router.add("/hello/:world/whats/:up", [({ params }) => Object.assign(Hello, params), () => Hello]);

    v.mountRouter("body", router);

    let result = {};
    result.before = await router.go("/hello");
    result.after = await router.go("/hello/Mike/whats/new");

    expect(result).toEqual({
      before: "<div>Hello world, what's up</div>",
      after: "<div>Hello Mike, what's new</div>"
    });
  });

  it("Test mix single and array of middlewares", async () => {
    let Hello = () => <div>Hello World</div>;
    let middlewares = [];

    let router = new Router();
    router.add(
      "/",
      () => middlewares.push("Middleware 1"),
      [
        () => middlewares.push("Middleware 1.1"),
        () => middlewares.push("Middleware 1.2"),
        [
          () => middlewares.push("Middleware 1.2.1"),
          () => middlewares.push("Middleware 1.2.2"),
          () => middlewares.push("Middleware 1.2.3"),
          () => middlewares.push("Middleware 1.2.4")
        ]
      ],
      () => middlewares.push("Middleware 2"),
      // This is the final response
      () => Hello
    );
    v.mountRouter("body", router);

    let result = await router.go("/");

    expect(result).toEqual("<div>Hello World</div>");
    expect(middlewares).toEqual([
      "Middleware 1",
      "Middleware 1.1",
      "Middleware 1.2",
      "Middleware 1.2.1",
      "Middleware 1.2.2",
      "Middleware 1.2.3",
      "Middleware 1.2.4",
      "Middleware 2"
    ]);
  });

  it("Test subrouter", async () => {
    let Component = function () {
      return (
        <div>
          Hello {this.world}, from {this.country}
        </div>
      );
    };

    let subrouter = new Router();
    subrouter
      .add("/from/:country", ({ params }) => {
        Component.world = params.world;
        Component.country = params.country;
        return Component;
      })
      .add("/", ({ params }) => {
        Component.world = params.world;
        Component.country = "USA";
        return Component;
      });

    let router = new Router();
    router.use("/hello/:world", subrouter);
    v.mountRouter("body", router);

    let result = {};
    result.before = await router.go("/hello/Mike");
    result.after = await router.go("/hello/John/from/Mexico");

    expect(result).toEqual({
      before: "<div>Hello Mike, from USA</div>",
      after: "<div>Hello John, from Mexico</div>"
    });
  });

  it("Test with parent component", async () => {
    let Component = () => <div>Hello World</div>;
    // children are always the second argument
    let ParentComponent = (props, ...children) => (
      <html>
        <body>{children}</body>
      </html>
    );

    let router = new Router();
    router.add("/", () => Component);
    v.mountRouter("body", router);

    let result = await router.go("/", ParentComponent);

    expect(result).toEqual("<html><body><div>Hello World</div></body></html>");
  });

  it("Test show error when calling with a non url", async () => {
    let Component = () => <div>Hello World</div>;

    let router = new Router();
    router.add("/", () => Component);
    v.mountRouter("body", router);

    let err;
    try {
      await router.go(null);
    } catch (error) {
      err = error.message;
    }

    expect(err).toEqual("router.url.required");
  });

  it("Test show error when no component is returned", async () => {
    let router = new Router();
    router.add("/", () => {
      // Component is not returned
    });
    v.mountRouter("body", router);

    let err;
    try {
      await router.go("/");
    } catch (error) {
      err = error.message;
    }

    expect(err).toEqual("The url / requested wasn't found");
  });

  it("Test get routes", () => {
    let Component = () => "Hello world";
    let subrouter = new Router();
    subrouter.add("/from/:country", () => Component).add("/", () => Component);

    let router = new Router();
    router.use("/hello/:world", subrouter).add("/", () => Component);

    v.mountRouter("body", router);

    expect(router.routes()).toEqual(["/hello/:world/from/:country", "/hello/:world", "/"]);
  });

  it("Test the onClick handler for a single route", async () => {
    let Component = () => <div>Hello World</div>;
    let OtherComponent = () => <div>Hello Other World</div>;

    let router = new Router();
    router.add("/", () => Component);
    router.add("/other", () => OtherComponent);
    v.mountRouter("body", router);
    let result = {
      before: await router.go("/")
    };

    let handler = router.getOnClickHandler("/other");
    handler({ preventDefault: () => {} });

    await new Promise((resolve) => setTimeout(resolve, 10));

    result.after = v.update();

    expect(result).toEqual({
      before: "<div>Hello World</div>",
      after: "<div>Hello Other World</div>"
    });
  });

  it("Test the onClick handler for a route with params", async () => {
    let Component = ({ world }) => <div>Hello {world}</div>;
    let OtherComponent = () => <div>Hello Other World</div>;

    let router = new Router();
    router.add("/other", () => OtherComponent);
    router.add("/:world", (req) => <Component world={req.params.world} />);
    v.mountRouter("body", router);
    let result = {
      before: await router.go("/other")
    };

    let handler = router.getOnClickHandler("/Mike");
    handler({ preventDefault: () => {} });

    await new Promise((resolve) => setTimeout(resolve, 10));

    result.after = v.update();

    expect(result).toEqual({
      before: "<div>Hello Other World</div>",
      after: "<div>Hello Mike</div>"
    });
  });

  it("Test the onClick handler from a route with query params (?param=value) to another route with query params (?param=value)", async () => {
    let Component = ({ world }) => <div>Hello {world}</div>;

    let router = new Router();
    router.add("/world", (req) => <Component world={req.query.world} />);
    v.mountRouter("body", router);
    let result = {
      before: await router.go("/world?world=world")
    };

    let handler = router.getOnClickHandler("/world?world=Mike");
    handler({ preventDefault: () => {} });

    await new Promise((resolve) => setTimeout(resolve, 10));

    result.after = v.update();

    expect(result).toEqual({
      before: "<div>Hello world</div>",
      after: "<div>Hello Mike</div>"
    });
  });
});
