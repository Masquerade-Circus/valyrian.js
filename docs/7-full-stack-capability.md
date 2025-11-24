# 7. The Full-Stack Capability (Isomorphism)

Valyrian.js removes the historical barrier between Frontend and Backend. It is built as an **Isomorphic (Universal)** framework, meaning the exact same code can execute in the Browser and in Node.js/Deno/Bun environments without modification.

While most frameworks require complex build steps to transpile code differently for the server and client, Valyrian achieves isomorphism through a **Unified Runtime**. The framework polyfills the necessary browser APIs (like `document`, `storage`, and `request`) in the server environment using lightweight, high-performance implementations.

This allows you to:

1. **Share Logic:** Reuse Routes, Stores, and Validation logic 100%.
2. **Share Views:** Render the same Components on the server for SEO and on the client for interactivity.
3. **Unify Data:** Use `sessionStorage` on the server (isolated per request) just like you would in the browser.

## 7.1. Server-Side Rendering (SSR)

Server-Side Rendering is the process of generating the initial HTML of your application on the server. This improves **SEO**, **Social Sharing** (Open Graph cards), and **First Contentful Paint (FCP)** performance.

### Rendering to String

The `valyrian.js/node` module exposes a `render` function. This function takes a VNode (or a component) and synchronously returns the generated HTML string.

```typescript
import { render } from "valyrian.js/node";
import { App } from "./app"; // Your main component

// 1. Render the component tree to an HTML string
const html = render(<App />);

console.log(html); 
// Output: "<div id='app'><h1>Hello Server</h1></div>"
```

### Concept: The Lightweight Server DOM

Unlike other SSR solutions that rely on heavy headless browsers (like Puppeteer) or complex DOM simulations (like JSDOM), Valyrian implements its own **Lightweight Server DOM** (`tree-adapter`).

This adapter is a minimal implementation of the DOM standard (`Node`, `Element`, `Text`) written in pure JavaScript and optimized specifically for **String Concatenation**.

* **No Layout Engine:** It does not calculate styles, positions, or paint pixels. It only structures data.
* **Zero Overhead:** Because it doesn't load a full browser context, the "cold start" time is negligible, making it perfect for **Serverless** and **Edge Computing** (e.g., Cloudflare Workers, AWS Lambda).
* **Security:** Html attributes are automatically sanitized during the serialization process to prevent XSS attacks.

### Usage Constraints

Because the server is not a browser, there are natural limitations to what code can run during SSR:

1. **Missing APIs:** Browser-specific APIs like `window.scrollTo`, `canvas`, `localStorage` (though Valyrian polyfills storage, see 7.3), or `geolocation` do not exist.
2. **Lifecycle:** On the server, `render()` runs the component logic once to generate the HTML. Lifecycle events like `onCleanup` or `onUpdate` are not triggered because there is no user interaction loop.
3. **Guarding Code:** If you need to use a browser API, check the environment first.

```typescript
import { isNodeJs } from "valyrian.js";

const Component = () => {
  if (!isNodeJs) {
    // Safe to use browser APIs here if strictly necessary
    console.log(window.innerWidth);
  }
  return <div>Content</div>;
};
```

## 7.2. Isomorphic Networking

One of the biggest challenges in Full-Stack applications is networking consistency. A request to `/api/users` works fine in the browser (because it is relative to the domain), but fails in Node.js (Server-Side Rendering) because `fetch` in Node requires an absolute URL (protocol + domain + port).

Furthermore, inside a server environment (like Docker or Kubernetes), the API might not be reachable via the public domain, but rather through an internal network address (e.g., `http://localhost:3000` or `http://api-service`).

Valyrian's `lib/request` module solves this natively with an **Environment-Aware URL Resolver**.

### Configuring Request: `base`, `node`, and `api`

You can configure the request utility to rewrite URLs automatically depending on where the code is executing.

```typescript
import { request } from "valyrian.js/request";

request.setOption("urls", {
  // 1. Base (Browser): 
  // Optional prefix for client-side requests. 
  // Usually empty string "" for relative paths.
  base: "",

  // 2. Node (Server):
  // The internal base URL to use when running in Node.js.
  node: "http://localhost:8080",

  // 3. API (Replacement Pattern):
  // Optional. A string to match and replace with the 'node' URL.
  api: null 
});
```

#### Scenario A: Relative Paths (The Standard Monolith)

You have a frontend serving the app and an API on the same server.

* **Browser:** Calls `/api/list` -> Browser resolves to `https://my-site.com/api/list`.
* **Server (SSR):** Calls `/api/list` -> Node.js doesn't know the domain.

**Configuration:**

```typescript
request.setOption("urls", {
  node: "http://localhost:3000" // Internal port
});
```

**Result:**
Code: `request.get('/api/list')`

