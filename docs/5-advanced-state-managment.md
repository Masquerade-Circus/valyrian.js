# 5. Advanced State Management

Valyrian.js rejects the idea of a "one-size-fits-all" state management solution. Instead, it provides a stratified architecture that allows you to trade **velocity** for **structure** (and vice versa) depending on the specific needs of each part of your application.

While simple interactions can be handled with POJOs (Plain Old JavaScript Objects) and the standard render cycle, complex applications often require more sophisticated tools to manage shared data, side effects, and high-frequency updates. The framework provides four distinct levels of abstraction, ranging from raw JavaScript performance to strict Enterprise patterns.

## 5.1. Choosing a Strategy

The decision flow is hierarchical. You should choose the tool that fits the complexity of your data flow and the structural requirements of your team.

| Feature | **1. POJO** | **2. Pulse** | **3. PulseStore** | **4. FluxStore** |
| :--- | :--- | :--- | :--- | :--- |
| **Scope** | Component / Global | Local / Atomic | Global / Shared | Global / Modular |
| **Architecture** | Event-Driven | Signal-Based | Store Pattern | Flux Pattern |
| **Reactivity** | Implicit (Event Loop) | **Fine-Grained (Direct VDOM)** | **Fine-Grained (Direct VDOM)** | GLOBAL VDOM Patch Cycle |
| **Safety** | Mutable (Raw) | Value-based | **Immutable (Deep Freeze)** | **Immutable (Deep Freeze)** |
| **Debugging** | Console | Redux DevTools | Redux DevTools | Redux DevTools |
| **Best For** | Simple Interactions, Simple Forms, Simple CRUD or Prototyping. | High-freq updates, Toggles, Shared state. | Shared State, Real-time Apps, Secure Actions. | Monolithic State, Separated Modules, Secure Actions, Plugins. |

### Decision Guide

1. **Use POJO:** For 90% of UI interactions, forms, and simple CRUD apps where the Virtual DOM speed is sufficient.
2. **Use Pulse:** For isolated values that change frequently (counters, timers, mouse tracking) or when you need to bypass the VDOM reconciliation for maximum performance or you need full time-travel debuggin support even for simple values.
3. **Use PulseStore:** When you need a robust shared state with actions separated from data. It offers the simplicity of direct assignment syntax combined with the safety of immutability, listeners, and full time-travel debugging support.
4. **Use FluxStore:** When your architecture requires strict separation of concerns into different modules/files (Actions vs Mutations vs Getters) or when you need to integrate complex plugins, also with full time-travel debugging support.

## 5.2. High-Performance Shared State (Pulses)

The `lib/pulses` module implements **Fine-Grained Reactivity** (often referred to as Signals). Its architectural superpower is the ability to update specific VDOM directly, **bypassing the Global Virtual DOM reconciliation process**.

### 5.2.1. Fine-grained signals (`createPulse`)

A Pulse is an atomic unit of state. It returns a getter, a setter, and a notifier. It is the fastest possible way to update the UI in Valyrian.

```typescript
import { createPulse, createEffect } from "valyrian.js/pulses";

// 1. Create a Pulse
// Returns: [getter, setter, notifier]
const [count, setCount] = createPulse(0);

// 2. Usage in Component
// Valyrian detects the execution context and subscribes the Parent VNode
const Counter = () => (
  <button onclick={() => setCount(count() + 1)}>
    Clicks: {count()} 
  </button>
);
```

**How it works:**
When `count()` is called during a render, the framework registers a subscription. When `setCount` is called, it triggers the listeners. Because it is fine-grained, it can update specific parts of the view without re-evaluating the entire component tree.

### 5.2.2. Direct VDOM Updates

The key difference between Pulses and other state mechanisms is the update strategy.

When a component renders and consumes a Pulse:

1. The Pulse detects the active `current.vnode`.
2. It registers the specific VNode into a `WeakSet`.
3. When the value updates, the Pulse updates directly that VNode.

This effectively reduces the algorithmic complexity of an update from $O(Tree)$ to $O(1)$ for the subscribed nodes.

