# 4. Building Single Page Applications (SPA)

While the previous section covered how to render views, a real application needs navigation, data communication, and local state management. Valyrian.js provides these capabilities natively through its specialized modules, ensuring that these critical parts of your stack are as performant as the core rendering engine.

## 4.1. Routing (`valyrian.js/router`)

Valyrian.js includes a robust, isomorphic router based on a **Radix Tree (Trie)** structure. This algorithmic choice means routing performance ($O(k)$) does not degrade as your application grows to thousands of routes.

### Defining Routes & Navigation

To create a Single Page Application, you define a map of URL paths to Components.

```tsx
import { Router, mountRouter } from "valyrian.js/router";

// 1. Create the Router instance
const router = new Router();

// 2. Add Routes
router.add("/", () => <h1>Home</h1>);
router.add("/about", () => <h1>About Us</h1>);

// 3. Mount it to the DOM
// This attaches the necessary listeners and renders the current route
mountRouter("body", router);
```

#### The `v-route` Directive

Instead of using a specialized `<Link>` component, Valyrian provides the `v-route` directive. This directive:

1. Sets the `href` attribute for accessibility and SEO.
2. Attaches an optimized `onclick` handler that prevents a full page reload.
3. Uses the framework's global event delegation.

```tsx
const Menu = () => (
  <nav>
    <a v-route="/">Home</a>
    <a v-route="/about">About</a>
  </nav>
);
```

### Parameters, Wildcards & Middlewares

The router supports dynamic segments and wildcard matching. You can also chain functions (middlewares) for authentication or data loading before a component renders.

```tsx
// Dynamic Parameters
// Access via req.params.id
router.add("/user/:id", (req) => <UserProfile id={req.params.id} />);

// Wildcards
// Matches /files/images/logo.png -> req.matches[0] = "images/logo.png"
router.add("/files/.*", (req) => <FileViewer path={req.matches[0]} />);

// Middlewares
const authMiddleware = (req) => {
  if (!isLoggedIn()) return req.redirect("/login");
};

// The router executes functions in order.
// If a function returns a Component, the chain stops and renders it.
router.add("/dashboard", authMiddleware, () => <Dashboard />);
```

### Using Subrouters

For complex applications, you can nest routers. This allows you to modularize your application (e.g., separating the `/admin` section from the public site).

```tsx
const adminRouter = new Router();
adminRouter.add("/", () => <h1>Admin Dashboard</h1>);
adminRouter.add("/users", () => <h1>Manage Users</h1>);

const mainRouter = new Router();
mainRouter.add("/", () => <h1>Home</h1>);

// Mount the subrouter under a prefix
// All routes in adminRouter will be prefixed with /admin
mainRouter.add("/admin", adminRouter);
```

### Redirects

You can handle redirects directly within a route middleware using the request object.

```tsx
router.add("/old-page", (req) => req.redirect("/new-page"));
```

### Handling Errors (The `catch` Method)

The Valyrian Router includes a powerful error bubbling system. You can catch errors based on HTTP status codes, Error classes, error names, or specific strings within the error message.

The handlers are evaluated in order of definition.

```tsx
// 1. Catch by Status Code (error.status or error.code)
// Automatically catches 404 (Not Found) thrown by the router
router.catch(404, (req) => <h1>404 - Page Not Found</h1>);

// You can throw your own errors with status codes
router.add("/forbidden", () => {
  const err = new Error("Stop right there!");
  err.status = 403;
  throw err;
});
router.catch(403, () => <h1>403 - Forbidden</h1>);

// 2. Catch by Error Class (instanceof)
// Useful for handling specific logic errors
router.catch(TypeError, (req, error) => <div class="alert">A type error occurred: {error.message}</div>);

// 3. Catch by String (Name or Message)
// Matches if error.name === "NetworkError" OR if error.message includes "NetworkError"
router.catch("NetworkError", (req, error) => <div class="offline">You seem to be offline.</div>);

// 4. Generic Catch-All
// Catches anything not handled by previous handlers
router.catch((req, error) => {
  console.error("Unhandled error:", error);
  return <h1>Critical Error: {error.message}</h1>;
});
```

### Best Practices

