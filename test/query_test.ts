import "valyrian.js/node";

import { describe, expect, test as it } from "bun:test";
import { QueryClient } from "valyrian.js/query";
import { wait } from "./utils/helpers";

describe("Query", () => {
  it("should cache fresh query responses", async () => {
    const client = new QueryClient({ staleTime: 10000 });
    let fetchCount = 0;

    const posts = client.query({
      key: ["posts"],
      fetcher: async () => {
        fetchCount += 1;
        return [{ id: 1 }];
      }
    });

    const first = await posts.fetch();
    const second = await posts.fetch();

    expect(first).toEqual([{ id: 1 }]);
    expect(second).toEqual([{ id: 1 }]);
    expect(fetchCount).toEqual(1);
  });

  it("should dedupe concurrent query fetches", async () => {
    const client = new QueryClient({ staleTime: 0 });
    let fetchCount = 0;

    const users = client.query({
      key: ["users"],
      fetcher: async () => {
        fetchCount += 1;
        await wait(15);
        return [{ id: 1, name: "A" }];
      }
    });

    const [a, b] = await Promise.all([users.fetch(), users.fetch()]);
    expect(a).toEqual(b);
    expect(fetchCount).toEqual(1);
  });

  it("should rehydrate persisted cache across client instances", async () => {
    const persistId = `query-persist-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let fetchCount = 0;

    const clientA = new QueryClient({
      staleTime: 10000,
      persist: true,
      persistId
    });

    const usersA = clientA.query({
      key: ["users", "persisted"],
      fetcher: async () => {
        fetchCount += 1;
        return [{ id: 1, name: "A" }];
      }
    });

    await usersA.fetch();
    expect(fetchCount).toEqual(1);

    const clientB = new QueryClient({
      staleTime: 10000,
      persist: true,
      persistId
    });

    const usersB = clientB.query({
      key: ["users", "persisted"],
      fetcher: async () => {
        fetchCount += 1;
        return [{ id: 1, name: "A" }];
      }
    });

    const data = await usersB.fetch();

    expect(data).toEqual([{ id: 1, name: "A" }]);
    expect(fetchCount).toEqual(1);

    localStorage.removeItem(persistId);
  });

  it("should invalidate by partial key", async () => {
    const client = new QueryClient({ staleTime: 10000 });
    let fetchCount = 0;

    const post = client.query({
      key: ["posts", 1],
      fetcher: async () => {
        fetchCount += 1;
        return { id: 1, version: fetchCount };
      }
    });

    await post.fetch();
    client.invalidate(["posts"]);
    const refreshed = await post.fetch();

    expect(fetchCount).toEqual(2);
    expect(refreshed).toEqual({ id: 1, version: 2 });
  });

  it("should execute mutations and update mutation state", async () => {
    const client = new QueryClient();
    let successResult: any = null;

    const save = client.mutation<{ name: string }, { id: number; name: string }>({
      execute: async (payload: any) => ({ id: 10, ...payload }),
      onSuccess(result: any) {
        successResult = result;
      }
    });

    const result = await save.execute({ name: "John" });
    expect(result).toEqual({ id: 10, name: "John" });
    expect(successResult).toEqual({ id: 10, name: "John" });
    expect(save.state.status).toEqual("success");
  });
});
