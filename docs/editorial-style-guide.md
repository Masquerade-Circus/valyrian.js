# Editorial Style Guide

This guide defines the editorial voice for the official Valyrian.js documentation. It carries the voice of the published site into `docs/` so every page helps developers build one application that runs in the browser and Node.js.

Use this guide when writing introductions, tutorials, recipes, API reference pages, migration notes, framework comparisons, and README updates.

For the concrete public-symbol reference shape, use [API Reference Standard](./api-reference-standard.md) together with this guide.

## Voice Principle

Valyrian.js documentation should help developers build one application whose code can run in the browser and in Node.js.

The voice is direct, practical, and architectural. It explains what the developer does, what Valyrian.js does in each environment, what changes in the application, and what result the developer can observe.

Preferred sentence shape:

> Use [public API] to [application action]. The application then [observable behavior or runtime consequence].

Example:

> Use Request to load the tasks and Suspense to show the loading state, content, or error while the Tasks screen resolves.

## What the Voice Should Preserve

### 1. Same application, environment-specific result

Frame Valyrian.js as one application that can run in the browser and in Node.js. The browser mounts or hydrates DOM. Node.js renders HTML or request-scoped output.

Use language that keeps browser and Node.js work inside the same application:

- "the same application code in browser and Node.js"
- "two stages of the same application"
- "the same project"
- "the same component tree"
- "the browser mounts or hydrates DOM"
- "Node.js renders HTML"

Avoid language that splits the product into separate framework modes unless the page is explicitly comparing boundaries.

### Environment-specific APIs

When shared application code needs browser-only or Node.js-only APIs, show the branch with `isNodeJs` from `valyrian.js`.

Preferred:

> Use `isNodeJs` to keep browser-only code behind `!isNodeJs` and Node.js-only code behind `isNodeJs`, while the component stays part of the shared application.

Avoid:

> Move browser-only behavior into a separate client app.

### Repetition control

State the full product thesis in the README and introduction pages. A hub may repeat it once. A tutorial should demonstrate it through continuity between steps. A recipe should lead with the task and observable result. An API reference should lead with the public contract. Reuse the principle without repeating the same sentence across page types.

### 2. Visible execution

Explain behavior through traceable steps. A reader should be able to follow an event, request, state change, render, or hydration path without guessing what the runtime hides.

Strong verbs for this voice:

- mount
- render
- load
- hydrate
- trace
- preserve
- carry
- connect
- update
- resolve
- reject
- verify
- continue

Preferred framing:

> Each interaction has an identifiable entry point, and every update preserves a path that can be inspected.

Apply this principle when a page crosses runtime boundaries, but adapt the wording to the page type and avoid repeating the same product sentence.

### 3. Build by accumulation

Teach Valyrian.js as an accumulating project rather than scattered examples. The Taskboard pattern is the default tutorial shape: each stage starts from a known state, applies one meaningful capability, verifies a visible result, and points to the next stage.

Each cumulative tutorial stage should answer four questions:

1. What state does the reader start from?
2. What change does the reader apply?
3. What result can the reader observe?
4. What capability comes next?

Use these labels when a stage benefits from explicit structure:

- Starting state
- Applied change
- Observable result
- Next step

### 4. Practical architecture before abstraction

Explain concepts through the shape of the work. Start with the application responsibility, then name the Valyrian.js API that fits it.

Preferred:

> Use state held by an object or class component for self-contained interactions, `createPulse` for an independently reactive value and `createPulseStore` for a workflow with several fields and named operations.

Weaker:

> Valyrian.js has several state management options.

Use tables when they help the reader choose a starting point by responsibility:

| Application responsibility | Valyrian.js starting point |
| --- | --- |
| Navigation | Router |
| Requests and cached data | Request and Query |
| Forms and validation | `FormStore` |
| Offline and PWA behavior | Offline queue and service worker runtime |

### 5. Results should be observable

A recipe or tutorial should name the expected result. When a command, snippet, or page interaction matters, state what the developer sees or verifies.

Use result sentences like these:

- "Expected result: the text appears in the page body."
- "The browser displays Taskboard with one task from the initial state."
- "The route first shows Loading tasks and then the loaded Taskboard list."
- "A request to /profile through either adapter receives this HTML."

Do not leave a code sample without its success condition unless the surrounding section already states the result.

## Page Types

### README and introduction pages

Purpose: give the reader a fast first success, then show how the same application expands.

Use this order:

1. State the product in one sentence.
2. Name the continuity across browser and Node.js.
3. Give a first working render path.
4. Point to the recommended learning path.
5. Explain why the architecture reduces fragmentation.

The README should stay action-oriented. It should not become a full reference page.

### Taskboard tutorial pages

Purpose: make the official learning path cumulative.

Each Taskboard stage should include:

- A stage heading that starts with the stage number and the capability.
- A short body that names the capability and the file or screen it changes.
- Definitions for the starting state, applied change, observable result, and next step.
- File snapshots or focused diffs where the reader needs exact code.
- A run or verification step when the stage changes browser or Node.js behavior.

