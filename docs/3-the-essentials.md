# 3. The Essentials (View and Interaction)

This chapter covers the core primitives you need to build interactive UI with Valyrian.js.

By the end of this page, you should be able to:

* Render components
* Handle events
* Use built-in directives
* Control async UI updates

If you need full API contracts for `mount/update/unmount`, lifecycle helpers, `debouncedUpdate`, `trust`, and `v-model`, see [./3-runtime-core.md](./3-runtime-core.md).

## 3.1. Hello World

Start here if you are new. This confirms your base render flow is working.

```tsx
import { mount } from "valyrian.js";

const App = () => (
  <main>
    <h1>Hello World</h1>
    <p>Welcome to Valyrian.js</p>
  </main>
);

mount("body", App);
```

## 3.2. Components

Valyrian supports:

* **Functional components** for straightforward rendering.
* **POJO components** (`{ view() {} }`) for grouped state + logic + view.

### Functional components

```tsx
const Button = ({ color, ...props }, children) => (
  <button style={`background: ${color};`} {...props}>
    {children}
  </button>
);
```

### POJO components

```tsx
const Counter = {
  count: 0,
  increment() {
    this.count += 1;
  },
  view() {
    return (
      <div>
        <span>Count: {this.count}</span>
        <button onclick={this.increment}>+</button>
      </div>
    );
  }
};

mount("body", Counter.view);
```

## 3.3. Events and Update Cycle

Valyrian uses delegated native events (`onclick`, `oninput`, `onsubmit`, ...).

* After an event handler runs, Valyrian triggers a render update.
* If `event.preventDefault()` is called, the automatic update is skipped.

### Event Flow

```mermaid
flowchart TD
    evt[User event] --> handler[Event handler runs]
    handler --> prevent{preventDefault called?}
    prevent -- Yes --> skip[Skip automatic update]
    prevent -- No --> render[Run update and render cycle]
    render --> synced[UI synced]
```

```tsx
const Form = () => (
  <input oninput={(event) => console.log((event.target as HTMLInputElement).value)} />
);
```

If your UI does not update after interaction, check if `event.preventDefault()` is being called by mistake.

## 3.4. Basic Directives

### Structural: `v-if`, `v-show`

```tsx
const Panel = ({ visible }) => (
  <section>
    <p v-if={visible}>Mounted only when visible</p>
    <p v-show={visible}>Always mounted, hidden with CSS</p>
  </section>
);
```

Directive order note: when `v-if` resolves to `false`, later directives on that same vnode are skipped for that patch.

### Lists: `v-for`

`v-for` expects an iterable value plus a callback child.

```tsx
const TodoList = ({ items }) => (
  <ul v-for={items}>
    {(todo, index) => (
      <li key={todo.id}>
        {index + 1}. {todo.text}
      </li>
    )}
  </ul>
);
```

### Content: `v-html`, `v-text`

Use these when you want direct text/html assignment semantics.

```tsx
const state = {
  html: "<strong>Rich text</strong>",
  text: "Plain text only"
};

const Content = () => (
  <div>
    <div v-html={state.html} />
    <div v-text={state.text} />
  </div>
);
```

### Class toggles: `v-class`

`v-class` accepts:

* string: full class name string
* array: joined class names
* object: `{ className: boolean | () => boolean }`

## 3.5. Reactivity and Async Control

For synchronous user interactions, mutating plain objects in event handlers is usually enough because updates are event-driven.

For async flows, call `update()` manually when state transitions should be rendered.

```tsx
import { update } from "valyrian.js";

const UserProfile = {
  loading: false,
  user: null,

  async load() {
    this.loading = true;
    update();

    const response = await fetch("/api/user");
    this.user = await response.json();

    this.loading = false;
    update();
  },

  view() {
    if (this.loading) return <p>Loading...</p>;
    if (!this.user) return <button onclick={this.load}>Load user</button>;
    return <p>Hello {this.user.name}</p>;
  }
};
```

## 3.6. Creating Custom Directives

Register directives with `directive(name, handler)`. The runtime exposes:

1. `value`: directive input value.
2. `vnode`: current vnode (with `vnode.dom`).
3. `oldProps`: previous props (`undefined` on mount).

If a custom directive needs to mutate vnode props, use `setAttribute(...)` for reliable integration with patch behavior.

### Directive Lifecycle Flow

```mermaid
flowchart TD
    mount[Element mounted] --> create[v-create]
    create --> patchStart[Patch starts]
    patchStart --> cleanupPatch[v-cleanup before patch]
    cleanupPatch --> updateHook[v-update during patch]
    updateHook --> patchStart
    patchStart --> detach{Element removed?}
    detach -- Yes --> cleanupDetach[v-cleanup before detach]
    cleanupDetach --> remove[v-remove after detach]
```

```ts
import { directive } from "valyrian.js";

directive("focus", (enabled, vnode, oldProps) => {
  if (!oldProps && enabled && vnode.dom) {
    setTimeout(() => (vnode.dom as HTMLInputElement).focus(), 0);
  }
});
```

### Cleanup with `v-cleanup`

If your directive attaches listeners/resources, pair it with `v-cleanup`.

`v-cleanup` runs in two moments:

1. Before each patch cycle for existing nodes.
2. Before a node subtree is detached.

Use it as an idempotent teardown step.

```tsx
const App = () => (
  <div
    v-create={(vnode) => {
      const listener = () => console.log("resize");
      window.addEventListener("resize", listener);
      vnode.props.__listener = listener;
    }}
    v-cleanup={(vnode) => {
      window.removeEventListener("resize", vnode.props.__listener);
    }}
  />
);
```

Use this pattern to avoid duplicate subscriptions and memory leaks.

## Common Beginner Mistakes

1. Forgetting `name` in form controls used with directives like `v-model`/`v-field`.
2. Expecting async state changes to render without calling `update()`.
3. Mixing direct DOM mutations and framework-driven render flow in the same UI path.
