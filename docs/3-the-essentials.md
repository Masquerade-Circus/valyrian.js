Aquí tienes el contenido completo para la **Sección 3**, redactado en inglés.

Esta sección es crucial porque establece el **Modelo Mental** del framework. A diferencia de React, donde la reactividad es "mágica" (hooks), aquí enseñamos que la reactividad es **mecánica** (Event Loop -> Update), lo cual empodera al desarrollador.

# 3. The Essentials (View & Interaction)

Valyrian.js simplifies the UI development model by removing complex abstractions. The core concept is straightforward: You define your view using Components, and the framework updates the view automatically when user events occur.

## 3.1. Hello World

At its core, Valyrian.js renders Virtual Nodes (VNodes) into the DOM. While you can use the `v()` function directly, most developers prefer **JSX/TSX** for its declarative syntax.

```tsx
import { mount } from "valyrian.js";

const App = () => (
  <div id="main">
    <h1>Hello World</h1>
    <p>Welcome to Valyrian.js</p>
  </div>
);

// Mounts the component into the document body
mount("body", App);
```

## 3.2. Components

Valyrian supports two primary types of components: **Functional** (stateless or hook-based) and **POJO** (Plain Old JavaScript Object).

### Functional Components

These are standard functions that return VNodes. They receive `props` and `children` as arguments.

```tsx
const Button = ({ color, ...props }, children) => (
  <button style={`background: ${color}`} {...props}>
    {children}
  </button>
);

const App = () => (
  <Button color="blue" onclick={() => alert('Clicked!')}>
    Press Me
  </Button>
);
```

### POJO Components

This is a unique feature of Valyrian.js. Instead of using classes or hooks, you can use a plain object. The framework automatically binds the `view` method to the object itself, allowing you to use `this` to access properties naturally.

This pattern is ideal for grouping **State + Logic + View** without the overhead of classes.

```tsx
const Counter = {
  count: 0, // State
  increment() { // Logic
    this.count++;
  },
  view() { // View
    return (
      <div class="counter-widget">
        <span>Count: {this.count}</span>
        {/* "this" is automatically bound to the Counter object */}
        <button onclick={this.increment}>+</button>
      </div>
    );
  }
};

mount("body", Counter.view);
```

## 3.3. Handling Events

Valyrian.js uses **Native Event Delegation**. It attaches a single listener to the root of your application for each event type. When an event occurs, it propagates it to the correct handler defined in your VNode.

You use standard HTML event names (lowercase), such as `onclick`, `oninput`, `onsubmit`.

```tsx
const InputHandler = () => (
  <input 
    type="text" 
    oninput={(e) => console.log(e.target.value)} 
  />
);
```

**The Update Cycle:**
By default, Valyrian triggers a global `update()` after any event handler finishes execution. This means you don't need to call `setState` to update the UI in response to user interaction.

To prevent an update after an event (e.g., for performance optimization on high-frequency events), you can use `e.preventDefault()`.

## 3.4. Basic Directives

Directives in Valyrian are special attributes starting with `v-` that control how elements are rendered.

### Structural Directives

* **`v-if`**: Conditionally renders the element. If false, the element is removed from the DOM.
* **`v-show`**: Toggles the `display: none` style. The element remains in the DOM.

```tsx
const Toggle = ({ visible }) => (
  <div>
    <span v-if={visible}>I exist in the DOM</span>
    <span v-show={visible}>I am visible</span>
  </div>
);
```

### Lists (`v-for`)

The `v-for` directive expects an array (or iterable) and a **callback function** as its child.

> **Note:** Unlike `array.map()`, using `v-for` allows Valyrian to optimize list rendering internally.

```tsx
const TodoList = ({ items }) => (
  <ul v-for={items}>
    {/* The child is a function that receives the item and index */}
    {(todo, index) => (
      <li class={todo.done ? 'completed' : ''}>
        {index + 1}. {todo.text}
      </li>
    )}
  </ul>
);
```

### Content

