# 8. Utilities and Ecosystem (Hub)

Valyrian includes utility modules used by the framework and available to your app code.

These modules keep the same design style as core runtime APIs: explicit behavior and small surfaces.

Reader-first advice: start with the module closest to your current task, then come back for the rest.

## 8.1. Internationalization

* File: [./8.1-translate.md](./8.1-translate.md)
* Covers language dictionaries, interpolation, `v-t`, language persistence strategies, and missing-key logs.

## 8.2. Money and Number Formatting

* File: [./8.2-money.md](./8.2-money.md)
* Covers `Money`, `NumberFormatter`, parsing/formatting helpers, and `v-money`.

## 8.3. Native Persistence

* File: [./8.3-native-store.md](./8.3-native-store.md)
* Covers `createNativeStore`, storage types, duplicate-id behavior, sync semantics, and Node runtime requirements.

## 8.4. Helpers

* File: [./8.4-utils.md](./8.4-utils.md)
* Covers object path helpers, deep clone/freeze helpers, change detection, and validators/guards.

## Suggested Reading Order

1. [./8.1-translate.md](./8.1-translate.md)
2. [./8.2-money.md](./8.2-money.md)
3. [./8.3-native-store.md](./8.3-native-store.md)
4. [./8.4-utils.md](./8.4-utils.md)
