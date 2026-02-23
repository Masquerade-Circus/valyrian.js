# 7. The Full-Stack Capability (Isomorphism Hub)

Valyrian can run with one mental model across browser and server runtimes.

If you are new to SSR, do not start with all features at once. Ship a minimal render first, then add networking/storage, then PWA tooling.

This chapter is a hub split into focused pages:

## 7.1. Server-Side Rendering

* File: [./7-ssr.md](./7-ssr.md)
* Covers SSR render flow and browser hydration behavior.

### 7.1.1. Node Runtime APIs

* File: [./7-node-runtime-apis.md](./7-node-runtime-apis.md)
* Covers `render`, DOM utilities, runtime side effects, and node exports.

## 7.2. Isomorphic Networking and Storage

* File: [./7-isomorphic-networking-and-storage.md](./7-isomorphic-networking-and-storage.md)
* Covers environment-aware request URLs and request-scoped storage with `ServerStorage`.

## 7.3. PWA and Build Tooling

* File: [./7-pwa-and-build-tooling.md](./7-pwa-and-build-tooling.md)
* Covers icons, service worker file generation, JS/CSS bundling, and `inline.uncss`.

### 7.3.1. Service Worker Runtime

* File: [./7-sw-runtime.md](./7-sw-runtime.md)
* Covers `SwRuntimeManager`, update strategies, lifecycle events, and update application.

## Read This If You Are Starting SSR

1. Start with [./7-ssr.md](./7-ssr.md).
2. Use [./7-node-runtime-apis.md](./7-node-runtime-apis.md) for runtime-level server APIs.
3. Configure request URL rewriting and storage isolation with [./7-isomorphic-networking-and-storage.md](./7-isomorphic-networking-and-storage.md).
4. Add PWA/build tooling and service worker runtime only after SSR flow is stable.
