# API Reference Standard

Use this page when adding or rewriting public API reference entries. It turns the site reference pattern into a repo-level contract without requiring a full reference rewrite in one pass.

The reference should explain what a symbol lets the application do, where it comes from, what input it accepts, what Valyrian.js returns or changes, what errors or side effects matter and which guide or recipe demonstrates it in a complete flow.

## Entry Shape

Each public symbol should use this order when the information applies:

1. Purpose.
2. Import.
3. Signature.
4. Inputs.
5. Return value or state change.
6. Effects and runtime boundary.
7. Error behavior.
8. Observable result.
9. Related guide or recipe.

## Template

````md
### `symbolName(...)`

Purpose: use `symbolName` to [application responsibility].

Import:

```ts
import { symbolName } from "module-name";
```

Signature:

```ts
symbolName(input: InputType, options?: Options): ResultType
```

Inputs:

- `input`: describes the value the application passes.
- `options`: describes optional runtime behavior and defaults.

Return value: describes the value returned, or the state, DOM, storage, route, cache or worker state the API changes.

Effects: describes rendering, hydration, request isolation, event timing, storage, cache, queue or service worker behavior.

Errors: describes thrown errors, rejected promises, invalid runtime boundaries or unavailable browser/server features.

Observable result: names the behavior the developer can verify.

Related guide or recipe: link to the smallest complete flow.
````

## Example: `mount(dom, component)`

Purpose: use `mount` to attach one Valyrian.js component tree to a browser or server render target.

Import:

```ts
import { mount } from "valyrian.js";
```

Signature:

```ts
mount(dom: string | DomElement, component: ValyrianComponent | VnodeComponentInterface | any): string
```

Inputs:

- `dom`: a selector string or DOM element. In the browser, a string resolves through `document.querySelector(...)`. In Node.js, a string creates a fresh element for that mount call.
- `component`: a function component, POJO component, vnode component, class-style object with `view()` or a renderable value.

Return value: in the browser, `mount()` patches the target and returns `""`. In Node.js, it returns the generated HTML string.

Effects: the runtime hydrates the current container DOM into a vnode tree, sets the mounted app reference and runs the normal patch cycle.

Errors: a browser selector must resolve to an element before mounting can continue.

Observable result: the selected container displays the component output in the browser, or Node.js returns the rendered HTML string.

Related guide or recipe: [Getting Started](./2-getting-started.md), [Taskboard Stage 1](./taskboard-tutorial.md#stage-1-build-a-local-tsx-project) and [Vite Integration](./9.1-vite-integration.md).

## Migration Rule for Existing Reference Pages

When you touch an existing reference entry, update only the affected symbol unless the surrounding section already needs broader cleanup. Preserve published behavior and do not invent narrower TypeScript types than the package exposes.

Minimum viable improvement for an entry:

1. Add import and signature.
2. Name return value or state change.
3. Name one observable result.
4. Link one complete guide or recipe.
