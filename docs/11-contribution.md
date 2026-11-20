# 11. Contribution

This chapter keeps contribution expectations explicit and predictable.

## 11.1. Contribution Workflow

If you change behavior in `lib/`, update both docs and tests.

If you change documented behavior that affects browser/server continuity, update the relevant chapter 7 docs and any reference pages that define the same contract.

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

## 11.4. Releases and Changelog

`npm run release` is the maintainer command for publishing a version. It runs Release It, which first invokes `bun run build` to build the distribution, run tests with coverage, and regenerate badges and `llms-full.txt`. Those steps are part of the release command.

Release It bumps the version and uses the conventional changelog plugin to update `CHANGELOG.md` from commit history. Use Conventional Commit messages for contributions and leave the changelog for the release tool to generate. The release workflow creates the release commit and tag, pushes to Git, publishes to npm, and creates a GitHub release.

The release configuration allows a working tree with changes. The workflow itself writes build outputs and updates the changelog. Review any pre-existing changes before publishing so the release starts from the intended contents.