* [3.5. Reactivity & Async Control](#35-reactivity--async-control)
  * [The POJO Pattern (Event-Driven)](#the-pojo-pattern-event-driven)
  * [Async Flows (Manual Updates)](#async-flows-manual-updates)
* [3.6. Creating Custom Directives](#36-creating-custom-directives)
  * [Registering a Directive](#registering-a-directive)
  * [The Directive Interface](#the-directive-interface)
  * [Example 1: Auto-Focus (`v-focus`)](#example-1-auto-focus-v-focus)
  * [Example 2: Efficient Updates (`v-highlight`)](#example-2-efficient-updates-v-highlight)
  * [Advanced: Directive Return Values](#advanced-directive-return-values)
  * [Best Practices](#best-practices)

## 3.5. Reactivity & Async Control

Valyrian.js does not use hidden schedulers or "magic" reactivity variables by default. It follows a deterministic flow.

### The POJO Pattern (Event-Driven)

In most UI interactions, state changes happen synchronously inside an event listener. Since Valyrian automatically updates after events, **Plain Objects are reactive by nature** in this context.

```tsx
const state = { value: "Hello" };

// Changing state.value updates the UI automatically 
// because 'oninput' triggers a render cycle.
const Input = () => <input oninput={(e) => state.value = e.target.value} />;
```

### Async Flows (Manual Updates)

When dealing with asynchronous operations (like `fetch` or `setTimeout`), the automatic update cycle has already finished by the time your data arrives. In these cases, you must call `update()` manually.

This gives you precise control over when the application repaints, allowing you to batch updates or manage loading states explicitly.

```tsx
import { update, v } from "valyrian.js";

const UserProfile = {
  data: null,
  loading: false,

  async loadUser() {
    // 1. Set loading state
    this.loading = true;
    update(); // Manually trigger render to show "Loading..."

    // 2. Fetch data
    const res = await fetch("/api/user");
    this.data = await res.json();

    // 3. Set final state
    this.loading = false;
    update(); // Manually trigger render to show the data
  },

  view() {
    if (this.loading) return <div>Loading...</div>;
    if (!this.data) return <button onclick={this.loadUser}>Load Profile</button>;
    
    return <div>Welcome, {this.data.name}</div>;
  }
};
```

This **"Loading -> Wait -> Result"** pattern is fundamental to Valyrian's philosophy: **You control the render loop.**

## 3.6. Creating Custom Directives

Valyrian.js allows you to extend its template language by registering custom directives. A directive is essentially a function that hooks into the rendering cycle of an element, allowing you to manipulate the DOM node directly based on the value passed to it.

Directives are ideal for low-level DOM access, integrating third-party libraries (like jQuery plugins or D3 charts), or creating reusable behaviors (like click-outside detection or auto-focus).

### Registering a Directive

Use the `directive` function to register a new behavior. The name you provide will be prefixed with `v-` automatically.

```typescript
import { directive } from "valyrian.js";

// Usage: <div v-my-directive="value" />
directive("my-directive", (value, vnode, oldProps) => {
  // Logic here
});
```

### The Directive Interface

The callback function receives three arguments:

1. **`value`**: The value passed to the directive in the JSX/Template (e.g., `true`, a string, an object, or a function).
2. **`vnode`**: The current Virtual Node being rendered. You can access the real DOM element via `vnode.dom`.
3. **`oldProps`**: The properties of this node from the *previous* render cycle.
   * If `oldProps` is `undefined`, this is the **First Render (Mount)**.
   * If `oldProps` exists, this is an **Update**.

### Example 1: Auto-Focus (`v-focus`)

A common use case is focusing an input element when it appears on the screen.

```javascript
import { directive, mount } from "valyrian.js";

// 1. Create the directive
directive("focus", (shouldFocus, vnode, oldProps) => {
  // Run only on mount (when oldProps is undefined)
  // and if the value passed is true
  if (!oldProps && shouldFocus && vnode.dom) {
    // Use setTimeout to ensure the element is fully painted
    setTimeout(() => vnode.dom.focus(), 0);
  }
});

// 2. Use it in a component
const Form = () => (
  <div>
    <input type="text" placeholder="I will be focused" v-focus={true} />
  </div>
);

mount("body", Form);
```

### Example 2: Efficient Updates (`v-highlight`)

You can use the `oldProps` argument to optimize performance, applying changes only when the value actually changes, similar to `useEffect` dependencies but for the DOM.

```javascript
directive("highlight", (color, vnode, oldProps) => {
  // If it's an update, check if the color actually changed
  if (oldProps && oldProps["v-highlight"] === color) {
    return; // Do nothing if value is the same
  }

  // Apply style directly to the DOM
  vnode.dom.style.backgroundColor = color;
});

const App = () => <div v-highlight="yellow">Highlighted Text</div>;
```

### Advanced: Directive Return Values

The return value of a directive can control the rendering flow of the component:

* **`false`**: If a directive returns `false`, Valyrian stops processing the remaining attributes and directives for that node. This is useful for conditional rendering logic similar to `v-if`.
* **`void` / `any`**: Standard behavior; the framework continues processing the node.

### Best Practices

1. **Direct DOM Access:** Directives are the safe place to touch `vnode.dom`.
2. **Clean Up:** If your directive adds event listeners (e.g., `v-click-outside`), remember to manage their removal. Since directives run on every update, ensure you don't attach duplicate listeners, or use `v-cleanup` alongside your custom directive to handle teardown.
3. **Naming:** Keep directive names short, lowercase, and descriptive (e.g., `v-tooltip`, `v-scroll`, `v-lazy`).
