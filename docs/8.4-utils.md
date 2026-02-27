# 8.4. Helpers (`valyrian.js/utils`)

`valyrian.js/utils` exports object path helpers, immutability helpers, and validation guards.

## Object Path Helpers

```ts
import { get, set } from "valyrian.js/utils";

const data = { users: [{ name: "Alice" }] };
get(data, "users.0.name");
set(data, "users.0.name", "Arya");
```

Behavior details:

* `get(obj, path, defaultValue?)` returns `defaultValue` when found value is missing.
* Falsy defaults (`0`, `""`, `false`) are respected.
* If `defaultValue` is omitted and the value is missing, `get` returns `null`.
* `set(obj, path, value)` creates intermediate plain objects when segments do not exist.
* Numeric segments in paths (for example `items.0.name`) are treated as object keys unless that structure already exists.

## Change Detection

`hasChanged(prev, current)` performs recursive diff-style checks for arrays, objects, and primitive values.

## Immutability Helpers

* `deepFreeze(obj, freezeClassInstances?)`
* `deepCloneUnfreeze(obj, cloneClassInstances?)`

`deepCloneUnfreeze` supports arrays, maps, sets, typed arrays, dates, regex, errors, and cyclic references.

For class instances, clone behavior is opt-in with `cloneClassInstances`.

## Validators and Guards

Common exports include:

* `isEmpty`
* `is`, `isFunction`, `isString`, `isNumber`, `isFiniteNumber`, `isBoolean`, `isObject`
* `hasLength`, `hasMinLength`, `hasMaxLength`, `hasLengthBetween`
* `isLessThan`, `isGreaterThan`, `isBetween`
* `pick`
* `ensureIn`

```ts
import { ensureIn, isFiniteNumber, pick } from "valyrian.js/utils";

const okMethod = ensureIn("GET", ["GET", "POST"] as const);
const valid = isFiniteNumber(42);
const subset = pick({ a: 1, b: 2 }, ["a"]);
```