### 5.2.3. PulseStore: Reactive Shared State

`PulseStore` brings the power of Signals to complex state management. It provides a structured way to manage data by separating the **State** (Data) from the **Pulse Actions** (Methods).

Despite using a Proxy that allows natural syntax (e.g., `state.prop = value`), `PulseStore` enforces strict architectural patterns internally, including **Deep Freezing** for immutability and support for **Time-Travel Debugging** via Redux DevTools.

```typescript
import { createPulseStore } from "valyrian.js/pulses";

const store = createPulseStore(
  // 1. Initial State (Data)
  { 
    todos: [], 
    filter: 'all',
    user: { name: 'Guest' },
    isLoading: false
  },
  
  // 2. Pulse Actions (Methods)
  {
    // Synchronous Action
    // State is the first argument, payload is the rest of the arguments 
    addTodo(state, text) {
      // 'state' looks mutable, but it is a draft. 
      // Mutations here trigger the reactivity system safely.
      state.todos.push({ text, done: false });
    },

    // Asynchronous Action
    async fetchTodos(state) {
      const res = await fetch('/api/todos');
      const data = await res.json();
      
      // Updates are batched automatically
      state.todos = data;
    }

    // Flush
    async fetchWithLoadingState(state){
      state.isLoading = true;
      // This triggers an update of the registered vnodes
      this.$flush();

      // Trigger the fetch (this will not trigger any update as it's being called within a pulse action)
      await store.fetchTodos();

      // Reset the isLoading property
      state.isLoading = false;

      // The final update is trigger at this moment automatically
    }
  }
);

// 3. Usage
// The Store exposes the actions directly
store.addTodo("Buy milk"); 
```

**Features:**

* **Reactivity:** Components that read `store.state.todos` will automatically subscribe to changes.
* **Listeners:** You can attach side effects using `store.on('pulse', callback)`.
* **Debugging:** Fully compatible with Redux DevTools, allowing you to inspect every state change and "time travel" to previous states.

### 5.2.4. Strict Immutability

By default, Valyrian.js prioritizes safety. When using `createPulseStore`, the state is **Deep Frozen** after every update. This ensures that:

1. State cannot be mutated outside of defined actions.
2. The history of state changes is preserved for debugging.
3. Unintended side effects are eliminated.

**Optimization Escape Hatch:**
For scenarios requiring extreme performance (e.g., game loops running at 60fps or massive data visualization) where the CPU cost of cloning and freezing objects is prohibitive, Valyrian provides `createMutableStore`.

```typescript
import { createMutableStore } from "valyrian.js/pulses";

// WARN: No safety checks or Deep Freeze. 
// Fastest possible performance for high-frequency updates.
const gameStore = createMutableStore(
  { x: 0, y: 0 },
  {
    move(state, x, y) {
      state.x = x;
      state.y = y;
    }
  }
);
```

## 5.3. Structured State (`FluxStore`)

The `FluxStore` module implements a strict **unidirectional data flow** architecture. Unlike `PulseStore`, which focuses on direct reactivity and atomic updates, `FluxStore` focuses on **predictability** and **structure**.

It is designed for large-scale applications where separating a monolithic store in modules is critical for maintainability and testing.

### Architecture Overview

The store is composed of four core concepts that enforce a separation of concerns:

1. **State:** The single source of truth. It is strictly immutable outside of mutations.
2. **Mutations:** Synchronous transactions. The **only** mechanism allowed to modify the state.
3. **Actions:** Asynchronous operations. They handle business logic and commit mutations.
4. **Getters:** Computed properties derived from the state.

```typescript
import { FluxStore } from "valyrian.js/flux-store";

const store = new FluxStore({
  state: { count: 0 },
  mutations: { /* ... */ },
  actions: { /* ... */ },
  getters: { /* ... */ }
});
```

### 5.3.1. Mutations (Synchronous Transactions)

Mutations are the only functions with "write access" to the state. They must be synchronous.

