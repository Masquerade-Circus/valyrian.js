# Taskboard Tutorial: One Application, Seven Stages

Taskboard is the official cumulative tutorial for Valyrian.js. It starts with one browser render and keeps extending the same application code through interaction, routing, data loading, forms, SSR, hydration, offline work and PWA updates.

Use this route after [Getting Started](./2-getting-started.md). Each stage preserves the same project, state shape and application name so you can observe how the browser mounts or hydrates DOM and how Node.js renders HTML from the same application.

## Stage Contract

Every stage uses the same contract:

| Label | What it answers |
| --- | --- |
| Starting state | The exact application state you already have. |
| Applied change | The public APIs and files you add or change. |
| Observable result | The behavior you can see in the browser, server response or generated assets. |
| Next step | The capability that builds on this stage. |

## Project Baseline

The tutorial uses this local project shape:

```text
valyrian-taskboard/
  build.mjs
  package.json
  public/
  src/
    app.tsx
    client-entry.tsx
    state.ts
    taskboard.ts
```

Run the browser stages with this loop:

```bash
npm install valyrian.js@9.1.13 @types/node@20.19.25
node build.mjs
npx --yes serve@14.2.5 public --listen 8000
```

Expected result: opening `http://localhost:8000` shows the current Taskboard screen.

## Stage 1. Build a Local TSX Project

Starting state: you have an empty local folder.

Applied change: create a TSX and ESM browser project, configure the automatic TSX runtime and mount `TaskboardApp` with serializable state.

Files:

- `package.json` installs `valyrian.js` and `@types/node`.
- `tsconfig.json` sets `jsx` to `react-jsx` and `jsxImportSource` to `valyrian.js`.
- `build.mjs` uses `inline` from `valyrian.js/node` and writes `public/client-entry.js`.
- `public/index.html` loads the generated browser bundle.
- `src/state.ts` creates the first `TaskboardState` object.
- `src/app.tsx` renders the first screen.
- `src/client-entry.tsx` mounts the app in `body`.

Core files:

Create `package.json`:

```json
{
  "type": "module",
  "scripts": {
    "build": "node build.mjs",
    "serve": "npx --yes serve@14.2.5 public --listen 8000"
  },
  "dependencies": {
    "@types/node": "20.19.25",
    "valyrian.js": "9.1.13"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "valyrian.js"
  }
}
```

```javascript
// build.mjs
import fs from "node:fs";
import path from "node:path";
import { inline } from "valyrian.js/node";

const outputDir = "./public";

async function build() {
  fs.mkdirSync(outputDir, { recursive: true });

  const result = await inline("./src/client-entry.tsx", {
    compact: true
  });

  fs.writeFileSync(path.join(outputDir, "client-entry.js"), result.raw);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

```html
<!-- public/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Valyrian Taskboard</title>
  </head>
  <body>
    <script src="./client-entry.js"></script>
  </body>
</html>
```

```tsx
// src/state.ts
export type Task = { id: number; title: string };

export type TaskboardState = {
  tasks: Task[];
  showDetails: boolean;
  nextId: number;
  loaded: boolean;
};

export function createState(initial: Partial<TaskboardState> = {}): TaskboardState {
  return {
    tasks: initial.tasks ?? [{ id: 1, title: "Learn Valyrian.js" }],
    showDetails: initial.showDetails ?? false,
    nextId: initial.nextId ?? 2,
    loaded: initial.loaded ?? false
  };
}
```

```tsx
// src/app.tsx
import type { TaskboardState } from "./state";

