# 5.3. FluxStore (`valyrian.js/flux-store`)

`FluxStore` provides strict state mutation, async actions, module namespacing, and event hooks.

## Quick Start

```ts
import { FluxStore } from "valyrian.js/flux-store";

const store = new FluxStore({
  state: { count: 0 },
  mutations: {
    INCREMENT(state, amount: number) {
      state.count += amount;
    }
  },
  actions: {
    async incrementAsync(store, amount: number) {
      await Promise.resolve();
      store.commit("INCREMENT", amount);
    }
  },
  getters: {
    doubled(state) {
      return state.count * 2;
    }
  }
});
```

## Constructor Options

* `state` object or state factory function
* `mutations`
* `actions`
* `getters`
* `modules`
* `shouldFreeze` (default `true`)

## Core Rules

* Use `commit` for writes.
* Use `dispatch` for async orchestration.
* Read computed values via `getters`.
* With `shouldFreeze`, direct writes outside mutations throw.

## Namespaced Modules

Register/unregister modules dynamically:

```ts
store.registerModule("users", usersModule);
store.commit("users.SET_LIST", payload);
await store.dispatch("users.fetch", params);
store.unregisterModule("users");
```

Nested namespaces use dot notation (`a.b.MUTATION`).

Getters receive `(state, getters, rootState, rootGetters)` so module getters can compose with root data.

## Event API

Use `store.on(event, listener)` and `store.off(event, listener)`.

Main events:

* `set`, `delete`
* `beforecommit`, `commit`
* `beforedispatch`, `dispatch`
* `getter`
* `addlistener`, `removelistener`
* `plugin`
* `registerModule`, `unregisterModule`

## Plugins

Use `store.use(plugin, ...options)`.

A plugin is only applied once per store instance (duplicate registrations are ignored).