* **Client executes:** `/api/list`
* **Server executes:** `http://localhost:3000/api/list`

#### Scenario B: API Gateway / Microservices (Replacement)

You have a public API domain, but internally the SSR server should talk directly to the microservice to avoid latency or public internet traffic.

* **Browser:** Calls `https://api.public.com/v1/users`.
* **Server (SSR):** Should call `http://internal-user-service/v1/users`.

**Configuration:**

```typescript
request.setOption("urls", {
  api: "https://api.public.com",      // What to look for
  node: "http://internal-user-service" // What to replace it with
});
```

**Result:**
Code: `request.get('https://api.public.com/v1/users')`

* **Client executes:** `https://api.public.com/v1/users`
* **Server executes:** `http://internal-user-service/v1/users`

### Sharing Context between Client and Server

When performing SSR, the server makes requests *on behalf of the user*. This means you often need to pass the user's **Cookies** or **Authorization Headers** from the incoming browser request to the internal API request.

Since `request` is a singleton, you should create a **scoped instance** for each server request to avoid leaking one user's token to another user's request (Race Condition).

**Pattern: Scoped Request Injection**

```typescript
// server.ts (Express/Fastify handler)
import { request } from "valyrian.js/request";
import { render } from "valyrian.js/node";

app.get("*", (req, res) => {
  // 1. Create a scoped request instance for this specific user
  // We forward the cookies from the incoming request
  const scopedRequest = request.new("", {
    headers: {
      "Cookie": req.headers.cookie || "",
      "Authorization": req.headers.authorization || ""
    }
  });

  // 2. Pass this instance to your app via Props or Context
  // Ideally, your data fetching logic uses this instance
  const html = render(<App api={scopedRequest} />);
  
  res.send(html);
});
```

This pattern ensures that when your components execute `api.get('/user/profile')` on the server, the API receives the correct credentials for that specific user.

## 7.3. Isomorphic Data (`ServerStorage`)

In a browser environment, `sessionStorage` and `localStorage` are distinct for each user (browser instance). However, Node.js is a single-threaded, long-running process. If you simply assign a value to a global variable (or a global polyfill of `localStorage`), **all simultaneous users will share that same value**.

This leads to the classic SSR security nightmare: User A seeing User B's session token.

Valyrian.js solves this natively by implementing **Request Context Isolation** using Node's `AsyncLocalStorage` API.

### How it Works

The `lib/node` module polyfills the global `sessionStorage` and `localStorage` objects with a smart proxy called `ServerStorage`.

1. **Global Scope (Default):** If accessed outside a request (e.g., server startup), it behaves like a standard in-memory store shared by the process.
2. **Request Scope (Isolated):** When wrapped in `ServerStorage.run()`, it creates a unique, ephemeral storage bucket that exists **only for the duration of that specific asynchronous execution context**.

### Usage on the Backend

To enable this isolation, you must wrap your request handler (or a middleware) with the `run` method.

**Example with Express/Fastify:**

```typescript
import { ServerStorage } from "valyrian.js/node";
import { render } from "valyrian.js/node";
import { App } from "./app";

// Generic Middleware
app.use((req, res, next) => {
  // Initialize a new isolated storage context for this request
  ServerStorage.run(() => {
    // Inside this callback (and any async function called within it),
    // 'sessionStorage' is private to this request.
    
    // 1. Seed the storage with request data (e.g., Cookies)
    if (req.headers.cookie) {
        sessionStorage.setItem("auth_token", parseCookies(req).token);
    }

    next();
  });
});

// Your Route
app.get("*", (req, res) => {
  // The component renders using the data specific to THIS user
  const html = render(<App />);
  res.send(html);
});
```

### Usage in the App (Isomorphic Code)

The beauty of this architecture is that your application code does not need to know it is running on the server. You simply use the standard Web APIs or Valyrian's `native-store`.

**Component Code (Works in Browser & Node):**

```tsx
import { createNativeStore, StorageType } from "valyrian.js/native-store";

// 1. Create an isomorphic store
// Browser: Wraps window.sessionStorage
// Server: Wraps the isolated AsyncLocalStorage context
const session = createNativeStore("user-session", {
  user: null
}, StorageType.Session);

const UserProfile = () => {
  const user = session.get("user"); // Safe on server!

  return (
    <div>
      <h1>Welcome, {user ? user.name : "Guest"}</h1>
    </div>
  );
};
```

### Benefits

1. **No Prop Drilling:** You don't need to pass the `req` object down through 20 layers of components just to access the user ID.
2. **Security:** It is architecturally impossible for User A's data to leak into User B's render, because they run in separate async contexts.
3. **Standard API:** You use the standard `getItem` / `setItem` methods or Valyrian's wrappers, maintaining 100% compatibility with client-side logic.

