# Appendix: Valyrian.js for React Developers

React developers can start with familiar TSX, functional components, composition and keys. In Valyrian, delegated events update the mounted application, Pulses subscribe rendered reads precisely, and the same components can render in Node.js for SSR before the browser hydrates them.

## Mental Model Bridge

| If you reach for this in React | Start here in Valyrian.js |
| --- | --- |
| A function component that returns JSX | A function component that returns TSX through `valyrian.js` automatic runtime. |
| `props` and composition | Plain function parameters and nested TSX children. |
| `key` for list identity | `key` as structural vnode data. |
| A local state hook | An object, class component, `createPulse` or `createPulseStore`, depending on ownership. |
| React Router | `Router`, route handlers and `mountRouter`. |
| Server render plus hydration | `render`, `ServerStorage.run(...)` and browser `mount` or `mountRouter`. |

## First Taskboard Step

Use the same automatic TSX settings you already expect from JSX tooling:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "valyrian.js"
  }
}
```

Then mount a component directly:

```tsx
import { mount } from "valyrian.js";

function App() {
  return <main>Hello from Valyrian.js</main>;
}

mount("body", App);
```

Observable result: the browser renders the component in `body`. From there, [Taskboard Stage 1](./taskboard-tutorial.md#stage-1-build-a-local-tsx-project) turns the same shape into a local TSX project.

## State and Updates

Valyrian.js lets small state stay close to JavaScript. Use the smallest state owner that matches the application responsibility:

- Use a plain object or class component for self-contained interaction.
- Use `createPulse` for one independently reactive value.
- Use `createPulseStore` when the state has several fields and named operations.
- Use `FluxStore` when the workflow fits explicit commits and modules.

In Taskboard, `createPulseStore` becomes useful when interactions, routing, async loading and forms need the same state object.

Continue with [Taskboard Stage 2](./taskboard-tutorial.md#stage-2-add-interaction-with-pulsestore) and [Reactive Counter Variants](./9.8-reactive-counter-variants.md).
