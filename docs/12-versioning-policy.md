# 12. Versioning and Compatibility Policy

Status: active policy
Applies from: Valyrian.js 9.x
Versioning standard: Semantic Versioning 2.0.0

## 12.1. Purpose

This policy defines how Valyrian.js evolves, which parts of the project preserve compatibility, and what people can expect when upgrading between versions.

The policy has four goals:

1. Keep patch and minor releases compatible within the same major version.
2. Allow implementation details to evolve without treating every refactor as a breaking change.
3. Communicate deprecations and migrations in advance.
4. Promise only the compatibility that the project can verify through tests.

## 12.2. Public API

Valyrian.js treats the following as stable public API:

- Documented exports from `valyrian.js`.
- Documented exports from subpaths such as `valyrian.js/router`, `valyrian.js/pulses`, and `valyrian.js/node`.
- Published TypeScript signatures.
- Documented directives and lifecycles.
- Component shapes described in the documentation.
- Documented arguments, return values, errors, and observable effects.
- Documented rendering, update, SSR, and hydration behavior.

The project treats the following as undocumented implementation details:

- Functions that are not exported.
- Structures that the documentation does not present for direct consumption.
- Reconciliation and update algorithms.
- Indexes, caches, `WeakMap`, `WeakSet`, and other implementation structures.
- Markers used during SSR and hydration that are not part of the documented API.
- The exact HTML shape when it preserves the same semantics and can hydrate correctly.

Undocumented implementation details can change in a patch or minor release when the change preserves the public API behavior.

## 12.3. Semantic Versioning

Valyrian.js uses versions in the `MAJOR.MINOR.PATCH` format.

### 12.3.1. Patch Releases

A patch release:

- Fixes bugs.
- Improves security, stability, or performance.
- Preserves public exports and signatures.
- Preserves documented behavior.
- Can correct incorrect behavior so it complies again with the documented contract.
- Can update dependencies when the public result remains compatible.

Example:

```text
9.1.13 becomes 9.1.14
```

A fix can change a result that accidentally depended on a bug. The changelog must call out the case when the fix can affect existing code.

### 12.3.2. Minor Releases

A minor release:

- Adds compatible modules, functions, directives, or options.
- Can improve types without rejecting previously valid public usage.
- Can start deprecating an API.
- Can include patch fixes.
- Preserves compatibility with existing public APIs in the same major version.

Example:

```text
9.1.13 becomes 9.2.0
```

A new independent module normally belongs in a minor release.

### 12.3.3. Major Releases

A major release can:

- Remove or rename public APIs.
- Change documented signatures, return values, or semantics.
- Remove APIs previously marked as deprecated.
- Raise the minimum Node.js version.
- Raise the minimum browser requirements.
- Change persisted formats without a compatible migration.
- Change public SSR, hydration, directive, or lifecycle contracts.

Example:

```text
9.4.2 becomes 10.0.0
```

Every major release with breaking changes must include a migration guide.

## 12.4. Deprecations

An API is marked as deprecated in a minor release and remains functional for the rest of that major version.

The next major version can remove it.

Example:

1. `9.2.0` marks `oldFunction` as deprecated.
2. Later `9.x` releases preserve `oldFunction`.
3. `10.0.0` can remove it.

When an API is fundamental or its migration affects many applications, the project can preserve an alias for one additional major version:

1. `9.2.0` announces the deprecation.
2. `10.x` preserves a compatible alias.
3. `11.0.0` removes the alias.

Every deprecation must include:

- The `@deprecated` annotation in the TypeScript types.
- The replacement API or migration path.
- The major version where it could be removed.
- A changelog entry.
- An explanation in the next migration guide.

Example:

```ts
/**
 * @deprecated Use newFunction instead. Planned for removal in v10.
 */
```

The project can emit a warning during development. The warning must appear only once per API and must stay out of production builds when practical.

## 12.5. Node.js Compatibility

Each Valyrian.js major version fixes its supported Node.js versions when it is published.

Minor and patch releases do not raise the minimum Node.js requirement.

### 12.5.1. Policy for Valyrian.js 9.x