* **Execution:** Triggered via `store.commit(type, payload)`.
* **Behavior:** When a mutation starts, the store temporarily unfreezes the state. Once the mutation finishes, the state is deeply frozen again, and a debounced update is triggered to refresh the UI.

```typescript
const store = new FluxStore({
  state: { count: 0 },
  mutations: {
    // State is the first argument, payload are rest of the arguments
    INCREMENT(state, amount) {
      state.count += amount;
    },
    RESET(state) {
      state.count = 0;
    }
  }
});

// Commit a change
store.commit("INCREMENT", 10);
```

### 5.3.2. Actions (Business Logic)

Actions are where your application logic lives. They can be asynchronous (fetching data, timers) and can dispatch other actions or commit mutations.

* **Execution:** Triggered via `store.dispatch(type, payload)`.
* **Context:** Actions receive the `store` instance as the first argument, giving access to `.commit`, `.dispatch`, `.state`, and `.rootStore`.
* **Return Value:** `dispatch` always returns a `Promise`, allowing you to await the completion of an action.

```typescript
const store = new FluxStore({
  state: { users: [], loading: false },
  mutations: {
    SET_LOADING(state, status) { state.loading = status; },
    SET_USERS(state, users) { state.users = users; }
  },
  actions: {
    async fetchUsers(store) {
      store.commit("SET_LOADING", true);
      
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        store.commit("SET_USERS", data);
      } finally {
        store.commit("SET_LOADING", false);
      }
    }
  }
});

// Trigger the action
await store.dispatch("fetchUsers");
```

### 5.3.3. Getters (Computed Data)

Getters are used to derive state. They are useful for filtering lists or calculating values based on the state without modifying it.

* **Arguments:** `(state, getters, rootState, rootGetters)`. This signature allows getters to access local state, other getters in the same module, or reach up to the root store in a modular architecture.

```typescript
const store = new FluxStore({
  state: { 
    todos: [
      { id: 1, text: "Code", done: true },
      { id: 2, text: "Sleep", done: false }
    ] 
  },
  getters: {
    // Filter finished todos
    doneTodos(state) {
      return state.todos.filter(todo => todo.done);
    },
    // Use another getter
    doneCount(state, getters) {
      return getters.doneTodos.length;
    }
  }
});

// Access as properties
console.log(store.getters.doneCount); // 1
```

### 5.3.4. Modules (Scalability)

Valyrian.js allows you to divide a monolithic store into namespaced modules. Modules can be nested infinitely.

**Static Registration:**
Defined in the constructor.

```typescript
const store = new FluxStore({
  modules: {
    account: accountModule,
    products: productsModule
  }
});
```

**Dynamic Registration:**
Modules can be register/unregister on demand after a main store was created.

```typescript
import { adminModule } from "./admin";

// Register the module under the namespace 'admin'
store.registerModule("admin", adminModule);

// Accessing State:
// store.state.admin.dashboardData

// Committing Mutations (Namespaced):
store.commit("admin.updateDashboard");

// Unregister when no longer needed to free memory
store.unregisterModule("admin");
```

**Cross-Module Access:**
Inside a module's action or getter, you can access the `rootStore` to interact with other parts of the global state tree.

### 5.3.5. Strict Immutability

`FluxStore` enforces immutability by default using `deepFreeze`.

* **Mechanism:** Every time you access `store.state` outside of a mutation, you receive a read-only (frozen) object.
* **Cloning:** When a mutation begins, Valyrian performs a `deepCloneUnfreeze` of the state tree needed.
* **Safety:** This prevents "accidental mutations" (e.g., modifying the state directly in a component or an asynchronous callback), which are a common source of bugs in large applications.

> **Performance Note:** Due to the cost of deep cloning and freezing, `FluxStore` trades raw update speed for transactional safety. For high-frequency updates (e.g., >60fps animations), consider using `PulseStore` or disabling freezing (via `shouldFreeze: false`), though the latter is discouraged for enterprise apps.

```typescript
const store = new FluxStore({
  shouldFreeze: false
});
```

### 5.3.6. Plugins and Events

