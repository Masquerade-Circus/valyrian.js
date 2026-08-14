# Appendix: Valyrian.js for Svelte Developers

Svelte developers can start from direct state changes and compact component code. Valyrian.js keeps that directness while making the runtime update path explicit: delegated events, state owners and manual or store-driven updates remain inspectable.

## Mental Model Bridge

| If you reach for this in Svelte | Start here in Valyrian.js |
| --- | --- |
| A component that returns markup | A TSX component that returns Valyrian.js vnodes. |
| Direct assignment for local state | Plain object or class state when the interaction is local. |
| Stores for shared state | `createPulse`, `createPulseStore` or `FluxStore`. |
| `{#if}` and `{#each}` | `v-if` and `v-for`. |
| SSR output and browser hydration | `render`, `NodeRuntime.run(...)` and `mount` or `mountRouter`. |

## Direct Interaction First

For small local interactions, keep the state owner obvious:

```tsx
const Counter = {
  count: 0,
  view() {
    return (
      <main>
        <span>{Counter.count}</span>
        <button onclick={() => Counter.count++}>Increment</button>
      </main>
    );
  }
};
```

Observable result: clicking the delegated button changes the value read by the view on the next update pass.

## When the App Grows

Move from direct local state to a named state owner when more screens need the same workflow. Taskboard uses `createPulseStore` when interaction, routing, Request, Suspense and FormStore all need the same task state.

Continue with [Counter Variants](./9.7-counter-variants-by-component-shape.md), then follow [Taskboard Stage 2](./taskboard-tutorial.md#stage-2-add-interaction-with-pulsestore).