export function TaskboardApp({ state }: { state: TaskboardState }) {
  return (
    <main style="font-family: sans-serif; padding: 2rem;">
      <h1>Taskboard</h1>
      <ul>
        {state.tasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
    </main>
  );
}
```

```tsx
// src/client-entry.tsx
import { mount } from "valyrian.js";
import { TaskboardApp } from "./app";
import { createState } from "./state";

const state = createState();
mount("body", <TaskboardApp state={state} />);
```

Observable result: the browser displays `Taskboard` with one task from the initial state.

Next step: add interaction while keeping the same mounted application.

## Stage 2. Add Interaction with PulseStore

Starting state: Stage 1 renders Taskboard from a plain `TaskboardState` object.

Applied change: replace the plain state instance with `createPulseStore`, then handle delegated clicks through named operations.

Files changed:

- `src/state.ts` exports `createTaskboardStore`.
- `src/app.tsx` reads `store.state` and calls `store.toggleDetails()` and `store.addTask(...)`.
- `src/client-entry.tsx` creates one store instance and passes it to the component.

Core flow:

```tsx
import { createPulseStore } from "valyrian.js/pulses";

export function createTaskboardStore(initial: Partial<TaskboardState> = {}) {
  return createPulseStore(
    {
      tasks: initial.tasks ?? [{ id: 1, title: "Learn Valyrian.js" }],
      showDetails: initial.showDetails ?? false,
      nextId: initial.nextId ?? 2,
      loaded: initial.loaded ?? false
    },
    {
      toggleDetails(state) {
        state.showDetails = !state.showDetails;
      },
      addTask(state, task: Task) {
        state.tasks.push(task);
        state.nextId = Math.max(state.nextId, task.id + 1);
      },
      replaceTasks(state, tasks: Task[]) {
        state.tasks = tasks;
        state.loaded = true;
        state.nextId = tasks.reduce((nextId, task) => Math.max(nextId, task.id + 1), 1);
      }
    }
  );
}
```

Observable result: `Toggle details` changes the `v-if` paragraph, and `Add task` appends the next keyed `v-for` item.

Next step: keep the same store while adding routes.

## Stage 3. Add Routing

Starting state: Stage 2 keeps interaction and task state in one `TaskboardStore`.

Applied change: create a `Router`, register Tasks and About routes, create the store and router once in `createTaskboardApp`, then mount the router on `body`.

Files changed:

- `src/router.tsx` creates the route registry.
- `src/taskboard.ts` creates the shared store and router.
- `src/client-entry.tsx` switches from `mount` to `mountRouter`.

Core flow:

```tsx
import { Router } from "valyrian.js/router";
import { TaskboardApp } from "./app";

export function createRouter(store: TaskboardStore) {
  const router = new Router();
  router.add("/", () => (
    <>
      <button onclick={() => router.go("/about")}>About</button>
      <TaskboardApp store={store} />
    </>
  ));
  router.add("/about", () => (
    <main>
      <h1>About Taskboard</h1>
      <button onclick={() => router.go("/")}>Tasks</button>
    </main>
  ));
  router.catch(404, () => <h1>Taskboard page not found</h1>);
  return router;
}
```

Observable result: the Tasks and About buttons change screens while the task state remains available through the same store.

Next step: load the Tasks screen asynchronously.

## Stage 4. Load Asynchronous Task Data

Starting state: Stage 3 renders the `/` route from the shared store.

Applied change: move the route body to `TasksScreen`, load `/tasks.json` once with `request.get`, then render through `Suspense` while the request resolves.

Files changed:

- `public/tasks.json` supplies initial data.
- `src/tasks-screen.tsx` coordinates `Request`, `Suspense` and `TaskboardStore`.
- `src/router.tsx` renders `TasksScreen` at `/`.

Core flow:

```tsx
import { request } from "valyrian.js/request";
import { Suspense } from "valyrian.js/suspense";

async function LoadedTasks({ store }: { store: TaskboardStore }) {
  if (store.state.loaded === false) {
    const tasks = (await request.get("/tasks.json")) as Task[];
    store.replaceTasks(tasks);
  }
  return <TaskboardApp store={store} />;
}

export function TasksScreen({ store }: { store: TaskboardStore }) {
  if (store.state.loaded) {
    return <TaskboardApp store={store} />;
  }

  return (
    <Suspense suspenseKey="taskboard:tasks" fallback={<p>Loading tasks...</p>} error={(error) => <p>{String(error)}</p>}>
      <LoadedTasks store={store} />
    </Suspense>
  );
}
```

Observable result: the route first shows `Loading tasks...` and then the parsed Taskboard list. If the request rejects, `Suspense` renders its error branch.

Next step: add a validated form to the loaded Tasks screen.

## Stage 5. Add a Validated Form

Starting state: Stage 4 loads initial tasks through `Request` and `Suspense`.

Applied change: create a local `FormStore`, bind it with `v-form` and `v-field`, then add valid submissions to `TaskboardStore` from `onSubmit`.

Files changed:

- `src/task-form.tsx` creates the form and renders its validation state.
- `src/app.tsx` includes `TaskForm`.
- `src/taskboard.ts` creates one form instance for the application.

Core flow:

```tsx
import { FormStore } from "valyrian.js/forms";

export function createTaskForm(store: TaskboardStore) {
  return new FormStore({
    state: { title: "" },
    schema: {
      type: "object",
      required: ["title"],
      properties: { title: { type: "string", minLength: 2 } }
    },
    clean: { title: (value) => String(value).trim() },
    onSubmit: async ({ title }) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (title === "fail") {
        throw new Error("Local FormStore submission failed");
      }
      store.addTask({ id: store.state.nextId, title });
    }
  });
}
```

Observable result: a one-character title fills `validationErrors`, a valid title shows `isInflight` during submit and then appears in the task list, and the reserved title `fail` renders `submitError`.

Next step: render the routed application for each server request.

## Stage 6. Add Runtime SSR and Hydration

Starting state: Stage 5 has shared state, routes, async initial data and a local validated form.

Applied change: create a Node.js server that opens a fresh application for each request, loads initial tasks, resolves `request.url` through `router.go()` and renders a full TSX document inside `NodeRuntime.run()`.

Files changed:

- `src/server.tsx` handles assets and SSR responses.
- `build.mjs` writes both `dist/server.mjs` and `public/client-entry.js`.
- `src/client-entry.tsx` reads the serialized state from `body` and hydrates the router.
- `package.json` adds `start` for the generated server.

Run and verify:

```bash
node build.mjs
npm start
```

Open `http://127.0.0.1:3000/` and `http://127.0.0.1:3000/about`.

