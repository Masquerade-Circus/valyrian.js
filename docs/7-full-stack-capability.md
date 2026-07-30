# 7. Run the Same Application in Browser and Node.js

Valyrian lets the browser and Node.js import the same application code. The browser mounts or hydrates DOM, Node.js renders HTML for responses, and request-scoped context keeps concurrent server work isolated.

If you are new to server rendering, start with one SSR render path first. Then add request isolation, networking continuity and guarded environment-specific APIs before layering PWA tooling.

This chapter is a hub split into focused pages:

## 7.1. Server-Side Rendering

* File: [./7.1-ssr.md](./7.1-ssr.md)
* Covers HTML generation, escaping, route resolution, browser hydration and `isNodeJs` guards inside shared application code.

### 7.1.1. Node.js Runtime APIs

* File: [./7.1.1-node-runtime-apis.md](./7.1.1-node-runtime-apis.md)
* Covers the Node.js API surface: `render`, DOM setup, request-scoped storage, and server-side exports.

## 7.2. Isomorphic Networking and Storage

* File: [./7.2-isomorphic-networking-and-storage.md](./7.2-isomorphic-networking-and-storage.md)
* Covers shared request APIs and request-scoped storage isolation with `ServerStorage`.

## 7.3. PWA and Build Tooling

* File: [./7.3-pwa-and-build-tooling.md](./7.3-pwa-and-build-tooling.md)
* Covers icons, service worker file generation, JS/CSS bundling, and `inline.uncss`.

### 7.3.1. Service Worker Runtime

* File: [./7.3.1-sw-runtime.md](./7.3.1-sw-runtime.md)
* Covers `SwRuntimeManager`, update strategies, lifecycle events, and update application.

## 7.4. Server Execution Context

* File: [./7.4-server-context.md](./7.4-server-context.md)
* Covers request-scoped server context and how core modules keep per-request data isolated in Node.js.

## Read This If You Are Starting SSR

1. Start with [./7.1-ssr.md](./7.1-ssr.md).
2. Use [./7.1.1-node-runtime-apis.md](./7.1.1-node-runtime-apis.md) for the Node.js runtime surface.
3. Configure request URL rewriting and storage isolation with [./7.2-isomorphic-networking-and-storage.md](./7.2-isomorphic-networking-and-storage.md).
4. Review request-scoped context behavior with [./7.4-server-context.md](./7.4-server-context.md).
5. Add PWA/build tooling and service worker APIs only after the browser/Node.js flow is stable.
