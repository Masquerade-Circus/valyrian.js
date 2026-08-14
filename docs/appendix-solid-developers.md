# Appendix: Valyrian.js for Solid Developers

Solid developers can approach Valyrian.js through precise reactive reads, TSX and small state primitives. The main shift is ownership: Valyrian.js lets you choose whether a value lives in a small pulse, a store with named operations, a component object or a request-scoped server boundary.

## Mental Model Bridge

| If you reach for this in Solid | Start here in Valyrian.js |
| --- | --- |
| TSX components | TSX components through `jsxImportSource: "valyrian.js"`. |
| Signals | `createPulse` for a small independently reactive value. |
| Stores | `createPulseStore` for grouped state and named pulse operations. |
| Fine-grained reads | Read the state surface that owns the value, such as `count()` or `store.state.count`. |
| Server request isolation | `NodeRuntime.run(...)` around the full request lifecycle. |

## Pulse Starting Point

Use `createPulse` when the application needs one small reactive value:

```tsx
import { createPulse } from "valyrian.js/pulses";

const [count, setCount] = createPulse(0);

function Counter() {
  return (
    <main>
      <span>{count()}</span>
      <button onclick={() => setCount((current) => current + 1)}>Increment</button>
    </main>
  );
}
```

Observable result: clicking Increment writes through the pulse setter and the rendered count reads the updated value.

## Store Starting Point

Use `createPulseStore` when a workflow needs named operations and several related fields. Taskboard uses this shape for tasks, details, loading state and later queue or worker status.

Continue with [Reactive Counter Variants](./9.8-reactive-counter-variants.md), then build the cumulative app in [Taskboard](./taskboard-tutorial.md).