> **Technical Detail:** The `ServerStorage` is ephemeral. Data saved during the request is lost once the response is sent and the context is destroyed. It is intended for **Session State** (Cookies, Tokens, User Info), not as a permanent database.

## 7.4. Progressive Web Apps (PWA)

Valyrian.js treats PWA capabilities as a build-time infrastructure requirement. The `lib/node` module includes utilities to automate the generation of assets and logic required to make your application installable and offline-capable.

This allows you to transform a standard SPA into a PWA with just a few lines of code in your build script.

### 7.4.1. Automated Asset Generation (`icons`)

Creating the dozens of icon sizes and manifest files required for Android, iOS, and Desktop is tedious. Valyrian wraps the `favicons` engine to generate these assets from a single source image.

**The "Killer Feature": The `Links` Component**
Unlike standard tools that just output HTML files, Valyrian generates a **JavaScript Component** (`links.js`) containing all the `<link>` and `<meta>` tags. You can import this component directly into your layout, keeping your `index.html` clean and programmatic.

**Configuration:**

```javascript
// build.js (Node.js script)
import { icons } from "valyrian.js/node";

await icons("./assets/logo.png", {
  // 1. Output Paths
  iconsPath: "./public/icons/", // Where to save images/manifest
  linksViewPath: "./src/generated/", // Where to save the helper component

  // 2. App Metadata (Manifest.json)
  appName: "My Valyrian App",
  appShortName: "Valyrian",
  appDescription: "A high-performance PWA",
  start_url: "/",
  display: "standalone",
  background: "#ffffff",
  theme_color: "#000000",
  
  // 3. Platform Support
  icons: {
    android: true,    // Android Homescreen
    appleIcon: true,  // iOS WebClip
    favicons: true,   // Desktop
    windows: false,   // Windows Tiles
    yandex: false
  }
});
```

**Usage in Layout:**

```tsx
// src/layout.tsx
// Import the generated component
import Links from "./generated/links"; 

const Layout = ({ children }) => (
  <html>
    <head>
      <title>My App</title>
      {/* Injects manifest, apple-touch-icon, favicon, etc. */}
      <Links /> 
    </head>
    <body>{children}</body>
  </html>
);
```

### 7.4.2. Service Worker Generation (`sw`)

Writing a robust Service Worker by hand is error-prone. Valyrian provides a generator `sw()` that creates a production-ready `sw.js` file tailored to your application's version and routes.

**Capabilities:**

* **Cache Versioning:** Automatically busts cache when the `version` string changes.
* **Pre-caching:** Downloads critical assets (App Shell) immediately upon install.
* **Smart Strategies:**
  * **API Calls:** Uses *Network First*. Checks the network; if it fails, falls back to cache (if available).
  * **Static Assets:** Uses *Cache First*. Extremely fast loading for images/JS.
* **Offline Fallback:** Automatically serves an `offline.html` (or your App Shell) when there is no connectivity.

**Configuration:**

```javascript
// build.js
import { sw } from "valyrian.js/node";
import pkg from "./package.json";

sw("./public/sw.js", {
  // 1. Versioning (Crucial for updates)
  version: pkg.version, 
  name: "my-app-cache",

  // 2. Pre-cache list (The App Shell)
  // These files will be downloaded immediately
  urls: [
    "/", 
    "/index.html", 
    "/dist/main.js", 
    "/css/style.css",
    "/offline.html"
  ],

  // 3. Behavior
  debug: false, // Turn off console logs in production
  logFetch: false, // Log every network request (for debugging)
  offlinePage: "/offline.html" // Fallback for navigation requests
});
```

### 7.4.3. Client-Side Registration

Once the assets and Service Worker are generated, you need to register them in the browser. Valyrian exposes a helper for this in `lib/sw`.

```tsx
// src/main.tsx
import { registerSw } from "valyrian.js/sw";
import { mount } from "valyrian.js";

const App = () => <div>My PWA</div>;

mount("body", App);

// Register only in the browser
// (The helper automatically checks for isNodeJs internally)
registerSw("/sw.js")
  .then(registration => {
    console.log("PWA Active:", registration);
  });
```

### 7.4.4. Handling Updates (`SKIP_WAITING`)

The generated Service Worker listens for a specific message to force an update. This allows you to build "New Version Available" notifications in your UI.

**The Flow:**

1. Browser detects a byte difference in `sw.js` (generated with a new version number).
2. The new SW installs but waits (enters `waiting` state).
3. Your UI can detect this state and send a message to activate the new version immediately.

```javascript
// Example: Update Notification Logic
navigator.serviceWorker.register("/sw.js").then(reg => {
  
  // If there's a waiting worker, it means an update is ready
  if (reg.waiting) {
    notifyUpdate(reg.waiting);
  }

  reg.addEventListener("updatefound", () => {
    const newWorker = reg.installing;
    newWorker.addEventListener("statechange", () => {
      if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
        notifyUpdate(newWorker);
      }
    });
  });
});

function notifyUpdate(worker) {
  if (confirm("New version available. Refresh?")) {
    // Send the signal Valyrian SW expects
    worker.postMessage({ type: "SKIP_WAITING" });
    
    // Reload when the new SW takes control
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }
}
```

