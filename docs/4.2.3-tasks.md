# 4.2.3. Tasks (`valyrian.js/tasks`)

`Task` wraps async operations with strategy control, cancellation, and event subscriptions.

## Quick Start

```ts
import { Task } from "valyrian.js/tasks";

const saveTask = new Task(
  async (payload: { name: string }, { signal }) => request.put("/api/profile", payload, { signal }),
  { strategy: "takeLatest" }
);

await saveTask.run({ name: "Arya" });
```

## Task State

`task.state` returns a frozen snapshot:

* `status`: `idle | running | success | error | cancelled`
* `running`: boolean
* `result`: last successful result or `null`
* `error`: last error or `null`

Helpers:

* `task.data()`
* `task.error()`

## Strategies

* `takeLatest` (default): starts latest run and ignores stale previous completion.
* `enqueue`: serializes runs in order.
* `drop`: if already running, returns current result without starting a new run.
* `restartable`: aborts previous run and starts a new one.

Reader hint: for UI actions, `takeLatest` is usually the safest default.

## Events and Callbacks

Runtime events:

* `state`
* `success`
* `error`
* `cancel`

```ts
const offState = saveTask.on("state", (state) => console.log(state.status));
const offCancel = saveTask.on("cancel", (args) => console.log("cancelled", args));
```

Options callbacks:

* `onSuccess(result, args)`
* `onError(error, args)`

## Cancel and Reset

* `cancel()` aborts current execution and sets state to `cancelled`.
* `reset()` cancels and returns state to `idle` with `result/error` cleared.

When cancellation wins, the run resolves with the previous result (`null` if none), not with a thrown abort error.

For `drop`, repeated calls while running resolve immediately with the current stored result.
