# 11. Roadmap and Contribution

This chapter keeps contribution expectations explicit and predictable.

## 11.1. Documentation Roadmap

Short-term priorities:

1. Keep code examples aligned with tested behavior.
2. Keep cross-links and chapter structure stable.
3. Expand recipe coverage for common deployment setups.

Mid-term priorities:

1. Add migration guides for major versions.
2. Add troubleshooting pages for common integration pitfalls.
3. Add deeper SSR and PWA deployment guides.

## 11.2. Contribution Workflow

If you change behavior in `lib/`, update both docs and tests.

Recommended order:

1. Update or add tests in `test/`.
2. Update docs in `docs/` with matching examples.
3. Run checks locally.

## 11.3. Documentation Quality Rules

* Avoid claims that are not backed by code or tests.
* Prefer short, runnable examples.
* Clearly mark planned features as planned.
* Keep terminology consistent across pages.

## 11.4. Useful Commands

```bash
npm test
npm run dev:test
npm run remark
```
