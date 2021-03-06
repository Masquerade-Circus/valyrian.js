import "../lib";

import expect from "expect";
import fastify from "fastify";
import nodePlugin from "../plugins/node";
import requestPlugin from "../plugins/request";
v.usePlugin(nodePlugin);
v.usePlugin(requestPlugin);

let posts = [];
for (let i = 10; i--; ) {
  posts.push({
    userId: 1,
    id: i,
    title: "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
    body:
      "quia et suscipit\n" +
      "suscipit recusandae consequuntur expedita et cum\n" +
      "reprehenderit molestiae ut ut quas totam\n" +
      "nostrum rerum est autem sunt rem eveniet architecto"
  });
}

let createServer = async () => {
  let server = fastify();
  server
    .get("/posts", (req, res) => res.send(JSON.stringify(posts)))
    .get("/posts/:id", (req, res) => {
      let post = posts[0];
      post.id = parseInt(req.params.id, 10);
      res.send(JSON.stringify(post));
    })
    .post("/posts", (req, res) => {
      let post = req.body;
      post.id = 101;
      res.send(JSON.stringify(post));
    })
    .put("/posts/:id", (req, res) => res.send(JSON.stringify(req.body)))
    .patch("/posts/:id", (req, res) =>
      res.send(
        JSON.stringify({
          ...posts[0],
          ...req.body
        })
      )
    )
    .delete("/posts/:id", (req, res) => res.send(JSON.stringify({})))
    .get("/hello", (req, res) => res.send("Hello world"));

  server.baseUrl = await server.listen();

  return server;
};

