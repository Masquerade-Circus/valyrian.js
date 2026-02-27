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
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/8d5204c73bdc42089e4cebdb4b4d43e0)](https://www.codacy.com/gh/Masquerade-Circus/valyrian.js/dashboard?utm_source=github.com\&utm_medium=referral\&utm_content=Masquerade-Circus/valyrian.js\&utm_campaign=Badge_Grade)

![](https://img.shields.io/github/issues/masquerade-circus/valyrian.js.svg)
[![Coverage](assets/badges/coverage.svg)](https://github.com/Masquerade-Circus/valyrian.js/actions/workflows/test.yml)

</p>

</div>

# Valyrian.js

Lightweight steel to forge modern web apps.

Valyrian.js is a runtime-first, isomorphic micro-framework. Render UI, add routing, manage state, and ship SSR with one mental model and minimal stack glue.

## Table of Contents

* [Quick Start](#quick-start)
  * [Browser (CDN)](#browser-cdn)
  * [Node (npm)](#node-npm)
* [Choose Your Path](#choose-your-path)
* [First 5 Minutes (Recommended)](#first-5-minutes-recommended)
* [Documentation](#documentation)
* [Why Valyrian.js](#why-valyrianjs)
* [Testing Philosophy](#testing-philosophy)
* [Tests](#tests)
* [More Guides](#more-guides)
* [Contributing](#contributing)
* [Legal](#legal)

## Quick Start

Get a working screen first. Start with the CDN path for the fastest feedback loop.

### Browser (CDN)

```html
<script type="module">
  import "https://unpkg.com/valyrian.js";
  const { mount } = Valyrian;
  mount("body", () => "Hello from Valyrian.js");
</script>
```

Expected result: the text appears in the page body.

### Node (npm)

```bash
npm install valyrian.js
```

Then follow [docs/2-getting-started.md](docs/2-getting-started.md) for the `inline` build flow and first TSX/JSX setup.

## Choose Your Path

* **Try it now (no install):** use the CDN snippet above.
* **Build with TSX/JSX:** start at [docs/2-getting-started.md](docs/2-getting-started.md) (Node path).
* **Ship SSR/isomorphic behavior:** complete chapters 1-3, then go to [docs/7-full-stack-capability.md](docs/7-full-stack-capability.md).

## First 5 Minutes (Recommended)

1. Copy the CDN snippet into an `index.html` file.
2. Open it in your browser and confirm the UI renders.
3. Change the mounted text to verify the update loop.
4. Continue with [docs/3-the-essentials.md](docs/3-the-essentials.md).

If this works, you already have the core Valyrian mental model.

## Documentation

* Start here: [docs/toc.md](docs/toc.md)
* Introduction: [docs/1-introduction.md](docs/1-introduction.md)
* Getting Started (No-Build First): [docs/2-getting-started.md](docs/2-getting-started.md)
* The Essentials: [docs/3-the-essentials.md](docs/3-the-essentials.md)
* Runtime core API reference: [docs/3.1-runtime-core.md](docs/3.1-runtime-core.md)
* Building Single Page Applications (SPA Hub): [docs/4-building-spa.md](docs/4-building-spa.md)
* Advanced State Management (Hub): [docs/5-advanced-state-management.md](docs/5-advanced-state-management.md)
* The Full-Stack Capability (Isomorphism Hub): [docs/7-full-stack-capability.md](docs/7-full-stack-capability.md)
* Utilities and Ecosystem (Hub): [docs/8-utilities-and-ecosystem.md](docs/8-utilities-and-ecosystem.md)
* Website: <https://valyrianjs.dev/>

## Why Valyrian.js

* One runtime model across browser and server.
* Built-in modules for routing, request, state, forms, offline, and SSR tooling.
* Minimal dependencies and explicit control of rendering behavior.
* Can run with or without a traditional bundler workflow.

Good fit:

* You want a smaller stack with fewer moving parts.
* You prefer explicit updates and clear runtime behavior.
* You want browser and server flows with a shared mental model.

Not the best fit:

* You need a huge plugin ecosystem as your primary decision factor.
* You require a fully opinionated meta-framework workflow out of the box.

## Testing Philosophy

Valyrian.js tests are behavior-first and API-contract driven. Public modules validate happy paths, edge cases, and runtime consistency across browser-like and Node-like environments. Documentation examples are kept aligned with tested behavior.

## Tests (Framework Repository)

```bash
bun test
```

For development mode in this repository:

```bash
bun run dev:test
```

These commands are for contributors developing this framework repository.
For app usage, keep following [docs/2-getting-started.md](docs/2-getting-started.md).

## More Guides

* Recipes and integrations: [docs/9-recipes-and-integrations.md](docs/9-recipes-and-integrations.md)
* Meta-framework CLI: [docs/10-meta-framework-cli.md](docs/10-meta-framework-cli.md)
* Roadmap and contribution model: [docs/11-roadmap-and-contribution.md](docs/11-roadmap-and-contribution.md)

## Contributing

* Run lint/format checks before opening a PR.
* Add or update tests for new behavior.
* Update docs in `docs/` whenever public behavior changes.

## Legal

Author: [Masquerade Circus](http://masquerade-circus.net). License [Apache-2.0](https://opensource.org/licenses/Apache-2.0)
