# 4.2.4. Query Cache (`valyrian.js/query`)

`QueryClient` provides cached queries, mutations, invalidation, and optional persistence.

## Quick Start

```ts
import { QueryClient } from "valyrian.js/query";

const client = new QueryClient({
  staleTime: 30000,
  cacheTime: 300000,
  persist: true,
  persistId: "my-cache"
});

const posts = client.query({
  key: ["posts", { page: 1 }],
  fetcher: () => request.get("/api/posts", { page: 1 })
});

await posts.fetch();
```

## Query Handles

`client.query(config)` returns `QueryHandle`:

* `key`
* `state`
* `data`
* `fetch()`
* `invalidate()`

Fetch behavior:

* fresh successful data returns immediately
* stale data triggers fetch
* in-flight fetch is deduped per key

`invalidate()` marks that query stale (`updatedAt = 0`), then the next `fetch()` refetches.

## Mutation Handles

`client.mutation(config)` returns `MutationHandle`:

* `state`
* `execute(payload)`
* `reset()`

`reset()` returns mutation state to `idle` and clears previous result/error.

```ts
const savePost = client.mutation({
  execute: (payload) => request.post("/api/posts", payload),
  onSuccess: () => client.invalidate(["posts"])
});

await savePost.execute({ title: "New post" });
```

## Invalidation and Cache Control

* `invalidate(partialKey)` uses prefix matching.
* `clear()` removes all entries and gc timers.

Prefix matching example:

* invalidating `["posts"]` affects `["posts", 1]` and `["posts", { page: 2 }]`.

## Persistence and Rehydration

With `persist: true`, cache state is saved to `native-store` local storage.

On startup, persisted entries are normalized:

* `loading` states are rehydrated as `idle`
* previous `success/error/data/updatedAt` are restored when valid

Persistence is opt-in (`persist: true`).

## Change Events

Subscribe with:

```ts
const listener = (event) => {
  console.log(event.type, event.key, event.state);
};

const off = client.on("change", listener);

// later
off();

// equivalent explicit cleanup
client.off("change", listener);
```

Common event types include:

* `query:start`
* `query:success`
* `query:error`
* `query:invalidate`
* `mutation:start`
* `mutation:success`
* `mutation:error`
* `cache:clear`
* `gc`

`QueryChangeEvent` may include `key`, `state`, and `payload` depending on event type.