- Keep `node >=20.9.0` for maintained Valyrian.js 9.x releases.
- Run tests on Node 20.9.x or newer Node 20 releases while support is declared.
- Use Node 22 or Node 24 as the default choice for new projects.
- Explain that Node 20 has ended official maintenance.

Valyrian.js support means the framework works on that version. The Node.js project may have stopped publishing security fixes for an old runtime.

### 12.5.2. Policy for Valyrian.js 10

- Declare `node >=22`.
- Test Node 22 and Node 24 as required CI jobs.
- Test Node 26 as an experimental job while it is a Current release.
- Make Node 26 required when the project decides to adopt it formally.

A future removal of Node 22 must wait for the next Valyrian.js major version.

## 12.6. Browser Compatibility

Valyrian.js uses Baseline Widely Available as its reference for the web platform.

### 12.6.1. What Baseline Is

Baseline is a compatibility classification created by the WebDX Community Group. It evaluates whether an HTML, CSS, or JavaScript feature is interoperably available across the core browser set:

- Chrome on desktop and Android.
- Edge.
- Firefox on desktop and Android.
- Safari on macOS and iOS.

Baseline uses three main states:

- **Limited availability:** the feature is not yet available in all major browsers.
- **Newly available:** all major browsers already implement the feature.
- **Widely available:** at least 30 months have passed since the feature reached interoperable availability.

The 30-month period reduces the risk of requiring browser versions that are too recent.

### 12.6.2. What Widely Available Means for Valyrian.js

A feature marked as Baseline Widely Available has broad enough availability to be used normally without polyfills.

Baseline Widely Available:

- Provides a shared browser compatibility reference.
- Avoids depending only on Chrome.
- Describes compatibility without maintaining a manual list that ages quickly.
- Can be queried from Browserslist and build tools.

Baseline Widely Available does not:

- Guarantee support in every existing browser.
- Include Internet Explorer.
- Evaluate performance.
- Replace real framework tests.
- Guarantee that an application does not need polyfills for its own dependencies.

### 12.6.3. Policy

Each Valyrian.js major version fixes the current Baseline reference when it is published.

During that major version:

- Minor and patch releases preserve that minimum reference.
- A newer feature can be used if it includes a compatible alternative.
- Introducing a required dependency on a feature not yet covered by the reference requires a new major version.
- The project should validate documented browser behavior against Chromium, Firefox, and WebKit before publishing browser compatibility claims for a release.
- Internet Explorer is outside support.

Policy text:

> Valyrian.js supports web platform features classified as Baseline Widely Available when each major version is published. That reference remains stable for the full major version. Browser-engine validation targets Chromium, Firefox, and WebKit. Each release must publish only the validation coverage that is visible in its repository, CI, or release notes.

To make the policy reproducible, each major version can save the following in the documentation:

- The Baseline reference date.
- The Browserslist query used.
- The browser matrix tested in CI.

## 12.7. SSR and Hydration Contracts

- The server and the client must use the same Valyrian.js major version.
- Use the exact same version on both sides when possible.
- Minor and patch releases in a major version preserve the documented SSR and hydration contract.
- Hydration can reconcile differences between the server HTML and the initial client state.
- The exact HTML shape can change when its semantics and hydration capability remain compatible.
- Hydration markers and structures that are not documented for application use are outside the public API.

The project does not need to guarantee that an old client will hydrate HTML produced indefinitely by a future major version.

## 12.8. Persisted Data

Modules that preserve data across sessions must consider stored format compatibility.

This can affect:

- `valyrian.js/offline`.
- `valyrian.js/query`.
- `valyrian.js/native-store`.
- Service workers.
- Persistent caches and queues.

When a format can survive an upgrade:

- The format must include a version when necessary.
- A minor release must be able to read data created by earlier releases in the same major version.
- A major release can change the format.
- The major release must migrate, invalidate, or discard the data explicitly and safely.

## 12.9. TypeScript Types

Published types are part of the public API.

A patch or minor release can:

- Correct types that were more permissive than the documented behavior.
- Add optional properties.
- Improve inference without invalidating correct usage.
- Add compatible overloads.

A type change must be treated as breaking when it rejects a usage that the documentation and runtime considered valid.

## 12.10. Release Policy

Valyrian.js can publish stable releases directly after completing its local and automated tests.

### 12.10.1. Patch

Flow:

1. Reproduce the bug.
2. Add a regression test.
3. Implement the fix.
4. Run all tests.
5. Update the changelog.
6. Publish the stable patch release.

Patch releases normally do not need alpha, beta, or RC stages.

### 12.10.2. Minor

Flow:

1. Design and test the new module or capability.
2. Confirm that previous APIs remain compatible.
3. Add tests for the public API and its edge cases.
4. Update types and documentation.
5. Run all tests.
6. Publish the stable minor release.

Minor releases normally do not need alpha, beta, or RC stages when the new capability is additive and isolated.

### 12.10.3. Major

A major release can be published directly as stable when:

- The architecture has been fully tested.
- Coverage exists for the changed contracts.
- The migration guide is complete.
- Examples and documentation use the new API.
- The author controls and understands all breaking changes.

Alpha, beta, and RC releases are optional tools.

Use them when:

- The change affects the reconciler, SSR, or hydration.
- Several public APIs change at the same time.
- The migration needs validation in applications outside the repository.
- There are open questions about ergonomics, naming, or edge cases.
- The author wants feedback before freezing the API.

Stage meanings:

- `alpha`: the architecture can still change.
- `beta`: the architecture is defined, but validation is incomplete.
- `rc`: the API is considered final and only fixes are expected.

A small and well-controlled major release can skip these stages. A broad major release can publish at least one RC without making it a permanent project requirement.

## 12.11. Tests Before Publishing

Every release must run:

- Unit tests.
- Integration tests.
- Keyed and non-keyed rendering tests.
- Mount, update, and unmount tests.
- Listener and subscription cleanup tests.
- SSR and hydration tests.
- Request isolation tests when server code changes.
- TypeScript type checks.
- Builds for all published modules.

When public examples change, the project should compile or run them in CI. This turns documentation into an additional compatibility test.

## 12.12. Fixing an Accidental Break

If a patch or minor release accidentally introduces an incompatibility:

1. Document the affected version.
2. Restore compatibility in a new release as soon as possible.
3. Add a regression test.
4. Publish the fix without modifying the contents of an already published release.

When restoring compatibility would create another major break for users who already adopted the accidental behavior, the project must explain the case and choose a major version.

## 12.13. Maintenance for Older Versions

Minimum maintenance policy:

> The latest major version receives features and fixes. Older versions remain available, but they do not receive active maintenance unless the project announces otherwise.

Optional extended maintenance policy:

> The previous major version can receive critical and security fixes for six months after a new major version is published.

The project must adopt the extended policy only if it can sustain it.

## 12.14. Migration Guide Contents

Every major migration guide must include:

- Summary of breaking changes.
- Removed APIs.
- Replacement APIs.
- Before and after examples.
- Changes to supported Node.js and browsers.
- SSR and hydration changes.
- Persisted data changes.
- Relevant TypeScript type changes.
- Verifiable steps to complete the migration.

## 12.15. Short Text for README or Documentation

> Valyrian.js follows Semantic Versioning. Patch releases fix bugs without breaking the public API. Minor releases add compatible capabilities and can mark APIs as deprecated. Major releases can introduce breaking changes, remove deprecated APIs, or raise Node.js and browser requirements.
>
> Every documented export and documented behavior is considered part of the public API. Undocumented implementation details can change in any release.
>
> Deprecated APIs remain available for the rest of the major version where they are announced and can be removed in the next major version. Every deprecation includes an alternative and a migration guide.
>
> Each major version fixes its supported Node.js and browser matrix. Minor and patch releases do not raise those requirements.

## 12.16. References

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Node.js End-Of-Life](https://nodejs.org/en/about/eol)
- [Web Platform Baseline](https://web.dev/baseline)
- [Baseline 2026](https://web.dev/baseline/2026)
