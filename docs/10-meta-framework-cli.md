# 10. Meta-Framework and CLI (Downstream / Planned)

Status: **planned downstream direction**.

This page documents architecture concepts that can be built on top of Valyrian.js without changing the core direction of this repository.

Valyrian.js stays focused here on a web-first isomorphic runtime framework for browser/server apps. A dedicated meta-framework or generator CLI should be treated as downstream or external tooling layered on top of that runtime, not as the primary identity of this repo.

## 10.1. CLI Goals

Potential CLI responsibilities:

* scaffold project templates
* enforce directory conventions
* automate build targets (SPA, SSR, static)

These are workflow goals for downstream tooling, not required runtime capabilities of `valyrian.js` itself.

## 10.2. File-Based Routing Goals

Potential conventions:

* map filesystem segments to router paths
* support nested layouts
* support dynamic segments and catch-all routes

If implemented, these conventions should compose on top of the existing router instead of redefining the runtime model described in chapters 1-7.

## 10.3. Target Architectures

These are downstream app-shaping patterns that a future CLI or external meta-framework could scaffold around the runtime:

* **SSG**: static output for content-first sites
* **SAG**: static app shell + runtime API interaction
* **FSA**: full-stack app with server rendering and runtime routes

## 10.4. What Exists Today

Today, core runtime capabilities already available in this repository include:

* router (`valyrian.js/router`)
* SSR and build utilities (`valyrian.js/node`)
* service worker runtime (`valyrian.js/sw`)

This means teams can implement many meta-framework patterns now, even before a dedicated downstream CLI flow is finalized.

The important boundary is that these runtime primitives belong in this repository, while higher-level generators, file conventions, and opinionated app shells belong in downstream tooling unless the project direction explicitly changes.
