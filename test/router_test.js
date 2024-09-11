import "valyrian.js/node";

/* eslint-disable no-console */
import { Router, mountRouter } from "valyrian.js/router";
import { update, v } from "valyrian.js";

import expect from "expect";

// eslint-disable-next-line max-lines-per-function
describe("Router", () => {
  it("Hard test", async () => {
    const Component = () => <div>Hello world</div>;
    const router = new Router();
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

    const subrouter = new Router();

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

    mountRouter("body", router);
    expect(await router.go("/ok/not/found/url?hello=world")).toEqual("Not ok");
    expect(await router.go("/not/found/url?hello=world")).toEqual("Not found");
  });

  it("Mount and update with POJO component", async () => {
    const Component = {
      world: "World",
      id: "example",
      view() {
        return <div id={this.id}>Hello {this.world}</div>;
      }
    };

    const result = {};
    const router = new Router();
    router.add("/", () => Component);
    mountRouter("body", router);

    result.before = await router.go("/");
    Component.world = "John Doe";
    result.after = await router.go("/");
    Component.world = "World";
    result.final = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>',
      final: '<div id="example">Hello World</div>'
    });
  });

  it("Mount and update with functional stateful component", async () => {
    const Component = function () {
      return <div id={this.id}>Hello {this.world}</div>;
    };

    Component.world = "World";
    Component.id = "example";

    const result = {};
    const router = new Router();
    router.add("/", () => Component);
    mountRouter("body", router);

    result.before = await router.go("/");
    Component.world = "John Doe";
    result.after = await router.go("/");
    Component.world = "World";
    result.final = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>',
      final: '<div id="example">Hello World</div>'
    });
  });

  it("Mount and update with functional stateless subcomponent", async () => {
    const SubComponent = (props) => <div id={props.id}>Hello {props.world}</div>;
    const state = {
      world: "World",
      id: "example"
    };
    const Component = function () {
      return <SubComponent {...state} />;
    };

    const result = {};
    const router = new Router();
    router.add("/", () => Component);
    mountRouter("body", router);

    result.before = await router.go("/");
    state.world = "John Doe";
    result.after = await router.go("/");
    state.world = "World";
    result.final = update();

    expect(result).toEqual({
      before: '<div id="example">Hello World</div>',
      after: '<div id="example">Hello John Doe</div>',
      final: '<div id="example">Hello World</div>'
    });
  });

  it("Antipattern: Mount and update with functional stateless component", async () => {
    const Component = (props) => <div id={props.id}>Hello {props.world}</div>;
    const props = {
      world: "World",
      id: "example"
    };

    const result = {};
    const router = new Router();
    router.add("/", () => <Component {...props} />);
    mountRouter("body", router);

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
    const Hello = () => "Hello world";
    const NotFound = () => <div>Ups, no route was found.</div>;

    const router = new Router();
    router.add("/", () => Hello);
    router.use(() => NotFound);

    mountRouter("body", router);

    const result = {};
    result.found = await router.go("/");
    result.notFound = await router.go("/not_found");

    expect(result).toEqual({
      found: "Hello world",
      notFound: "<div>Ups, no route was found.</div>"
    });
  });

  it("Test params", async () => {
    const Store = {
      world: "world",
      up: "up"
    };
    const Hello = function () {
      return (
        <div>
          Hello {this.world}, what's {this.up}
        </div>
      );
    };

    const router = new Router();
    router.add(
      "/hello",
      () => Object.assign(Hello, Store),
      () => Hello
    );
    router.add("/hello/:world/whats/:up", [({ params }) => Object.assign(Hello, params), () => Hello]);

    mountRouter("body", router);

    const result = {};
    result.before = await router.go("/hello");
    result.after = await router.go("/hello/Mike/whats/new");

    expect(result).toEqual({
      before: "<div>Hello world, what's up</div>",
      after: "<div>Hello Mike, what's new</div>"
    });
  });

  it("Test mix single and array of middlewares", async () => {
    const Hello = () => <div>Hello World</div>;
    const middlewares = [];

    const router = new Router();
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
    mountRouter("body", router);

    const result = await router.go("/");

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
    const Component = function () {
      return (
        <div>
          Hello {this.world}, from {this.country}
        </div>
      );
    };

    const subrouter = new Router();
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

    const router = new Router();
    router.use("/hello/:world", subrouter);
    mountRouter("body", router);

    const result = {};
    result.before = await router.go("/hello/Mike");
    result.after = await router.go("/hello/John/from/Mexico");

    expect(result).toEqual({
      before: "<div>Hello Mike, from USA</div>",
      after: "<div>Hello John, from Mexico</div>"
    });
  });

  it("Test with parent component", async () => {
    const Component = () => <div>Hello World</div>;
    // children are always the second argument
    const ParentComponent = (props, ...children) => (
      <html>
        <body>{children}</body>
      </html>
    );

    const router = new Router();
    router.add("/", () => Component);
    mountRouter("body", router);

    const result = await router.go("/", ParentComponent);

    expect(result).toEqual("<html><body><div>Hello World</div></body></html>");
  });

  it("Test show error when calling with a non url", async () => {
    const Component = () => <div>Hello World</div>;

    const router = new Router();
    router.add("/", () => Component);
    mountRouter("body", router);

    let err;
    try {
      await router.go(null);
    } catch (error) {
      err = error.message;
    }

    expect(err).toEqual("router.url.required");
  });

  it("Test show error when no component is returned", async () => {
    const router = new Router();
    router.add("/", () => {
      // Component is not returned
    });
    mountRouter("body", router);

    let err;
    try {
      await router.go("/");
    } catch (error) {
      err = error.message;
    }

    expect(err).toEqual("The URL / was not found in the router's registered paths.");
  });

  it("Test get routes", () => {
    const Component = () => "Hello world";
    const subrouter = new Router();
    subrouter.add("/from/:country", () => Component).add("/", () => Component);

    const router = new Router();
    router.use("/hello/:world", subrouter).add("/", () => Component);

    mountRouter("body", router);

    expect(router.routes()).toEqual(["/hello/:world/from/:country", "/hello/:world", "/"]);
  });

  it("Test the onClick handler for a single route", async () => {
    const Component = () => <div>Hello World</div>;
    const OtherComponent = () => <div>Hello Other World</div>;

    const router = new Router();
    router.add("/", () => Component);
    router.add("/other", () => OtherComponent);
    mountRouter("body", router);
    const result = {
      before: await router.go("/")
    };

    const handler = router.getOnClickHandler("/other");
    handler({ preventDefault: () => {}, button: 0 });

    await new Promise((resolve) => setTimeout(resolve, 10));

    result.after = update();

    expect(result).toEqual({
      before: "<div>Hello World</div>",
      after: "<div>Hello Other World</div>"
    });
  });

  it("Test the onClick handler for a route with params", async () => {
    const Component = ({ world }) => <div>Hello {world}</div>;
    const OtherComponent = () => <div>Hello Other World</div>;

    const router = new Router();
    router.add("/other", () => OtherComponent);
    router.add("/:world", (req) => <Component world={req.params.world} />);
    mountRouter("body", router);
    const result = {
      before: await router.go("/other")
    };

    const handler = router.getOnClickHandler("/Mike");
    handler({ preventDefault: () => {}, button: 0 });

    await new Promise((resolve) => setTimeout(resolve, 10));

    result.after = update();

    expect(result).toEqual({
      before: "<div>Hello Other World</div>",
      after: "<div>Hello Mike</div>"
    });
  });

  it("Test the onClick handler from a route with query params (?param=value) to another route with query params (?param=value)", async () => {
    const Component = ({ world }) => <div>Hello {world}</div>;

    const router = new Router();
    router.add("/world", (req) => <Component world={req.query.world} />);
    mountRouter("body", router);
    const result = {
      before: await router.go("/world?world=world")
    };

    const handler = router.getOnClickHandler("/world?world=Mike");
    handler({ preventDefault: () => {}, button: 0 });

    await new Promise((resolve) => setTimeout(resolve, 10));

    result.after = update();

    expect(result).toEqual({
      before: "<div>Hello world</div>",
      after: "<div>Hello Mike</div>"
    });
  });

  it("Test the onClick handler from a route with # to another route with #", async () => {
    const router = new Router();
    const Component = () => <div>Hello {router.url}</div>;

    router.add("/world", () => <Component />);
    mountRouter("body", router);
    const result = {
      before: await router.go("/world#world")
    };

    const handler = router.getOnClickHandler("/world#Mike");
    handler({ preventDefault: () => {}, button: 0 });

    await new Promise((resolve) => setTimeout(resolve, 10));

    result.after = update();

    expect(result).toEqual({
      before: "<div>Hello /world#world</div>",
      after: "<div>Hello /world#Mike</div>"
    });
  });

  it("Test the initial prefix", async () => {
    const subrouter = new Router();

    subrouter.add("/1", () => () => "1");
    subrouter.add("/2", () => () => "2");
    subrouter.use("/3", async (req) => {
      await req.redirect("/1");
      return false;
    });

    const router = new Router("/test");
    router.add("/", () => () => "home");
    router.add("/1", () => () => "1");
    router.add("/2", () => () => "2");
    router.use("/sub", subrouter);

    expect(router.pathPrefix).toEqual("/test");
    expect(router.routes()).toEqual(["/test", "/test/1", "/test/2", "/test/sub/1", "/test/sub/2"]);
    expect(router.url).toEqual("");
    expect(router.path).toEqual("");

    mountRouter("body", router);

    const res = await router.go("/");
    expect(res).toEqual("home");
    expect(router.pathPrefix).toEqual("/test");
    expect(router.path).toEqual("/");
    expect(router.url).toEqual("/test");

    const res2 = await router.go("/1");
    expect(res2).toEqual("1");
    expect(router.path).toEqual("/1");
    expect(router.url).toEqual("/test/1");

    const res3 = await router.go("/sub/2");
    expect(res3).toEqual("2");
    expect(router.path).toEqual("/sub/2");
    expect(router.url).toEqual("/test/sub/2");

    const res4 = await router.go("/sub/3");
    // Because is a redirect, res4 is undefined
    expect(res4).toBeUndefined();
    expect(router.path).toEqual("/1");
    expect(router.url).toEqual("/test/1");
  });
});
