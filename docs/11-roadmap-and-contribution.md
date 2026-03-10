# 11. Roadmap and Contribution

This chapter keeps contribution expectations explicit and predictable for a web-first repository centered on one runtime model across browser and server.

## 11.1. Documentation Roadmap

Short-term priorities:

1. Keep code examples aligned with tested behavior.
2. Keep cross-links and chapter structure stable.
3. Expand recipe coverage for common deployment setups.

Mid-term priorities:

1. Add migration guides for major versions.
2. Add troubleshooting pages for common integration pitfalls.
3. Add deeper SSR and PWA deployment guides.

## 11.1.1. Repo Direction and Boundaries

This repository positions Valyrian.js as an isomorphic runtime framework for web apps.

Contribution decisions should preserve these boundaries:

1. Keep core direction focused on browser/server continuity, SSR, hydration, request isolation, and related web runtime behavior.
2. Keep documentation category language consistent with that positioning across README and `docs/`.
3. Do not reframe the project as a host-agnostic core or a generic runtime toolkit.
4. Treat terminal UIs, native targets, and meta-framework generators as downstream or external repos unless the project direction explicitly changes.

## 11.2. Contribution Workflow

If you change behavior in `lib/`, update both docs and tests.

If you change runtime behavior that affects browser/server continuity, update the relevant chapter 7 docs and any reference pages that define the same contract.

Recommended order:

1. Update or add tests in `test/`.
2. Update docs in `docs/` with matching examples.
3. Run checks locally.

## 11.3. Documentation Quality Rules

- Avoid claims that are not backed by code or tests.
- Prefer short, runnable examples.
- Clearly mark planned features as planned.
- Keep terminology consistent across pages.
- Keep `isomorphic runtime framework`, `browser/server`, `SSR`, and request-isolation wording aligned with the repo's documented positioning.
- Do not introduce docs language that recenters the repo around non-web hosts or downstream tooling categories.

## 11.4. Useful Commands

These commands are for framework development in this repository.
For app usage, follow [./2-getting-started.md](./2-getting-started.md).

```bash
bun test
bun run dev:test
bun run build:source
bun run badges
```