## 7.5. Bundling JavaScript & TypeScript (`inline`)

Valyrian includes a built-in compiler wrapper called **`inline`**. This utility leverages the speed of **esbuild** and **tsc** (TypeScript Compiler) to bundle your application code into a single, production-ready file directly from Node.js scripts.

This means you can deploy complex TypeScript applications without ever creating a `webpack.config.js` or `vite.config.ts`.

### Usage

The `inline` function takes an entry file path and an options object. It resolves imports, transpiles JSX/TSX to standard JavaScript, and optionally minifies the output.

This allows you to inline your javascript directly into your HTML (for critical js performance) or save them as an optimized `.js` file.

```javascript
import { inline } from "valyrian.js/node";
import fs from "fs";

async function buildJS() {
  // Transpile and Bundle
  const bundle = await inline("./src/index.tsx", {
    // Minify the code using Terser for maximum compression
    compact: true, 
    
    // Optional: Generate source maps
    sourcemap: "external" 
  });

  // bundle.raw contains the JavaScript code
  // bundle.map contains the source map (if generated)
  // Option A: Save to file
  fs.writeFileSync("./public/main.js", bundle.raw);

  // Option B: Return string to inject into HTML <script> tag
  return bundle.raw;
}
```

### Features

* **Zero-Config TypeScript:** It automatically handles `.ts` and `.tsx` files.
* **JSX Transformation:** Automatically sets the JSX factory to `v` and fragment to `v.fragment`.
* **Tree Shaking:** Removes unused code to keep the bundle size minimal.
* **Validation:** By default, it runs a type-check pass using `tsc` to ensure code quality before bundling (can be disabled via `noValidate: true` for speed).

## 7.6. CSS Bundling and Minification

The `inline` utility is polymorphic; it also handles Stylesheets. When you pass a CSS, SCSS, or Stylus file to it, Valyrian switches internally to **CleanCSS**.

This allows you to inline your styles directly into your HTML (for critical CSS performance) or save them as an optimized `.css` file.

### Usage

```javascript
import { inline } from "valyrian.js/node";

async function buildCSS() {
  const styles = await inline("./src/styles/app.css", {
    cleanCss: {
      level: 2 // Aggressive optimization (merging selectors, removing duplicates)
    }
  });

  // Option A: Save to file
  fs.writeFileSync("./public/style.css", styles.raw);

  // Option B: Return string to inject into HTML <style> tag
  return styles.raw;
}
```

### Why use this?

Instead of adding a complex CSS pipeline with PostCSS/Nano, Valyrian provides immediate access to level-2 CSS optimization (restructuring rules for smaller size) out of the box.

## 7.7. Removing Unused Styles (`uncss`)

One of the most powerful features included in `lib/node` is the **`inline.uncss`** utility.

In modern development, we often use CSS frameworks (like Tailwind, Bootstrap, or Bulma) that contain thousands of classes we never use. Shipping the full CSS file hurts performance (Blocking Render Time).

Valyrian allows you to **Purge** unused CSS at build time by analyzing your generated HTML.

### Mechanism

1. **Render:** You generate your application's HTML string using `render()`.
2. **Analyze:** `uncss` takes that HTML and your full CSS file.
3. **Purge:** It uses `purgecss` to match selectors found in the HTML against the CSS.
4. **Minify:** It pipes the result through `clean-css`.
5. **Output:** You get a tiny CSS string containing *only* the styles actually used by your App Shell.

### Example Workflow (SAG/SSG)

```javascript
import { inline, render } from "valyrian.js/node";
import { App } from "./src/app";

async function buildProduction() {
  // 1. Render the App Shell to HTML
  const html = render(<App />);

  // 2. Read the massive CSS file (e.g., Tailwind or Bootstrap)
  const fullCss = fs.readFileSync("./src/global.css", "utf-8");

  // 3. Purge unused styles
  // Valyrian analyzes the 'html' string to find used classes
  const criticalCss = await inline.uncss([html], fullCss);

  // 4. Inject critical CSS directly into the HTML head
  // This eliminates the "Flash of Unstyled Content" (FOUC) and blocking network requests
  const finalHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${criticalCss}</style>
      </head>
      <body>${html}</body>
    </html>
  `;

  fs.writeFileSync("./dist/index.html", finalHtml);
}
```

This capability allows Valyrian-generated sites to achieve perfect **Lighthouse Performance Scores** by inlining the exact CSS needed for the initial paint, a technique usually reserved for complex configurations.
