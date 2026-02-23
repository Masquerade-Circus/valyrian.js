# 10. Meta-Framework and CLI

Status: **planned direction**.

This page documents intended architecture concepts so users can track roadmap direction without guessing.

## 10.1. CLI Goals

Potential CLI responsibilities:

* scaffold project templates
* enforce directory conventions
* automate build targets (SPA, SSR, static)

## 10.2. File-Based Routing Goals

Potential conventions:

* map filesystem segments to router paths
* support nested layouts
* support dynamic segments and catch-all routes

## 10.3. Target Architectures

* **SSG**: static output for content-first sites
* **SAG**: static app shell + runtime API interaction
* **FSA**: full-stack app with server rendering and runtime routes

## 10.4. What Exists Today

Today, core runtime capabilities already available in this repository include:

* router (`valyrian.js/router`)
* SSR and build utilities (`valyrian.js/node`)
* service worker runtime (`valyrian.js/sw`)

This means teams can implement many meta-framework patterns now, even before a dedicated CLI flow is finalized.