- **Order Matters:** Middlewares run sequentially. Place your auth checks before your sensitive routes.
- **Error Granularity:** Define specific error handlers (like 404 or Auth errors) before the generic catch-all handler to provide better UX.
- **Isomorphism:** Since the router is pure JS, you can export this same router instance to your Node.js server entry point to handle server-side routing seamlessly.

## 4.2. Data Fetching (`valyrian.js/request`)

Valyrian.js includes a lightweight, isomorphic HTTP client wrapper around the native `fetch` API. It removes the boilerplate of standard fetch calls (like manual JSON parsing or stringifying bodies) while ensuring requests work identically in both the Browser and Node.js environments.

### Basic Usage: `get`, `post`, `put`, `delete`

The `request` object exposes standard HTTP methods. It automatically handles content negotiation: it sends data as JSON by default (unless `FormData` is detected) and parses the response based on the `Accept` header.

```typescript
import { request } from "valyrian.js/request";

// 1. GET with Automatic Query Serialization
// The second argument object is converted to ?page=1&sort=desc
const users = await request.get("/api/users", { page: 1, sort: "desc" });

// 2. POST with Automatic JSON Stringification
// If the body is a plain object, it sends 'Content-Type: application/json'
const newUser = await request.post("/api/users", {
  name: "John Doe",
  email: "john@example.com"
});

// 3. PUT and DELETE
await request.put(`/api/users/${newUser.id}`, { active: true });
await request.delete(`/api/users/${newUser.id}`);
```

> **Note:** If the response status is not 2xx, `request` throws an Error object containing the `response` and the parsed `body`.

### Handling Headers & Auth Tokens

You can set headers per request or globally for subsequent calls using `setOption`.

**Per Request:**

```typescript
await request.get("/api/private", null, {
  headers: { Authorization: "Bearer my-token" }
});
```

**Global Configuration:**
Use `request.setOption` to inject headers into all future requests made by this instance.

```typescript
// Set a global Authorization header
request.setOption("headers", {
  Authorization: `Bearer ${token}`,
  "X-Custom-Header": "Valyrian"
});
```

### Composing Requests (`request.new`)

Valyrian allows you to create **scoped instances** of the requester. This is useful for communicating with multiple APIs or microservices that have different base URLs or configurations.

When you create a new instance, it inherits the configuration of its parent but allows you to extend the base URL.

```typescript
// 1. Create a specific client for an external API
const jsonPlaceHolder = request.new("https://jsonplaceholder.typicode.com");

// This request goes to https://jsonplaceholder.typicode.com/todos/1
const todo = await jsonPlaceHolder.get("/todos/1");

// 2. Create a scoped client for your internal API
const api = request.new("/api/v1", {
  headers: { "Content-Type": "application/json" }
});

// This request goes to /api/v1/auth/login
const session = await api.post("/auth/login", credentials);
```

### Allowed Methods

By default, the request module supports: `get`, `post`, `put`, `patch`, `delete`, `head`, and `options`.
You can restrict which methods are available on a specific instance for security or architectural constraints.

```typescript
// Create a read-only client
const readOnlyApi = request.new("/api", {
  allowedMethods: ["get", "head"]
});

await readOnlyApi.get("/users"); // Works
// await readOnlyApi.post("/users", { ... }); // Error: Method post not allowed
```

### Using Suspense

Valyrian.js supports the "Render-as-you-fetch" pattern. Since `request` returns standard Promises, it integrates natively with async components and `<Suspense>`.

```tsx
import { Suspense } from "valyrian.js/suspense";
import { request } from "valyrian.js/request";

// 1. Define an Async Component
// This component initiates the fetch and pauses rendering until data arrives
async function UserList() {
  const users = await request.get("/api/users");

  return (
    <ul>
      {users.map((user) => (
        <li>{user.name}</li>
      ))}
    </ul>
  );
}

// 2. Wrap with Suspense
const App = () => (
  <div class="container">
    <h1>User Directory</h1>
    <Suspense
      key="user-list"
      fallback={<div class="spinner">Loading users...</div>}
      error={(err) => <div class="error">Failed to load: {err.message}</div>}
    >
      <UserList />
    </Suspense>
  </div>
);
```

> **Note:** Always provide a unique `key` prop to `<Suspense>` components to ensure proper caching and reusability.

### Sending Native Body Types (Files, Form Data, Blobs)

