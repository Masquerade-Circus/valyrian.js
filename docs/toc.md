1. Introduction

* 1.1. What is Valyrian.js? (No-build, Runtime-First, Isomorphic).
* 1.2. Philosophy: Why modern development became too complex.
* 1.3. The Architecture: A diagram of the unified runtime (Client & Server).

2. Getting Started (The "No-Build" Approach)

* 2.1. The Browser Method (CDN):
  * Using ES Modules directly in HTML.
  * Example: import 'https://unpkg.com/valyrian.js'.
* 2.2. The Node.js Method (Built-in Tooling):
  * Installing via NPM (npm i valyrian.js).
  * Using the built-in inline utility to bundle JS/TS without Webpack/Vite.
  * Example: A simple build.js script using Valyrian's internal tools.

3. The Essentials (View & Interaction)

* 3.1. Hello World: Mounting your first VNode.
* 3.2. Components:
  * Functional Components (JSX/TSX).
  * POJO Components: The simplified object model & this binding.
* 3.3. Handling Events: Native Delegation strategy (onclick, oninput).
* 3.4. Basic Directives:
  * Structural: v-if, v-show.
  * Lists: v-for (The callback pattern).
  * Content: v-html, v-text.
* 3.5. Reactivity & Async Control:
  * The POJO Pattern: Event-driven updates.
  * Async Flows: Manual update() usage (Loading -> Wait -> Result).
* 3.6. Creating Custom Directives.
  * The directive interface.
  * Advanced: Directive Return Values.
  * Best Practices.

4. Building Single Page Applications (SPA)

* 4.1. Routing (valyrian.js/router):
  * Defining Routes & Navigation.
  * Parameters, Wildcards & Middlewares.
  * Using subrouters.
  * Redirects.
  * Handling errors.
  * v-route directive.
  * Best practices.
* 4.2. Data Fetching (valyrian.js/request):
  * Basic usage: get, post, put, delete.
  * Handling Headers & Auth Tokens.
  * Composing requests.
  * Allowed methods.
  * Using Suspense.
* 4.3. Local State & Lifecycle (valyrian.js/hooks):
  * useState, useEffect, useMemo, useRef, useCallback.
  * Custom hooks.
  * Lifecycle directives: v-create, v-update, v-cleanup, v-remove.
  * Best practices.

5. Advanced State Management

* 5.1. Choosing a Strategy (POJO vs Pulse vs Flux).
* 5.2. High-Performance Shared State (Pulses):
  * Fine-grained signals.
  * Direct DOM updates (skipping patch).
  * PulseStore: Reactive shared state.
  * Strict Immutability.
* 5.3. Structured State (FluxStore):
  * Mutations.
  * Actions.
  * Getters.
  * Modules.
  * Strict Immutability.
* 5.4. Debugging:
  * Connecting to Redux DevTools.

6. Optimization & Performance

* 6.1. Controlled Rendering (v-keep): Short-circuiting the Virtual DOM.
* 6.2. Forms & Two-way Binding (v-model).
* 6.3. Keyed Lists: Understanding the Hash Map reconciler.

7. The Full-Stack Capability (Isomorphism)

* 7.1. Server-Side Rendering (SSR):
  * Converting Components to HTML Strings (Node.js).
  * Concept: The Lightweight Server DOM vs JSDOM.
* 7.2. Isomorphic Networking:
  * Configuring Request: base, node, and api URLs.
  * Sharing Context between Client and Server.
* 7.3. Isomorphic Data (ServerStorage):
  * Request Isolation with AsyncLocalStorage.
  * Using sessionStorage on the backend securely.
* 7.4. Progressive Web Apps (PWA):
  * Using the built-in icons generator.
  * Registering Service Workers (valyrian.js/sw).
* 7.5. Bundling JavaScript & TypeScript
* 7.6. CSS Bundling and Minification
* 7.7. Removing Unused Styles

8. Utilities & Ecosystem

* 8.1. Internationalization (i18n) & Formatting.
* 8.2. Native Persistence (valyrian.js/native-store).
* 8.3. Helpers (deepFreeze, hasChanged).

9. Recipes & Integrations *TODO*

* 9.1. Client-Side Bundling (SPA/PWA):
  * Vite Integration (static PWA).
  * Webpack/Rspack.
* 9.2. Backend Integrations (SSR):
  * Express/Fastify Middleware.
  * Edge Deployment. (Cloudflare/Deno).

10. The Valyrian Meta-Framework (CLI & File-Based) *TODO*

* 10.1. The Valyrian CLI (create-valyrian).
* 10.2. File-System Routing convention.
* 10.3. Architecture: SSG (Content-First - Static Site Generator - tsx/md files).
* 10.4. Architecture: SAG (PWA/Shell-Only - Static App Generator - tsx/md files).
* 10.5. Architecture: FSA (PWA/Server - Full-Stack App - tsx/md/ts files).

11. Roadmap & Contribution *TODO*

* 11.1. Future plans.
* 11.2. Contributing.