You can extend the functionality of the store using the plugin system. This is how integrations like `Redux DevTools` or data persistence are implemented.

The store emits internal events that plugins can subscribe to:

```typescript
const myPlugin = (store) => {
  // Listen to every mutation
  function listenMutatations(store, mutationName, payload) {
    console.log(`Mutation ${mutationName} triggered with`, payload);
  }
  store.on("commit", listenMutations);

  // Later on if you want to unsubscribe
  store.off("commit", listenMutations)
};

store.use(myPlugin);
```

## 5.4. Debugging (Redux DevTools)

Valyrian.js includes a dedicated module (`valyrian.js/redux-devtools`) to integrate with the **Redux DevTools Extension**. This provides a unified debugging interface for all state management strategies (Flux, PulseStore, and individual Pulses), enabling features like:

* **Action Log:** View every mutation or pulse triggered in real-time.
* **State Inspection:** Deep dive into the current state object.
* **Time Travel:** Replay or revert actions to debug complex state transitions.
* **Diffing:** Visualize exactly what changed between updates.

> **Zero-Overhead Note:** The debugging logic is decoupled from the core stores. The connection functions act as bridges that listen to internal events. If you don't call these functions (e.g., in production), the debugging logic is dead code and can be tree-shaken by your bundler.

### 5.4.1. Connecting `FluxStore`

Since `FluxStore` follows a strict transactional pattern (Mutations), it maps perfectly to the Redux DevTools model. Every `commit` is logged as an action.

```typescript
import { FluxStore } from "valyrian.js/flux-store";
import { connectFluxStore } from "valyrian.js/redux-devtools";

const store = new FluxStore({
  state: { count: 0 },
  mutations: {
    INCREMENT(state) { state.count++; }
  }
});

// 1. Connect to DevTools
connectFluxStore(store, { name: "MyApp" });

// 2. Trigger changes
// This will appear in DevTools as "INCREMENT"
store.commit("INCREMENT");
```

The integration also tracks **Module Registration**, logging events like `[Module] Register: admin` when you register/unregister parts of your state.

### 5.4.2. Connecting `PulseStore`

`PulseStore` uses Proxies to update state. The integration listens to the `pulse` event emitted by the store wrapper. When you call a method on the store, it is logged as the action name.

```typescript
import { createPulseStore } from "valyrian.js/pulses";
import { connectPulseStore } from "valyrian.js/redux-devtools";

const userStore = createPulseStore(
  { name: "Guest" },
  {
    setName(state, name) {
      state.name = name;
    }
  }
);

// Connect
connectPulseStore(userStore, { name: "UserStore" });

// Usage
// Logs action "setName" with payload ["John"]
userStore.setName("John");
```

### 5.4.3. Connecting Individual Pulses

Debugging atomic signals (`createPulse`) requires a slightly different approach. Since a raw pulse is just an array of functions `[read, write]`, we cannot simply "attach" a listener to it without wrapping it.

`connectPulse` takes an existing pulse and returns a **new, instrumented pulse** tuple. You must use this new tuple for the debugging to work.

```typescript
import { createPulse } from "valyrian.js/pulses";
import { connectPulse } from "valyrian.js/redux-devtools";

// 1. Create the raw pulse
const rawPulse = createPulse(0);

// 2. Wrap it with DevTools connection
// The 'name' option is critical to identify this signal in the DevTools
const [count, setCount] = connectPulse(rawPulse, { name: "GlobalCounter" });

// 3. Use the wrapped setter
setCount(5); // Logs "update" in DevTools with payload 5
```

### Best Practices for Production

To ensure your application remains performant and lightweight in production, you should wrap the connection logic in an environment check.

```typescript
if (process.env.NODE_ENV === "development") {
  import("valyrian.js/redux-devtools").then(({ connectFluxStore }) => {
    connectFluxStore(store, { name: "ProductionApp" });
  });
}
```

This pattern ensures that the `redux-devtools` module code is only loaded when needed and excluded from your main production bundle.

Althoug this is a normal approach when compiling, we encourage that this calls should be removed in code for production instead of rely in the environment.
