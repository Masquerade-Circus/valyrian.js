# 11. Contribution

This chapter keeps contribution expectations explicit and predictable.

## 11.1. Contribution Workflow

If you change behavior in `lib/`, update both docs and tests.

If you change runtime behavior that affects browser/server continuity, update the relevant chapter 7 docs and any reference pages that define the same contract.

Recommended order:

1. Update or add tests in `test/`.
2. Implement the change in `lib/`.
3. Run checks locally.
4. Update docs in `docs/`.

## 11.2. Documentation Quality Rules

- Avoid claims that are not backed by code or tests.
- Keep one normative source per behavior contract; recipe/comparison pages should link back instead of redefining the same semantics.
- Prefer short, runnable examples.
- Clearly mark planned features as planned.
- Keep terminology consistent across pages.

## 11.3. Useful Commands

These commands are for framework development in this repository.
For app usage, follow [./2-getting-started.md](./2-getting-started.md).

```bash
bun test
bun run dev:test
bun run build:source
bun run badges
```
