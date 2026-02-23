# 6. Optimization and Performance

Valyrian is fast by default, but you can still control rendering cost explicitly.

Before optimizing, confirm there is a real bottleneck (profiling or measured latency). Most screens do not need early optimization.

Optimize by evidence, not by instinct.

## 6.1. Controlled Rendering with `v-keep`

`v-keep` skips patching a node subtree when its guard value does not change.

```tsx
<section v-keep={user.id}>
  <UserProfile user={user} />
</section>
```

Behavior:

* If guard value is unchanged (`===`), subtree update is skipped.
* If guard value changes, normal patching continues.

Use cases:

* Static subtrees (`<footer v-keep>...</footer>`)
* Expensive subtrees that only depend on one identifier
* Large tables where row updates are sparse

## 6.2. Pick the Correct Form Layer

Valyrian offers two practical layers:

1. **`v-model`** for lightweight, local forms.
2. **`FormStore`** for schema validation, transforms, submit state, and repeatable UX.

```tsx
const state = { email: "", newsletter: false };

<input name="email" type="email" v-model={state} />
<input name="newsletter" type="checkbox" v-model={state} />
```

Move to `FormStore` when you need validation, canonical formatting, async submit orchestration, or reusable form behavior across screens.

## 6.3. Keyed Lists and Node Reuse

When list order can change, give siblings stable `key` values.

```tsx
<ul v-for={users}>
  {(user) => <li key={user.id}>{user.name}</li>}
</ul>
```

Why it matters:

* Preserves DOM identity during reordering.
* Avoids resetting expensive third-party widgets.
* Improves animation and transition continuity.

Rules:

1. Do not mix keyed and non-keyed siblings in the same list.
2. Keep keys stable (avoid `Math.random()` and mutable index-based keys).
3. Combine `key` + `v-keep` for very large datasets when appropriate.

## Practical Optimization Order

1. Fix obvious render anti-patterns first.
2. Add stable `key` values where list identity matters.
3. Add `v-keep` for expensive stable subtrees.
4. Re-measure before adding more complexity.
