# 8.3. Native Persistence (`valyrian.js/native-store`)

`createNativeStore` provides a small persisted store over `localStorage` or `sessionStorage`.

## Quick Start

```ts
import { createNativeStore, StorageType } from "valyrian.js/native-store";

const settings = createNativeStore(
  "app-settings",
  {
    state: { theme: "light" },
    toggleTheme() {
      this.set("theme", this.state.theme === "light" ? "dark" : "light");
    }
  },
  StorageType.Local
);
```

## Signature

```ts
createNativeStore(id, definition?, storageType?, reuseIfExist?)
```

* `storageType`: `StorageType.Local` or `StorageType.Session`
* `reuseIfExist`: if `true`, returns existing store for same id; otherwise duplicate id throws

Reader note: store identity is keyed by `id` in-memory. Creating the same id twice throws unless `reuseIfExist` is `true`.

## Base Store API

Every store exposes:

* `state`
* `set(key, value)`
* `get(key)`
* `delete(key)`
* `load()`
* `clear()`

`get` lazily calls `load()` when state is empty.

## Storage Sync Behavior

For `StorageType.Local` in browser runtime, store state syncs across tabs via the `storage` event.

`StorageType.Session` does not use cross-tab sync.

## Node Runtime Requirement

In Node.js, import `valyrian.js/node` before creating native stores so storage globals are available.

```ts
import "valyrian.js/node";
import { createNativeStore } from "valyrian.js/native-store";
```
