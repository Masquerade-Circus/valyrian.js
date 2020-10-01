import expect from "expect";
import "../lib";
import nodePlugin from "../plugins/node";
import requestPlugin from "../plugins/request";
v.usePlugin(nodePlugin);
v.usePlugin(requestPlugin);

describe("Request", () => {
  it("should get", async () => {
    let res = await v.request.get(
      "https://jsonplaceholder.typicode.com/posts/1"
    );
    expect(res).toEqual({
      userId: 1,
      id: 1,
      title:
        "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
      body:
        "quia et suscipit\n" +
        "suscipit recusandae consequuntur expedita et cum\n" +
        "reprehenderit molestiae ut ut quas totam\n" +
        "nostrum rerum est autem sunt rem eveniet architecto"
    });
  });

  it("should post", async () => {
    let res = await v.request.post(
      "https://jsonplaceholder.typicode.com/posts",
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
  });

  it("should put", async () => {
    let res = await v.request.put(
      "https://jsonplaceholder.typicode.com/posts/1",
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
  });

  it("should patch", async () => {
    let res = await v.request.patch(
      "https://jsonplaceholder.typicode.com/posts/1",
      {
        body: "bar"
      },
      {
        headers: {
          "Content-Type": "application/json; charset=UTF-8"
        }
      }
    );
    expect(res).toEqual(
      {
        userId: 1,
        id: 1,
        title:
          "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
        body: "bar"
      },
      {
        headers: {
          "Content-Type": "application/json; charset=UTF-8"
        }
      }
    );
  });

  it("should delete", async () => {
    let res = await v.request.delete(
      "https://jsonplaceholder.typicode.com/posts/1"
    );
    expect(res).toEqual({});
  });

  it("should serialize data", async () => {
    let res = await v.request.get(
      "https://jsonplaceholder.typicode.com/posts/",
      {
        userId: 1
      }
    );
    expect(res).toEqual(expect.any(Array));
    expect(res.length).toEqual(10);
  });

  it("should resolve with full response", async () => {
    let res = await v.request.get(
      "https://jsonplaceholder.typicode.com/posts/1",
      null,
      { resolveWithFullResponse: true }
    );
    expect(res).toEqual(
      expect.objectContaining({
        body: expect.any(Object),
        url: "https://jsonplaceholder.typicode.com/posts/1",
        status: 200,
        statusText: "OK",
        headers: expect.any(Object)
      })
    );
  });
});
