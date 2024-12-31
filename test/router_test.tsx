import "valyrian.js/node";

/* eslint-disable no-console */
import { Request, Router, mountRouter } from "valyrian.js/router";
import { Children, Properties, update, v } from "valyrian.js";

import { expect, describe, test as it } from "bun:test";

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
      .add("/hello/.*", [() => console.log("Hello 5"), () => Component])
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
      .add("/hello/.*", [() => console.log("Hello 5"), () => Component])
      .add(
        "/:hello/world",
        () => console.log("Hello 6"),
        [() => console.log("Hello 6")],
        () => Component
      )
      .add("/hello/:world", [() => console.log("Hello 7"), () => Component], () => console.log("Hello 7"))
      .catch(() => () => "Not ok");

    router.add("/ok", subrouter);
    router.catch(() => () => "Not found");

    mountRouter("body", router);
    // The /:hello route is setted before the /ok subrouter,
    // so it should enter in the /:hello route
    // instead of the /ok subrouter
    expect(await router.go("/ok/not/found/url?hello=world")).toEqual("Not found");
    expect(await router.go("/not/found/url?hello=world")).toEqual("Not found");
    expect(await router.go("/hello/world")).toEqual("<div>Hello world</div>");
  });

  it("Mount and update with POJO component", async () => {
    const Component = {
      world: "World",
      id: "example",
      view() {
        return <div id={this.id}>Hello {this.world}</div>;
      }
    };

    const result: any = {};
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
    function Component(this: any) {
      return <div id={this.id}>Hello {this.world}</div>;
    }

    Component.world = "World";
    Component.id = "example";

    const result: any = {};
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
    const SubComponent = (props: Properties) => <div id={props.id}>Hello {props.world}</div>;
    const state = {
      world: "World",
      id: "example"
    };
    const Component = function () {
      return <SubComponent {...state} />;
    };

    const result: any = {};
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
    const Component = (props: Properties) => <div id={props.id}>Hello {props.world}</div>;
    const props = {
      world: "World",
      id: "example"
    };

    const result: any = {};
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
    router.add(() => NotFound);

    mountRouter("body", router);

    const result: any = {};
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
    const Hello = function (this: any) {
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

    const result: any = {};
    result.before = await router.go("/hello");
    result.after = await router.go("/hello/Mike/whats/new");

    expect(result).toEqual({
      before: "<div>Hello world, what's up</div>",
      after: "<div>Hello Mike, what's new</div>"
    });
  });

  it("Test mix single and array of middlewares", async () => {
    const Hello = () => <div>Hello World</div>;
    const middlewares: any = [];

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
    const Component = function (this: any) {
      return (
        <div>
          Hello {this.world}, from {this.country}
        </div>
      );
    };
    Component.world = "";
    Component.country = "";

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
    router.add("/hello/:world", subrouter);
    mountRouter("body", router);

    const result: any = {};
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
    const ParentComponent = (props: Properties, ...children: Children) => (
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
      await router.go(null as unknown as string);
    } catch (error: any) {
      err = error.message;
    }

    expect(err).toEqual("The URL is empty.");
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
    } catch (error: any) {
      err = error.message;
    }

    expect(err).toEqual("The URL / did not return a valid component.");
  });

  it("Test get routes", () => {
    const Component = () => "Hello world";
    const subrouter = new Router();
    subrouter.add("/from/:country", () => Component).add("/", () => Component);

    const router = new Router();
    router.add("/hello/:world", subrouter).add("/", () => Component);

    mountRouter("body", router);

    expect(router.routes()).toEqual(["/hello/:world", "/hello/:world/from/:country", "/"]);
  });

  it("Test the onClick handler for a single route", async () => {
    const Component = () => <div>Hello World</div>;
    const OtherComponent = () => <div>Hello Other World</div>;

    const router = new Router();
    router.add("/", () => Component);
    router.add("/other", () => OtherComponent);
    mountRouter("body", router);
    const result = {
      before: await router.go("/"),
      after: ""
    };

    const handler = router.getOnClickHandler("/other");
    handler({ preventDefault: () => {}, button: 0 } as MouseEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    result.after = update();

    expect(result).toEqual({
      before: "<div>Hello World</div>",
      after: "<div>Hello Other World</div>"
    });
  });

  it("Test the onClick handler for a route with params", async () => {
    const Component = ({ world }: Properties) => <div>Hello {world}</div>;
    const OtherComponent = () => <div>Hello Other World</div>;

    const router = new Router();
    router.add("/other", () => OtherComponent);
    router.add("/:world", (req) => <Component world={req.params.world} />);
    mountRouter("body", router);
    const result = {
      before: await router.go("/other"),
      after: ""
    };

    const handler = router.getOnClickHandler("/Mike");
    handler({ preventDefault: () => {}, button: 0 } as MouseEvent);

    await new Promise((resolve) => setTimeout(resolve, 10));

    result.after = update();

    expect(result).toEqual({
      before: "<div>Hello Other World</div>",
      after: "<div>Hello Mike</div>"
    });
  });

  it("Test the onClick handler from a route with query params (?param=value) to another route with query params (?param=value)", async () => {
    const Component = ({ world }: Properties) => <div>Hello {world}</div>;

    const router = new Router();
    router.add("/world", (req) => <Component world={req.query.world} />);
    mountRouter("body", router);
    const result = {
      before: await router.go("/world?world=world"),
      after: ""
    };

    const handler = router.getOnClickHandler("/world?world=Mike");
    handler({ preventDefault: () => {}, button: 0 } as MouseEvent);

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
      before: await router.go("/world#world"),
      after: ""
    };

    const handler = router.getOnClickHandler("/world#Mike");
    handler({ preventDefault: () => {}, button: 0 } as MouseEvent);

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
    subrouter.add("/3", async (req) => {
      await req.redirect("/1");
      return false;
    });

    const router = new Router("/test");
    router.add("/", () => () => "home");
    router.add("/1", () => () => "1");
    router.add("/2", () => () => "2");
    router.add("/sub", subrouter);

    expect(router.pathPrefix).toEqual("/test");
    expect(router.routes()).toEqual(["/test", "/test/1", "/test/2", "/test/sub/1", "/test/sub/2", "/test/sub/3"]);
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

  it("Test interruption of middleware chain", async () => {
    const middlewareLog: any = [];
    const router = new Router();
    router.add(
      "/",
      () => middlewareLog.push("Middleware 1"),
      () => false, // Interrumpir la cadena
      () => middlewareLog.push("Middleware 2")
    );
    mountRouter("body", router);

    await router.go("/");

    expect(middlewareLog).toEqual(["Middleware 1"]); // Middleware 2 no se ejecuta
  });

  it("Test redirect within middleware", async () => {
    const dom = document.createElement("div");
    const Component = () => <div>Final Route</div>;
    const router = new Router();
    router.add("/start", (req) => {
      return req.redirect("/final");
    });
    router.add("/final", () => Component);
    mountRouter(dom, router);

    const result = await router.go("/start");

    expect(result).toEqual("<div>Final Route</div>");
    expect(dom.innerHTML).toEqual("<div>Final Route</div>");
  });

  it("Test nested subrouters", async () => {
    const SubSubRouter = new Router();
    SubSubRouter.add("/deep", () => "Deep route");

    const SubRouter = new Router();
    SubRouter.add("/sub", SubSubRouter);

    const router = new Router();
    router.add("/main", SubRouter);

    mountRouter("body", router);

    const result = await router.go("/main/sub/deep");

    expect(result).toEqual("Deep route");
  });

  it("Should throw an error for malformed URL", async () => {
    const router = new Router();
    router.add("/", () => "Home");

    let errorMessage;
    try {
      await router.go("/%%%");
    } catch (error: any) {
      errorMessage = error.message;
    }

    expect(errorMessage).toEqual("The URL /%%% is malformed.");
  });

  it("Should go to the error handler when a route throws an error", async () => {
    const router = new Router();
    router.add("/", () => {
      throw new Error("Some error");
    });
    router.catch((req: Request, e: Error) => () => <div>Error handler: {e.message}</div>);

    mountRouter("body", router);

    const result = await router.go("/");

    expect(result).toEqual("<div>Error handler: Some error</div>");
  });

  it("Test multiple dynamic parameters", async () => {
    const Component = ({ userId, postId }: Properties) => (
      <div>
        User {userId} Post {postId}
      </div>
    );

    const router = new Router();
    router.add("/user/:userId/posts/:postId", (req) => (
      <Component userId={req.params.userId} postId={req.params.postId} />
    ));
    mountRouter("body", router);

    const result = await router.go("/user/123/posts/456");
    expect(result).toEqual("<div>User 123 Post 456</div>");
  });

  it("Test route conflict between static and dynamic segments", async () => {
    const StaticComponent = () => <div>Static Route</div>;
    const DynamicComponent = ({ id }: Properties) => <div>Dynamic Route {id}</div>;

    const router = new Router();
    router.add("/user", () => StaticComponent);
    router.add("/user/:id", (req) => <DynamicComponent id={req.params.id} />);
    mountRouter("body", router);

    const staticResult = await router.go("/user");
    const dynamicResult = await router.go("/user/123");

    expect(staticResult).toEqual("<div>Static Route</div>");
    expect(dynamicResult).toEqual("<div>Dynamic Route 123</div>");
  });

  it("Test prefixed wildcard route and dynamic route", async () => {
    const WildcardComponent = () => <div>Wildcard Route</div>;
    const DynamicComponent = ({ hello }: Properties) => <div>Dynamic Route {hello}</div>;

    const router = new Router();
    router.add("/hello/.*", () => WildcardComponent);
    router.add("/:hello", (req) => <DynamicComponent hello={req.params.hello} />);
    mountRouter("body", router);

    const wildcardResult = await router.go("/hello/anything");
    const dynamicResult = await router.go("/hi");

    expect(wildcardResult).toEqual("<div>Wildcard Route</div>");
    expect(dynamicResult).toEqual("<div>Dynamic Route hi</div>");
  });

  it("Test multiple subrouters mounted under the same prefix", async () => {
    const SubComponent1 = () => <div>Sub Route 1</div>;
    const SubComponent2 = () => <div>Sub Route 2</div>;

    const subrouter1 = new Router();
    subrouter1.add("/", () => SubComponent1);

    const subrouter2 = new Router();
    subrouter2.add("/", () => SubComponent2);

    const router = new Router();
    router.add("/sub1", subrouter1);
    router.add("/sub2", subrouter2);
    mountRouter("body", router);

    const sub1Result = await router.go("/sub1");
    const sub2Result = await router.go("/sub2");

    expect(sub1Result).toEqual("<div>Sub Route 1</div>");
    expect(sub2Result).toEqual("<div>Sub Route 2</div>");
  });

  it("Test middleware order: global vs local", async () => {
    const middlewareLog: any = [];

    const router = new Router();
    router.add(() => middlewareLog.push("Global Middleware")); // Global middleware
    router.add("/", () => middlewareLog.push("Local Middleware")); // Local middleware

    mountRouter("body", router);

    await router.go("/");
    expect(middlewareLog).toEqual(["Global Middleware", "Local Middleware"]);
  });

  it("Test invalid routes do not corrupt the route tree", async () => {
    const Component = () => <div>Valid Route</div>;

    const router = new Router();
    router.add("/valid", () => Component);

    // Simulate adding an invalid route
    try {
      router.add(null as unknown as string, () => Component);
    } catch (error: any) {
      // Expect it to throw
    }

    mountRouter("body", router);

    const result = await router.go("/valid");
    expect(result).toEqual("<div>Valid Route</div>");
  });

  it("Test multiple wildcards in different levels of the route tree", async () => {
    const Component1 = () => <div>Wildcard Level 1</div>;
    const Component2 = () => <div>Wildcard Level 2</div>;

    const router = new Router();
    router.add("/level1/.*", () => Component1);
    router.add("/level2/.*", () => Component2);

    mountRouter("body", router);

    const result1 = await router.go("/level1/something");
    const result2 = await router.go("/level2/else");

    expect(result1).toEqual("<div>Wildcard Level 1</div>");
    expect(result2).toEqual("<div>Wildcard Level 2</div>");
  });

  it("Test middleware returning null or undefined does not break the chain", async () => {
    const middlewareLog: any = [];

    const router = new Router();
    router.add(
      "/",
      () => middlewareLog.push("Middleware 1"),
      () => null, // Should not break the chain
      () => middlewareLog.push("Middleware 2")
    );
    mountRouter("body", router);

    await router.go("/");

    expect(middlewareLog).toEqual(["Middleware 1", "Middleware 2"]);
  });

  it("Test multiple redirections within middleware chain", async () => {
    const FinalComponent = () => <div>Final Route</div>;

    const router = new Router();
    router.add("/start", (req) => req.redirect("/intermediate"));
    router.add("/intermediate", (req) => req.redirect("/final"));
    router.add("/final", () => FinalComponent);

    mountRouter("body", router);

    const result = await router.go("/start");
    expect(result).toEqual("<div>Final Route</div>");
  });

  it("Test query parameters in redirection are preserved", async () => {
    const Component = ({ world }: Properties) => <div>Hello {world}</div>;

    const router = new Router();
    router.add("/redirect", (req) => req.redirect(`/world?world=${req.query.world}`));
    router.add("/world", (req) => <Component world={req.query.world} />);

    mountRouter("body", router);

    const result = await router.go("/redirect?world=Mars");
    expect(result).toEqual("<div>Hello Mars</div>");
  });

  it("Test onClick handler with ctrl key (should prevent navigation)", async () => {
    const Component = () => <div>Hello World</div>;

    const router = new Router();
    router.add("/", () => Component);

    mountRouter("body", router);

    const handler = router.getOnClickHandler("/");
    const mockEvent = { preventDefault: () => {}, button: 0, ctrlKey: true } as MouseEvent; // Simulating Ctrl+Click

    handler(mockEvent);

    const result = await router.go("/");
    expect(result).toEqual("<div>Hello World</div>"); // Navigation should not happen
  });

  it("Test handling multiple redirects in middlewares", async () => {
    const Component = () => <div>Final Destination</div>;

    const router = new Router();
    router.add("/first", (req) => req.redirect("/second"));
    router.add("/second", (req) => req.redirect("/third"));
    router.add("/third", () => Component);

    mountRouter("body", router);

    const result = await router.go("/first");
    expect(result).toEqual("<div>Final Destination</div>");
  });

  it("Performance test: 1000 routes with 1000 subroutes with :${[a-z]} param", async () => {
    const Component = () => <div>Hello World</div>;

    console.time("Routes creation");
    const router = new Router();
    for (let i = 0; i < 1000; i++) {
      const subrouter = new Router();
      for (let j = 0; j < 1000; j++) {
        subrouter.add(`/:${String.fromCharCode(97 + j)}`, () => Component);
      }
      router.add(`/${i}`, subrouter);
    }
    console.timeEnd("Routes creation");
    mountRouter("body", router);

    console.time("Routes navigation");
    for (let i = 0; i < 1000; i++) {
      await router.go(`/${i}/${String.fromCharCode(97 + 1)}`);
    }
    console.timeEnd("Routes navigation");
  });

  it("Test conflict between dynamic and wildcard routes on multiple levels", async () => {
    const DynamicComponent = ({ param }: Properties) => <div>Dynamic Route {param}</div>;
    const WildcardComponent = ({ url, found }: Properties) => (
      <div>
        Wildcard Route {url} {"->"} {found}
      </div>
    );

    const router = new Router();
    router.add("/level/:param", (req) => <DynamicComponent param={req.params.param} />);
    router.add("/level/.*", ({ url }) => <WildcardComponent url={url} found="/level/.*" />);
    router.add("/.*", ({ url }) => <WildcardComponent url={url} found="/.*" />);
    router.catch(() => () => "Not found");

    mountRouter("body", router);

    const dynamicResult = await router.go("/level/123");
    const wildcardResult = await router.go("/level/some/random/path");

    expect(dynamicResult).toEqual("<div>Dynamic Route 123</div>");
    expect(wildcardResult).toEqual("<div>Wildcard Route /level/some/random/path -> /level/.*</div>");

    const router2 = new Router();
    router2.add("/level/123", () => <DynamicComponent param="123" />);
    router2.add("/level/.*", ({ url }) => <WildcardComponent url={url} found="/level/.*" />);
    router2.add("/.*", ({ url }) => <WildcardComponent url={url} found="/.*" />);
    router2.catch(() => () => "Not found");

    mountRouter("body", router2);

    const dynamicResult2 = await router2.go("/level/123");
    const wildcardResult2 = await router2.go("/level/some/random/path");

    expect(dynamicResult2).toEqual("<div>Dynamic Route 123</div>");
    expect(wildcardResult2).toEqual("<div>Wildcard Route /level/some/random/path -> /level/.*</div>");
  });

  it("Parent middlewares must be executed before child middlewares", async () => {
    const logs: any = [];

    const Component = () => <div>Hello World</div>;
    const subrouter = new Router();
    subrouter.add(() => logs.push("Child middleware"));
    subrouter.add("/", () => Component);

    const router = new Router();
    router.add(() => logs.push("Parent middleware"));
    router.add("/child", subrouter);

    mountRouter("body", router);

    await router.go("/child");

    expect(logs).toEqual(["Parent middleware", "Child middleware"]);
  });

  it("Error handlers", async () => {
    const router = new Router();

    router
      .add("/", async () => () => <div>Home</div>)
      .add("/about", async () => () => <div>About</div>)
      .add("/error", async () => {
        throw new TypeError("Simulated TypeError");
      })
      .add("/simulated", async () => {
        throw new Error("Simulated Error");
      });

    // Error handlers
    router
      .catch(404, (req: any, error: Error) => () => <div>404 Not Found: {error.message}</div>)
      .catch(TypeError, (req: any, error: Error) => () => <div>Type Error: {error.message}</div>)
      .catch((req: any, error: Error) => () => <div>Generic Error: {error.message}</div>);

    mountRouter("body", router);

    const notFoundError = await router.go("/nonexistent"); // 404 Not Found
    const typeError = await router.go("/error"); // TypeError
    const genericError = await router.go("/simulated"); // Generic console.error(

    expect(notFoundError).toEqual(
      "<div>404 Not Found: The URL /nonexistent was not found in the router's registered paths.</div>"
    );
    expect(typeError).toEqual("<div>Type Error: Simulated TypeError</div>");
    expect(genericError).toEqual("<div>Generic Error: Simulated Error</div>");
  });
});
