# Appendix: Valyrian.js for Vue Developers

Vue developers can approach Valyrian.js through declarative views, named state operations and directives. The main shift is that Valyrian.js exposes the runtime path directly: a component renders, an event calls a function, state changes through its owner and the application updates.

## Mental Model Bridge

| If you reach for this in Vue | Start here in Valyrian.js |
| --- | --- |
| A template with directives | TSX with Valyrian directives such as `v-if`, `v-for`, `v-model`, `v-form` and `v-field`. |
| Reactive component state | Plain state, `createPulse`, `createPulseStore` or `FluxStore`. |
| Methods that mutate state | Named operations in a store or methods on the component owner. |
| Vue Router | `Router`, `router.add(...)`, `router.go(...)` and `mountRouter`. |
| Form bindings and validation | `v-model` for simple fields or `FormStore` with `v-form` and `v-field`. |

## Directive Continuity

Valyrian.js directives stay close to HTML and JavaScript:

```tsx
function TaskList({ store }) {
  return (
    <main>
      <button onclick={() => store.toggleDetails()}>Toggle details</button>
      <p v-if={store.state.showDetails}>Tasks stay in one shared PulseStore.</p>
      <ul v-for={store.state.tasks}>
        {(task) => <li key={task.id}>{task.title}</li>}
      </ul>
    </main>
  );
}
```

Observable result: the details paragraph appears only when `showDetails` is true, and every task keeps stable identity through `key`.

## Forms

Use `v-model` when a simple object owns the field. Use `FormStore` when the form needs schema validation, clean or format transforms, submission state and reusable behavior.

Taskboard introduces this path in [Stage 5](./taskboard-tutorial.md#stage-5-add-a-validated-form). For the full form contract, read [Forms](./4.3-forms.md).
