# 7. Browser/Server Runtime Model in Practice

Valyrian's full-stack story is the same runtime model expressed across browser and server, not a collection of optional extras.

SSR, hydration, request-scoped context, and isomorphic networking all extend the same explicit runtime behavior and deterministic update model described in the core chapters.

If you are new to server rendering, start with one SSR render path first, then add request isolation and networking continuity, then layer PWA tooling after the runtime flow is stable.

This chapter is a hub split into focused pages:

## 7.1. Server-Side Rendering

* File: [./7.1-ssr.md](./7.1-ssr.md)
* Covers the server-side expression of the same runtime model, including SSR render flow and browser hydration.

### 7.1.1. Node Runtime APIs

* File: [./7.1.1-node-runtime-apis.md](./7.1.1-node-runtime-apis.md)
* Covers the Node server runtime surface: `render`, DOM setup, request-scoped storage, and runtime-side exports.

## 7.2. Isomorphic Networking and Storage

* File: [./7.2-isomorphic-networking-and-storage.md](./7.2-isomorphic-networking-and-storage.md)
* Covers runtime continuity for network calls plus request-scoped storage isolation with `ServerStorage`.

## 7.3. PWA and Build Tooling

* File: [./7.3-pwa-and-build-tooling.md](./7.3-pwa-and-build-tooling.md)
* Covers icons, service worker file generation, JS/CSS bundling, and `inline.uncss`.

### 7.3.1. Service Worker Runtime

* File: [./7.3.1-sw-runtime.md](./7.3.1-sw-runtime.md)
* Covers `SwRuntimeManager`, update strategies, lifecycle events, and update application.

## 7.4. Server Execution Context

* File: [./7.4-server-context.md](./7.4-server-context.md)
* Covers request-scoped server context and how core modules keep per-request runtime behavior isolated in Node.js.

## Read This If You Are Starting SSR

1. Start with [./7.1-ssr.md](./7.1-ssr.md).
2. Use [./7.1.1-node-runtime-apis.md](./7.1.1-node-runtime-apis.md) for the Node server runtime surface.
3. Configure request URL rewriting and storage isolation with [./7.2-isomorphic-networking-and-storage.md](./7.2-isomorphic-networking-and-storage.md).
4. Review request-scoped context behavior with [./7.4-server-context.md](./7.4-server-context.md).
5. Add PWA/build tooling and service worker runtime only after the browser/server runtime flow is stable.
