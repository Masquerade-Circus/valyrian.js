import "valyrian.js/node";

import { expect, describe, test as it } from "bun:test";
import { request as exportedRequest } from "valyrian.js/request";
import fastify from "fastify";

const posts: any = [];
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

const createServer = async () => {
  const server = fastify();
  server
    .get("/posts", (req, res) => res.send(JSON.stringify(posts)))
    .get("/posts/:id", (req, res) => {
      const post = posts[0];
      post.id = Number((req.params as any).id);
      res.send(JSON.stringify(post));
    })
    .post("/posts", (req, res) => {
      const post: any = req.body;
      post.id = 101;
      res.send(JSON.stringify(post));
    })
    .put("/posts/:id", (req, res) => res.send(JSON.stringify(req.body)))
    .patch("/posts/:id", (req, res) =>
      res.send(
        JSON.stringify({
          ...posts[0],
          ...(req.body as any)
        })
      )
    )
    .delete("/posts/:id", (req, res) => res.send(JSON.stringify({})))
    .get("/hello", (req, res) => res.send("Hello world"));

  (server as any).baseUrl = await server.listen();

  return server;
};

describe("Request", () => {
  const tests = [
    {
      name: 'Exported request `import request from "valyrian.js/request"`',
      request: exportedRequest
    }
  ];

  for (const test of tests) {
    describe(test.name, () => {
      const request = test.request;
      it("should get", async () => {
        const server = await createServer();
        const res = await request.get(`${(server as any).baseUrl}/posts/1`);
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
        const server = await createServer();
        const res = await request.post(
          `${(server as any).baseUrl}/posts`,
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
        const server = await createServer();
        const res = await request.put(
          `${(server as any).baseUrl}/posts/1`,
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
        const server = await createServer();
        const res = await request.patch(
          `${(server as any).baseUrl}/posts/1`,
          {
            body: "bar"
          },
          {
            headers: {
              "Content-Type": "application/json"
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
        const server = await createServer();
        const res = await request.delete(`${(server as any).baseUrl}/posts/1`);
        expect(res).toEqual({});
        await server.close();
      });

      it("should serialize data", async () => {
        const server = await createServer();
        const res = await request.get(`${(server as any).baseUrl}/posts/`, {
          userId: 1
        });

        expect(res).toEqual(expect.any(Array));
        expect(res.length).toEqual(10);
        await server.close();
      });

      it("should resolve with full response", async () => {
        const server = await createServer();
        const res = await request.get(`${(server as any).baseUrl}/posts/1`, null, { resolveWithFullResponse: true });
        expect(res).toEqual(
          expect.objectContaining({
            body: expect.any(Object),
            url: `${(server as any).baseUrl}/posts/1`,
            status: 200,
            statusText: "OK",
            headers: expect.any(Object)
          })
        );
        await server.close();
      });

      it("should create a scoped request", async () => {
        const server = await createServer();
        const request2 = request.new(`${(server as any).baseUrl}`);
        const res = await request2.get("/posts", {
          userId: 1
        });
        expect(res).toEqual(expect.any(Array));
        expect(res.length).toEqual(10);
        await server.close();
      });

      it("should create a scoped request with allowed methods", async () => {
        const server = await createServer();
        const request2 = request.new(`${(server as any).baseUrl}`, { allowedMethods: ["get"] });
        const res = await request2.get("/posts", {
          userId: 1
        });
        expect(res).toEqual(expect.any(Array));
        expect(res.length).toEqual(10);

        expect(request2.post).toBeUndefined();
        await server.close();
      });

      it("should create a child scoped request", async () => {
        const server = await createServer();
        const request2 = request.new(`${(server as any).baseUrl}/`);
        const requestChild = request2.new("/posts");
        const res = await requestChild.get("/", {
          userId: 1
        });
        expect(res).toEqual(expect.any(Array));
        expect(res.length).toEqual(10);
        await server.close();
      });

      it("should create a child scoped request with allowed methods", async () => {
        const server = await createServer();
        const request2 = request.new(`${(server as any).baseUrl}/`, { allowedMethods: ["get"] });
        const requestChild = request2.new("/posts");
        const res = await requestChild.get("/", {
          userId: 1
        });
        expect(res).toEqual(expect.any(Array));
        expect(res.length).toEqual(10);

        expect(requestChild.post).toBeUndefined();
        await server.close();
      });

      it("should work with server side rendering of local requests", async () => {
        const server = await createServer();
        request.setOption("urls.node", `${(server as any).baseUrl}`);

        const res = await request.get("/hello", null, { headers: { Accept: "text/html" } });

        expect(res).toEqual("Hello world");

        await server.close();
      });

      it("should work with server side rendering of api requests", async () => {
        const server = await createServer();
        request.setOption("urls.node", `${(server as any).baseUrl}`);
        request.setOption("urls.api", "http://example.com/api");

        const res = await request.get("http://example.com/api/hello", null, { headers: { Accept: "text/html" } });

        expect(res).toEqual("Hello world");

        await server.close();
      });

      it("should work with server side rendering of local requests with scoped request", async () => {
        const server = await createServer();
        const request2 = request.new("/", {
          urls: {
            node: `${(server as any).baseUrl}`
          }
        });

        const res = await request2.get("/hello", null, { headers: { Accept: "text/html" } });

        expect(res).toEqual("Hello world");

        await server.close();
      });

      it("should work with server side rendering of api requests with scoped request", async () => {
        const server = await createServer();
        const request2 = request.new("/", {
          urls: {
            node: `${(server as any).baseUrl}`,
            api: "http://example.com/api"
          }
        });

        const res = await request2.get("http://example.com/api/hello", null, { headers: { Accept: "text/html" } });

        expect(res).toEqual("Hello world");

        await server.close();
      });

      it("should work with server side rendering of local requests with child scoped request", async () => {
        const server = await createServer();
        const request2 = request.new("/", {
          urls: {
            node: `${(server as any).baseUrl}`
          },
          allowedMethods: ["get"]
        });

        const childRequest = request2.new("/hello");

        const res = await childRequest.get("/", null, { headers: { Accept: "text/html" } });

        expect(res).toEqual("Hello world");

        expect(childRequest.post).toBeUndefined();

        await server.close();
      });

      it("should work with server side rendering of api requests with child scoped request", async () => {
        const server = await createServer();
        const request2 = request.new("/", {
          urls: {
            node: `${(server as any).baseUrl}`,
            api: "http://example.com/api"
          },
          allowedMethods: ["get"]
        });

        const childRequest = request2.new("http://example.com/api/hello");

        const res = await childRequest.get("/", null, { headers: { Accept: "text/html" } });

        expect(res).toEqual("Hello world");

        expect(childRequest.post).toBeUndefined();

        await server.close();
      });
    });
  }
});