Valyrian's request utility is smart enough to detect native JavaScript data types. If you pass a `FormData`, `URLSearchParams`, `Blob`, or a raw `string`, it skips the JSON serialization and passes the data directly to the browser's fetch API.

This is particularly useful for file uploads or legacy form submissions.

```typescript
// 1. File Upload (FormData)
const formData = new FormData();
formData.append("username", "valyrian_user");
// Assuming 'fileInput' is an <input type="file">
formData.append("avatar", fileInput.files[0]);

// Valyrian detects FormData and lets the browser set the Content-Type
// (multipart/form-data) with the correct boundary automatically.
await request.post("/api/upload", formData);

// 2. URL Encoded Forms (application/x-www-form-urlencoded)
const searchParams = new URLSearchParams();
searchParams.append("search", "query");
searchParams.append("filter", "active");

await request.post("/api/search", searchParams);

// 3. Raw Text/XML
const xmlData = "<note><body>Hello</body></note>";
await request.post("/api/soap", xmlData, {
  headers: { "Content-Type": "text/xml" }
});
```

> **Note:** When passing a native `FormData` object, do **not** manually set the `Content-Type` header to `multipart/form-data`. Let the browser set it for you to ensure the boundary parameter is included correctly.

## 4.3. Local State & Lifecycle (`valyrian.js/hooks`)

Valyrian.js provides a robust system for managing component-local state and side effects. Unlike global stores (Flux/Pulse), these tools are scoped strictly to the component instance.

The framework uses a **Hybrid Architecture** for lifecycle management:

1. **Hooks:** For logic, state, and side effects (inspired by React).
2. **Directives:** For direct DOM manipulation and element-level lifecycle (inspired by Vue/Solid).

> **Architecture Note:** Valyrian hooks are linked to the component instance using a `WeakMap`. This ensures that when a component is removed from the DOM, all associated state and effects are automatically garbage collected, preventing memory leaks without manual cleanup.

### Standard Hooks

Valyrian implements the standard hooks API but with a key architectural difference in `useState` to ensure closure freshness.

#### `useState(initialValue)`

Returns a getter **function** and a setter function.

- **Getter (`count()`):** Returns the current value. By returning a function instead of a value, Valyrian avoids "stale closure" problems. You always get the fresh value when invoking the getter.
- **Setter (`setCount(newVal)`):** Updates the value and triggers a `debouncedUpdate()`.

```tsx
import { useState } from "valyrian.js/hooks";

const Counter = () => {
  // 1. Initialize
  const [count, setCount] = useState(0);

  // 2. Usage
  // Note: call count() to get the value
  return <button onclick={() => setCount(count() + 1)}>Clicks: {count()}</button>;
};
```

#### `useEffect(callback, dependencies?)`

Runs side effects after the component renders. It returns a cleanup function.

- **Mount:** Runs when the component matches the DOM.
- **Update:** Runs if any value in the `dependencies` array has changed (`hasChanged` check).
- **Cleanup:** The function returned by the callback runs before the next effect or when the component unmounts.

```tsx
import { useEffect } from "valyrian.js/hooks";

const Timer = () => {
  useEffect(() => {
    const id = setInterval(() => console.log("Tick"), 1000);

    // Cleanup function (runs on unmount)
    return () => clearInterval(id);
  }, []); // Empty array = Run only on mount
};
```

#### `useMemo` & `useCallback`

Performance optimizations to cache values or functions between renders.

- **`useMemo(() => value, [deps])`**: Caches a computed value.
- **`useCallback(fn, [deps])`**: Caches a function reference to maintain identity (useful for passing props to children).

#### `useRef(initialValue)`

Creates a persistent object `{ current: val }` that persists across renders.
Valyrian integrates this with the `v-ref` directive (or simply `ref` in JSX) to capture DOM elements.

```tsx
import { useRef, useEffect } from "valyrian.js/hooks";

const InputFocus = () => {
  const inputRef = useRef(null);

  useEffect(() => {
    // Access the DOM node directly
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return <input ref={inputRef} />;
};
```

### Lifecycle Directives (The "Valyrian Way")

While Hooks are great for logic, Valyrian encourages using **Directives** for DOM-related lifecycle events. These directives are processed directly during the VDOM `patch` cycle, offering lower overhead than `useEffect`.