describe("Request", () => {
  it("should get", async () => {
    let server = await createServer();
    let res = await v.request.get(`${server.baseUrl}/posts/1`);
    expect(res).toEqual({
      userId: 1,
      id: 1,
      title: "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
      body:
        "quia et suscipit\n" +
        "suscipit recusandae consequuntur expedita et cum\n" +
        "reprehenderit molestiae ut ut quas totam\n" +
        "nostrum rerum est autem sunt rem eveniet architecto"
    });
    await server.close();
  });

  it("should post", async () => {
    let server = await createServer();
    let res = await v.request.post(
      `${server.baseUrl}/posts`,
      {
        title: "foo",
        body: "bar",
        userId: 1
      },
      {
        headers: {
          "Content-Type": "application/json; charset=UTF-8"
        }
      }
    );
    expect(res).toEqual({
      userId: 1,
      id: 101,
      title: "foo",
      body: "bar"
    });
    await server.close();
  });

  it("should put", async () => {
    let server = await createServer();
    let res = await v.request.put(
      `${server.baseUrl}/posts/1`,
      {
        id: 1,
        title: "foo",
        body: "bar",
        userId: 1
      },
      {
        headers: {
          "Content-Type": "application/json; charset=UTF-8"
        }
      }
    );

    expect(res).toEqual({
      userId: 1,
      id: 1,
      title: "foo",
      body: "bar"
    });
    await server.close();
  });

  it("should patch", async () => {
    let server = await createServer();
    let res = await v.request.patch(
      `${server.baseUrl}/posts/1`,
      {
        body: "bar"
      },
      {
        headers: {
          "Content-Type": "application/json; charset=UTF-8"
        }
      }
    );
    expect(res).toEqual({
      userId: 1,
      id: 1,
      title: "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
      body: "bar"
    });
    await server.close();
  });

  it("should delete", async () => {
    let server = await createServer();
    let res = await v.request.delete(`${server.baseUrl}/posts/1`);
    expect(res).toEqual({});
    await server.close();
  });

  it("should serialize data", async () => {
    let server = await createServer();
    let res = await v.request.get(`${server.baseUrl}/posts/`, {
      userId: 1
    });
    expect(res).toEqual(expect.any(Array));
    expect(res.length).toEqual(10);
    await server.close();
  });

  it("should resolve with full response", async () => {
    let server = await createServer();
    let res = await v.request.get(`${server.baseUrl}/posts/1`, null, { resolveWithFullResponse: true });
    expect(res).toEqual(
      expect.objectContaining({
        body: expect.any(Object),
        url: `${server.baseUrl}/posts/1`,
        status: 200,
        statusText: "OK",
        headers: expect.any(Object)
      })
    );
    await server.close();
  });

  it("should create a scoped request", async () => {
    let server = await createServer();
    let request = v.request.new(`${server.baseUrl}`);
    let res = await request.get("/posts", {
      userId: 1
    });
    expect(res).toEqual(expect.any(Array));
    expect(res.length).toEqual(10);
    await server.close();
  });

  it("should create a scoped request with allowed methods", async () => {
    let server = await createServer();
    let request = v.request.new(`${server.baseUrl}`, { methods: ["get"] });
    let res = await request.get("/posts", {
      userId: 1
    });
    expect(res).toEqual(expect.any(Array));
    expect(res.length).toEqual(10);

    expect(request.post).toBeUndefined();
    await server.close();
  });

  it("should create a child scoped request", async () => {
    let server = await createServer();
    let request = v.request.new(`${server.baseUrl}/`);
    let requestChild = request.new("/posts");
    let res = await requestChild.get("/", {
      userId: 1
    });
    expect(res).toEqual(expect.any(Array));
    expect(res.length).toEqual(10);
    await server.close();
  });

  it("should create a child scoped request with allowed methods", async () => {
    let server = await createServer();
    let request = v.request.new(`${server.baseUrl}/`, { methods: ["get"] });
    let requestChild = request.new("/posts");
    let res = await requestChild.get("/", {
      userId: 1
    });
    expect(res).toEqual(expect.any(Array));
    expect(res.length).toEqual(10);

    expect(requestChild.post).toBeUndefined();
    await server.close();
  });

  it("should work with server side rendering of local requests", async () => {
    let server = await createServer();
    v.request.options("urls.node", `${server.baseUrl}`);

    let res = await v.request.get("/hello", null, { headers: { Accept: "text/html" } });

    expect(res).toEqual("Hello world");

    await server.close();
  });

  it("should work with server side rendering of api requests", async () => {
    let server = await createServer();
    v.request.options("urls.node", `${server.baseUrl}`);
    v.request.options("urls.api", "http://example.com/api");

    let res = await v.request.get("http://example.com/api/hello", null, { headers: { Accept: "text/html" } });

    expect(res).toEqual("Hello world");

    await server.close();
  });

  it("should work with server side rendering of local requests with scoped request", async () => {
    let server = await createServer();
    let request = v.request.new("/", {
      urls: {
        node: `${server.baseUrl}`
      }
    });

    let res = await request.get("/hello", null, { headers: { Accept: "text/html" } });

    expect(res).toEqual("Hello world");

    await server.close();
  });

  it("should work with server side rendering of api requests with scoped request", async () => {
    let server = await createServer();
    let request = v.request.new("/", {
      urls: {
        node: `${server.baseUrl}`,
        api: "http://example.com/api"
      }
    });

    let res = await request.get("http://example.com/api/hello", null, { headers: { Accept: "text/html" } });

    expect(res).toEqual("Hello world");

    await server.close();
  });

  it("should work with server side rendering of local requests with child scoped request", async () => {
    let server = await createServer();
    let request = v.request.new("/", {
      urls: {
        node: `${server.baseUrl}`
      },
      methods: ["get"]
    });

    let childRequest = request.new("/hello");

    let res = await childRequest.get("/", null, { headers: { Accept: "text/html" } });

    expect(res).toEqual("Hello world");

    expect(childRequest.post).toBeUndefined();

    await server.close();
  });

  it("should work with server side rendering of api requests with child scoped request", async () => {
    let server = await createServer();
    let request = v.request.new("/", {
      urls: {
        node: `${server.baseUrl}`,
        api: "http://example.com/api"
      },
      methods: ["get"]
    });

    let childRequest = request.new("http://example.com/api/hello");

    let res = await childRequest.get("/", null, { headers: { Accept: "text/html" } });

    expect(res).toEqual("Hello world");

    expect(childRequest.post).toBeUndefined();

    await server.close();
  });
});
