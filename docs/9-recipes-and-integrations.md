# 9. Recipes and Integrations (Hub)

This chapter contains two tracks:

1. Integration and operations recipes (`9.1`-`9.6`).
2. Architecture reference patterns (`9.7`-`9.8`).

Pick one recipe at a time. Keep the first integration path stable before combining strategies.

## Integration and Operations Recipes

## 9.1. Vite Integration (Client App)

* File: [./9.1-vite-integration.md](./9.1-vite-integration.md)
* Use this when you want Vite dev server, HMR, and a direct dev/build/preview verification loop.

## 9.2. Webpack/Rspack Integration

* File: [./9.2-webpack-rspack-integration.md](./9.2-webpack-rspack-integration.md)
* Use this when your organization standardizes on Webpack or Rspack and you need explicit TSX transform control.

## 9.3. Express/Fastify SSR

* File: [./9.3-express-fastify-ssr.md](./9.3-express-fastify-ssr.md)
* End-to-end SSR recipe with request-scoped isolation and hydration continuity.

## 9.4. API Client Composition

* File: [./9.4-api-client-composition.md](./9.4-api-client-composition.md)
* Shows how to structure per-domain request clients.

## 9.5. Offline-First Commands

* File: [./9.5-offline-first-commands.md](./9.5-offline-first-commands.md)
* Practical mutation queueing and retry flows for flaky networks.

## 9.6. Production Checklist

* File: [./9.6-production-checklist.md](./9.6-production-checklist.md)
* Pre-release checks to validate runtime behavior and docs/runtime alignment.

## Architecture Reference Patterns

## 9.7. Counter Variants by Component Shape

* File: [./9.7-counter-variants-by-component-shape.md](./9.7-counter-variants-by-component-shape.md)
* Exhaustive shared and per-instance counter variants.

## 9.8. Reactive Counter Variants

* File: [./9.8-reactive-counter-variants.md](./9.8-reactive-counter-variants.md)
* Equivalent counter variants with `createPulse`, `createPulseStore`, and `FluxStore`.

## Suggested Reading Order

1. Choose your build/runtime integration path first (`9.1`, `9.2`, or `9.3`).
   Pick one bundler path first; do not optimize both in parallel on day one.
2. Add reliability patterns (`9.4`, `9.5`).
3. Run the release checks in `9.6`.
4. Use `9.7` and `9.8` as architecture reference patterns.