Observable result: each response contains the route HTML and its own initial state. In the browser, `mountRouter` hydrates that response and connects `Toggle details`, About navigation and the form.

The same Taskboard application now has two runtime results: Node.js renders the HTML response, and the browser hydrates that response into interactive DOM.

Next step: add local offline delivery and a service worker update flow.

## Stage 7. Add Local Offline Delivery and PWA Updates

Starting state: Stage 6 hydrates the SSR response with routes, `FormStore` and `PulseStore`.

Applied change: keep browser-only managers inactive during the initial server and browser render, then start them after hydration with `runtime.init()`.

Files changed:

- `build.mjs` generates icons and `public/sw.js` with `icons()` and `sw()`.
- `src/offline.ts` creates `NetworkManager`, `OfflineQueue` and `SwRuntimeManager`.
- `src/state.ts` adds network, queue and worker status fields.
- `src/app.tsx` renders queue, network and worker controls.
- `src/client-entry.tsx` hydrates first, then calls `app.runtime.init()`.

Observable flows:

1. `FormStore` passes a title to `enqueueTask`, `OfflineQueue` stores a local `create-task` operation, and `sync()` runs the handler while `NetworkManager` reports online.
2. `queue.state()` supplies `pending`, `failed` and `syncing`, and queue events publish `sync success` or `sync error` to the view.
3. `Create failed task`, `Retry failed task` and `Discard failed task` show the failed-operation lifecycle.
4. `SwRuntimeManager` reports registration, available update, completed update or failure. When an update is available, Taskboard shows `Apply update`.

Run and verify:

```bash
node build.mjs
npm start
```

Expected result: the SSR server serves the Taskboard document, generated manifest, icons, client bundle and worker. After hydration, queue actions, network changes and worker events update the same Taskboard view.

## Continue

- Use [Recipes and Integrations](./9-recipes-and-integrations.md) when you want a focused task outside the cumulative tutorial.
- Use [Runtime Core API](./3.1-runtime-core.md) to inspect the mount, update, lifecycle and hydration contracts behind these stages.
- Use [Run the Same Application in Browser and Node.js](./7-full-stack-capability.md) when you want the server-side path in more depth.