- **`v-create`**: Triggered immediately after the element is created and added to the DOM. Ideal for 3rd-party library initialization (D3, Maps).
- **`v-update`**: Triggered every time the element's VNode is updated (props/children change).
- **`v-cleanup`**: Triggered **before** an update occurs or before the element is removed. Used to detach listeners or stop animations.
- **`v-remove`**: Triggered just before the element is removed from the DOM.

```tsx
const LifecycleBox = () => (
  <div
    v-create={(dom) => {
      console.log("I am alive!", dom);
      dom.style.opacity = "0";
      dom.animate([{ opacity: 0 }, { opacity: 1 }], 500);
    }}
    v-update={(dom, oldProps) => {
      console.log("I changed!");
    }}
    v-remove={(dom, done) => {
      // You can perform an exit animation here
      console.log("Goodbye...");
    }}
  >
    Lifecycle Demo
  </div>
);
```

### Creating Custom Hooks (`createHook`)

Valyrian exposes its internal hook factory, `createHook`. This is the same primitive used to build `useState` and `useEffect`. It allows you to create complex, stateful logic that survives re-renders and cleans up after itself automatically.

The `createHook` function takes a `HookDefinition` object and returns a function (the hook) that can be used inside components.

#### The `HookDefinition` Interface

This interface defines the lifecycle of your hook. Valyrian manages the state persistence using `WeakMap` linked to the component instance.

```typescript
interface HookDefinition {
  onCreate: (...args: any[]) => any;
  onUpdate?: (hookState: any, ...args: any[]) => void;
  onCleanup?: (hookState: any) => void;
  onRemove?: (hookState: any) => void;
  returnValue?: (hookState: any) => any;
}
```

- **`onCreate`**: **Required.** Runs only once when the component is first rendered. It receives the arguments passed to the hook and must return the initial **state object** of the hook. This state is persisted across re-renders.
- **`onUpdate`**: **Optional.** Runs on every subsequent render (re-execution of the component function). It receives the persisted `hookState` (returned by `onCreate`) and the current arguments. Use this to update the state based on new props or inputs.
- **`onCleanup`**: **Optional.** Runs **before** every update (next render) and before the component is removed. It is used to clean up side effects created in the previous cycle (similar to the cleanup function in `useEffect`).
- **`onRemove`**: **Optional.** Runs **only once** when the component is permanently removed from the DOM. This is the place to tear down global listeners, timers, or subscriptions to prevent memory leaks.
- **`returnValue`**: **Optional.** Transforms the internal `hookState` into what the component actually receives. If omitted, the hook returns the raw `hookState`. Use this to expose a clean API (e.g., getters/setters) while keeping internal state private.

#### Example: `useWindowWidth`

Let's create a hook that tracks the window width. It needs to add a listener on mount, update state on resize, and remove the listener on unmount.

```typescript
import { createHook } from "valyrian.js/hooks";
import { update } from "valyrian.js";

const useWindowWidth = createHook({
  // 1. Initialize state
  onCreate: () => {
    const state = {
      width: window.innerWidth,
      handler: null
    };

    // Define the resize handler
    state.handler = () => {
      state.width = window.innerWidth;
      update(); // Trigger a re-render when width changes
    };

    // Attach listener
    window.addEventListener("resize", state.handler);

    return state;
  },

  // 2. Cleanup on Unmount
  // We use onRemove because we only want to detach the listener
  // when the component is destroyed, not on every render.
  onRemove: (state) => {
    window.removeEventListener("resize", state.handler);
  },

  // 3. Public API
  // The component only needs the number, not the handler or the state object.
  returnValue: (state) => state.width
});

// Usage
const ResponsiveComponent = () => {
  const width = useWindowWidth();
  return <div>Current Width: {width}px</div>;
};
```

#### Example: `usePrevious`

A hook to track the previous value of a variable.

```typescript
const usePrevious = createHook({
  // Initialize with undefined or the first value
  onCreate: (value) => ({ current: undefined, previous: undefined }),

  // On every render, shift the values
  onUpdate: (state, value) => {
    state.previous = state.current;
    state.current = value;
  },

  // Return the previous value
  returnValue: (state) => state.previous
});
```
