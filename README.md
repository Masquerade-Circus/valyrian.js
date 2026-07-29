<div style="text-align: center" align="center">

<img src="assets/logo.png" style="width: 60%"/>

<p>

[![npm version](https://img.shields.io/npm/v/valyrian.js)](https://npmjs.org/package/valyrian.js "View this project on npm")
![node-current](https://img.shields.io/node/v/valyrian.js)
[![ES version](https://badgen.net/badge/ES/latest/cyan)](https://tc39.es/ecma262/)
![](https://badgen.net/npm/types/valyrian.js)
[![License](https://img.shields.io/github/license/masquerade-circus/valyrian.js.svg)](https://github.com/masquerade-circus/valyrian.js/blob/main/LICENSE)

[![Minified size](assets/badges/size-min.svg)](dist/index.min.js)
[![Gzip size](assets/badges/size-gzip.svg)](dist/index.min.js)
[![Brotli size](assets/badges/size-brotli.svg)](dist/index.min.js)

[![Test](https://github.com/Masquerade-Circus/valyrian.js/actions/workflows/test.yml/badge.svg)](https://github.com/Masquerade-Circus/valyrian.js/actions/workflows/test.yml)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/valyrian.js)
[![CodeQL](https://github.com/Masquerade-Circus/valyrian.js/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/Masquerade-Circus/valyrian.js/actions/workflows/codeql-analysis.yml)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/8d5204c73bdc42089e4cebdb4b4d43e0)](https://www.codacy.com/gh/Masquerade-Circus/valyrian.js/dashboard?utm_source=github.com&utm_medium=referral&utm_content=Masquerade-Circus/valyrian.js&utm_campaign=Badge_Grade)

![](https://img.shields.io/github/issues/masquerade-circus/valyrian.js.svg)
[![Coverage](assets/badges/coverage.svg)](https://github.com/Masquerade-Circus/valyrian.js/actions/workflows/test.yml)

</p>

</div>

# Valyrian.js

An isomorphic runtime framework for web apps.

Valyrian.js gives you one runtime model across browser and server so the way you render, update, route, fetch, validate, hydrate and continue offline stays consistent as your app expands.

Valyrian.js is intentionally integrated: the same isomorphic runtime can grow from browser UI into complete app flows, with fewer external app-runtime pieces to assemble around the core.

It is for teams that want explicit runtime behavior, deterministic updates, JSX/TSX authoring, and SSR without splitting their app into disconnected client and server mental models.

Here, "isomorphic" means the browser runtime and server runtime follow the same model. SSR, hydration, request isolation, routing, data loading, forms, offline queues and Node runtime APIs are extensions of the same web-first system.

## Table of Contents

- [Quick Start](#quick-start)
  - [Browser (CDN)](#browser-cdn)
  - [Node (npm)](#node-npm)
- [Choose Your Path](#choose-your-path)
- [First 5 Minutes (Recommended)](#first-5-minutes-recommended)
- [Official Learning Route](#official-learning-route)
- [Documentation](#documentation)
- [Why Valyrian.js](#why-valyrianjs)
- [Testing Philosophy](#testing-philosophy)
- [Tests](#tests-framework-repository)
- [More Guides](#more-guides)
- [Contributing](#contributing)
- [Legal](#legal)

## Quick Start

Get a working screen first. Start with the CDN path to prove the mount-and-render path in the browser before expanding into Node tooling or SSR.

### Browser (CDN)

```html
<script type="module">
  import "https://unpkg.com/valyrian.js";

  const { mount } = Valyrian;

  function App() {
    return "Hello from Valyrian.js";
  }

  mount("body", App);
</script>
```

Expected result: the text appears in the page body.

This snippet proves the runtime can mount component output into a root. `docs/2-getting-started.md` starts from this same example, then expands it into explicit VNodes and local TSX/JSX tooling.

### Node (npm)

```bash
npm install valyrian.js
```

Then follow [docs/2-getting-started.md](docs/2-getting-started.md) for the `inline` build flow and the automatic TSX runtime setup (`jsx: "react-jsx"` + `jsxImportSource: "valyrian.js"`).

### Runtime authoring surfaces

- `v(...)` and the automatic TSX runtime are both first-class vnode authoring surfaces.
- `Fragment` in the automatic runtime is the shared fragment sentinel, expanded later by the runtime instead of becoming a special vnode kind.
- `key` is structural vnode data (`vnode.key`), not component props.
- `flatTree()` remains the runtime step that expands fragments/components and flattens nested children.
- `trust()` keeps the same raw-HTML model in this phase.

## Choose Your Path

- **Try it now (no install):** use the CDN snippet above.
- **Understand the same example in more detail:** read [docs/1-introduction.md](docs/1-introduction.md), then continue with [docs/2-getting-started.md](docs/2-getting-started.md).
- **Build the official cumulative application:** after Getting Started, follow [docs/taskboard-tutorial.md](docs/taskboard-tutorial.md).
- **Add local TSX/JSX tooling in Node:** continue with [docs/2-getting-started.md](docs/2-getting-started.md) (Node path, automatic TSX runtime).
- **Expand the same model to SSR and request-scoped runtime behavior:** complete chapters 1-3, then go to [docs/7-full-stack-capability.md](docs/7-full-stack-capability.md).

## First 5 Minutes (Recommended)

1. Copy the CDN snippet into an `index.html` file.
2. Open it in your browser and confirm the UI renders.
3. Read [docs/1-introduction.md](docs/1-introduction.md) for the browser/server mental model behind that snippet.
4. Continue with [docs/2-getting-started.md](docs/2-getting-started.md) to expand the same example.
5. Continue with [docs/taskboard-tutorial.md](docs/taskboard-tutorial.md) to build one application through interaction, routing, data, forms, SSR, hydration and offline/PWA behavior.

If this works, you already have the core Valyrian mental model.

## Official Learning Route

Taskboard is the official cumulative tutorial. It starts from the first browser render and extends the same application through seven observable stages:

1. Local TSX project.
2. Interaction with PulseStore.
3. Routing.
4. Async data with Request and Suspense.
5. Validated forms with FormStore.
6. Runtime SSR and hydration.
7. Offline queue, network status and service worker updates.

Each stage names the starting state, the applied change, the observable result and the next step. Start at [docs/taskboard-tutorial.md](docs/taskboard-tutorial.md).

## Documentation

- Start here: [docs/toc.md](docs/toc.md)
- Editorial style guide: [docs/editorial-style-guide.md](docs/editorial-style-guide.md)
- Introduction: [docs/1-introduction.md](docs/1-introduction.md)
- Getting Started (No-Build First): [docs/2-getting-started.md](docs/2-getting-started.md)
- Taskboard Tutorial: [docs/taskboard-tutorial.md](docs/taskboard-tutorial.md)
- The Essentials: [docs/3-the-essentials.md](docs/3-the-essentials.md)
- Runtime core API reference: [docs/3.1-runtime-core.md](docs/3.1-runtime-core.md)
- API Reference Standard: [docs/api-reference-standard.md](docs/api-reference-standard.md)
- Building Single Page Applications (SPA Hub): [docs/4-building-spa.md](docs/4-building-spa.md)
- Advanced State Management (Hub): [docs/5-advanced-state-management.md](docs/5-advanced-state-management.md)
- Run the Same Application in Browser and Node.js: [docs/7-full-stack-capability.md](docs/7-full-stack-capability.md)
- Utilities and Ecosystem (Hub): [docs/8-utilities-and-ecosystem.md](docs/8-utilities-and-ecosystem.md)
- Versioning and Compatibility Policy: [docs/12-versioning-policy.md](docs/12-versioning-policy.md)
- Website: <https://valyrianjs.dev/>

## Why Valyrian.js

- One runtime model across browser and server.
- Explicit runtime behavior with deterministic updates.
- Integrated app-runtime capabilities: SSR, hydration, routing, request flow, and state fit the same runtime model.
- Built-in modules for routing, request, state, forms, offline behavior, and server-side rendering reduce the number of external pieces you need to assemble for common app flows.
- Web-first architecture that can start in the browser and expand into Node tooling without changing the core mental model.
- Official Taskboard route that demonstrates growth by accumulation instead of fragmented examples.

Good fit:

- You want a smaller stack with fewer moving parts.
- You prefer explicit updates and clear runtime behavior.
- You want browser and server flows to use the same developed app.
- You want SSR and hydration without adopting a separate meta-framework as the core of your app architecture.

Not the best fit:

- You need a huge plugin ecosystem as your primary decision factor.
- You require a fully opinionated meta-framework workflow out of the box.

## Testing Philosophy

Valyrian.js tests are behavior-first and API-contract driven. Public modules validate happy paths, edge cases, and runtime consistency across browser-like and Node-like environments. Documentation examples are kept aligned with tested behavior.

## Tests

```bash
bun test
```

For development mode in this repository:

```bash
bun run dev:test
```

## More Guides

- Recipes and integrations: [docs/9-recipes-and-integrations.md](docs/9-recipes-and-integrations.md)
- Meta-framework CLI (downstream workflow): [docs/10-meta-framework-cli.md](docs/10-meta-framework-cli.md)
- Contribution guide: [docs/11-contribution.md](docs/11-contribution.md)
- Versioning and compatibility policy: [docs/12-versioning-policy.md](docs/12-versioning-policy.md)

## AI Guidance

- Agent guidance: [llms.txt](llms.txt)
- Full documentation bundle for AI tools: [llms-full.txt](llms-full.txt)

## Contributing

- Run lint/format checks before opening a PR.
- Add or update tests for new behavior.
- Update docs in `docs/` whenever public behavior changes.

## Legal

Author: [Masquerade Circus](http://masquerade-circus.net). License [Apache-2.0](https://opensource.org/licenses/Apache-2.0)
