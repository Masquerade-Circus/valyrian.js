# 9. Recipes and Integrations (Hub)

Recipes complete one focused task with public Valyrian.js APIs and a result you can verify. Use them when you already understand the cumulative Taskboard tutorial and need a specific integration, browser/Node.js boundary or production check.

This chapter contains two tracks:

1. Integration and operations recipes (`9.1`-`9.6`).
2. Architecture reference patterns (`9.7`-`9.8`).

These recipes connect build tools, servers and backend services to Valyrian's documented browser and Node.js boundaries. Choose one integration at a time and verify its result before combining it with another.

Pick one recipe at a time. Keep the first integration path stable before combining strategies.

## Recipe Contract

Each official recipe should make this contract visible:

| Section | Purpose |
| --- | --- |
| Objective | The task the recipe completes. |
| Starting point | The application state, guide or file set you start from. |
| Files | The files the recipe creates or changes. |
| Run or verify | The commands or interaction that prove the path. |
| Observable result | The rendered, built, stored, rejected, hydrated or updated behavior you can inspect. |
| Continue | The guide, reference or Taskboard stage that extends the same capability. |

Recipes may compress these labels when the page is short, but the task, files, verification and result should stay explicit.

## Integration and Operations Recipes

## 9.1. Vite Integration (Client App)

* File: [./9.1-vite-integration.md](./9.1-vite-integration.md)
* Use this when you want Vite dev server, HMR, and a direct dev/build/preview verification loop.
* Observable result: the same `mount` entry renders in dev, production build and preview without JSX transform errors.

## 9.2. Webpack/Rspack Integration

* File: [./9.2-webpack-rspack-integration.md](./9.2-webpack-rspack-integration.md)
* Use this when your organization standardizes on Webpack or Rspack and you need explicit TSX transform control.
* Observable result: the selected bundler serves and builds the same TSX entry with `valyrian.js` as the automatic runtime import source.

## 9.3. Express/Fastify SSR

* File: [./9.3-express-fastify-ssr.md](./9.3-express-fastify-ssr.md)
* End-to-end SSR recipe with request-scoped isolation and hydration continuity.
* Observable result: each HTTP request receives route HTML produced inside its own `ServerStorage.run(...)` boundary and hydrates with the serialized response state.

## 9.4. API Client Composition

* File: [./9.4-api-client-composition.md](./9.4-api-client-composition.md)
* Shows how to structure per-domain request clients.
* Observable result: `authApi`, `usersApi` and `billingApi` inherit root options and the root plugin can be ejected through `destroy()`.

## 9.5. Offline-First Commands

* File: [./9.5-offline-first-commands.md](./9.5-offline-first-commands.md)
* Practical mutation queueing and retry flows for flaky networks.
* Observable result: queue state exposes `pending`, `failed` and `syncing`, and failed operations can be retried or discarded.

## 9.6. Production Checklist

* File: [./9.6-production-checklist.md](./9.6-production-checklist.md)
* Pre-release checks to validate documented behavior and documentation alignment.
* Observable result: each release capability has a recorded success or failure path before shipping.

## Architecture Reference Patterns

## 9.7. Counter Variants by Component Shape

* File: [./9.7-counter-variants-by-component-shape.md](./9.7-counter-variants-by-component-shape.md)
* Exhaustive shared and per-instance counter variants.
* Observable result: each shape increments through the same delegated event and update path while preserving either shared or per-instance state ownership.

## 9.8. Reactive Counter Variants

* File: [./9.8-reactive-counter-variants.md](./9.8-reactive-counter-variants.md)
* Equivalent counter variants with `createPulse`, `createPulseStore`, and `FluxStore`.
* Observable result: each reactive state option updates the rendered count through its own public write surface.

## Suggested Reading Order

1. Choose your build or SSR integration path first (`9.1`, `9.2`, or `9.3`).
   Pick one bundler path first; do not optimize both in parallel on day one.
2. Add reliability patterns (`9.4`, `9.5`).
3. Run the release checks in `9.6`.
4. Use `9.7` and `9.8` as architecture reference patterns.

If you need opinionated generators, file-based routing conventions, or scaffolded app shells, treat those as downstream tooling concerns rather than the core responsibility of this repo.
