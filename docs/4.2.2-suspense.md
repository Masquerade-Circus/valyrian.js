# 4.2.2. Suspense (`valyrian.js/suspense`)

`Suspense` handles async child resolution with deterministic fallback/error rendering.

## Quick Start

```tsx
import { Suspense } from "valyrian.js/suspense";

const UserList = async () => {
  const users = await request.get("/api/users");
  return <ul>{users.map((u) => <li>{u.name}</li>)}</ul>;
};

const App = () => (
  <Suspense key="users" fallback={<p>Loading users...</p>} error={(e) => <p>{e.message}</p>}>
    <UserList />
  </Suspense>
);
```

## Required Props

* `key` is required.
* `fallback` is rendered while async children are pending.
* `error` is optional. If omitted, Suspense renders `error.message`.

Use a stable `key` for stable data. Change the `key` when you intentionally want a fresh async run.

## Child Compatibility

Suspense resolves children with `Promise.all` and supports:

* vnode components
* POJO components
* function components
* plain values

## Cache and Stale Protection Model

Suspense state is scoped by `(host DOM node, key)`.

For each scope:

1. Pending promise is stored.
2. Latest request version is tracked.
3. Outdated promise completions are ignored.

That prevents stale async completion from overwriting a newer render intent.

Reader note: with the same host + key, resolved value and error state are reused on later renders.

## Recommended Key Rules

* Use stable keys for stable data slices (`"user:42"`, `"feed:home"`).
* Change keys when you intentionally want a fresh async branch.
* Avoid random keys per render unless forced refetch is desired.