Write the Taskboard as one growing application. Reuse names, state shape, routes, files, and result language consistently across stages.

### Recipes

Purpose: complete one focused task with public APIs and a verifiable result.

Each recipe should include:

- A title that starts with the action.
- A one-sentence summary that names the task and the runtime boundary.
- A short API list.
- Numbered steps with commands or files when applicable.
- A result section that names what renders, builds, runs, hydrates, stores, rejects, or updates.
- A continue section that points to the related guide or reference.

Recipe titles should use imperative or action-first phrasing:

- "Render and hydrate one response"
- "Verify request-scoped server storage"
- "Integrate Valyrian.js with Vite"
- "Register and apply a service worker update"

### API reference pages

Purpose: explain a public symbol through its practical contract.

Each reference entry should answer:

1. What problem does this symbol solve?
2. Where does the developer import it from?
3. What does the developer pass in?
4. What does Valyrian.js return or change?
5. What behavior can the developer observe?
6. Which recipe or guide demonstrates it in a complete flow?

Prefer contract language over encyclopedic description. Name defaults, side effects, error behavior, and runtime boundaries when they affect real usage.

### Framework comparison appendices

Purpose: welcome developers from React, Vue, Svelte, and Solid through familiar concepts while keeping Valyrian.js distinct.

Start from what the audience already knows, then show the Valyrian.js starting point:

- React: TSX, functional components, composition, keys, component shape.
- Vue: declarative views, reactive state, named state operations.
- Svelte: direct state changes, compiled-style ergonomics, explicit runtime updates.
- Solid: fine-grained reactivity, signals, reactive reads, precise subscriptions.

Keep the bridge practical. The appendix should help the reader choose APIs and build the Taskboard, not argue about framework identity.

## Style Rules

### Use direct, active sentences

Good:

> The server and browser use the same state shape, and the button increments that state after hydration.

Avoid:

> The state shape is utilized by both server and browser and then incrementation is enabled after hydration.

### Name the actor when behavior matters

Good:

> `request.get` sets `Accept: application/json` by default, parses the response according to that header and rejects non-OK responses with an error.

Avoid:

> JSON is handled automatically and errors may be returned.

### Keep examples close to HTML and JavaScript

Valyrian.js should feel like a web-first runtime. Prefer examples that expose components, events, state, requests, and render targets directly.

### Use capability nouns consistently

Use these names consistently:

- Valyrian.js
- Taskboard
- Router
- Request
- Query
- Suspense
- FormStore
- Pulse
- PulseStore
- FluxStore
- ServerStorage
- service worker runtime
- offline queue
- automatic TSX runtime
- vnode
- hydration

### Prefer "guide", "recipe", "reference", and "stage"

Use these content terms with clear roles:

- A guide explains a capability and how the developer uses it.
- A recipe completes one focused task.
- A reference defines the contract of a public API.
- A stage extends the cumulative Taskboard tutorial.

## Patterns to Avoid

### Avoid vague benefit language

Avoid claims that do not connect to developer action:

- "powerful"
- "seamless"
- "next-generation"
- "magical"
- "easy to use" without proof

Replace vague benefits with observable consequences:

> Routing, data, state, forms, SSR, and offline support share components, functions, and named operations.

### Avoid hidden-magic framing

The site voice values explicit flow. Do not describe Valyrian.js as magic, invisible automation, or behavior the developer should not inspect.

Preferred:

> Clear ownership and named operations reduce implicit behavior.

### Avoid fragmented examples

Do not introduce throwaway mini-apps when a page can extend Taskboard or reuse the same application context. New examples are acceptable when a recipe needs a clean context, but they should still include imports, execution contract, and result.

### Avoid unsupported certainty

Marketing pages may be confident, but official docs should stay anchored to behavior the runtime provides. Do not add performance, compatibility, security, or ecosystem claims without evidence in the repo or existing official material.

## Editorial Checklist

Before publishing or changing a documentation page, verify that it satisfies the relevant items:

- The page names the application responsibility before introducing the API.
- The page shows that browser and Node.js can import the same application code when both runtimes appear.
- The page explains environment-specific APIs with `isNodeJs` when a shared example needs a guarded branch.
- Every tutorial or recipe has an observable result.
- Code samples use public APIs and include imports when the snippet needs to stand alone.
- The next step points to the related guide, recipe, reference, or Taskboard stage.
- Terminology matches the names in this guide.
- The prose uses direct verbs and visible actors.
- The page avoids unsupported claims and hidden-magic language.
- The page preserves Taskboard continuity when it belongs to the cumulative tutorial.

## Working Model for Future Documentation Work

When transferring material from the published site into `docs/`, use this sequence:

1. Identify the content type: guide, Taskboard stage, recipe, reference, or framework appendix.
2. Preserve the site's framing: same application in browser and Node.js, environment-specific result, visible execution and observable result.
3. Convert site-specific navigation into repo-relative links.
4. Keep code examples tied to public APIs and documented behavior.
5. Add the page to `docs/toc.md` and the README documentation list when it should be discoverable from the entry point.
