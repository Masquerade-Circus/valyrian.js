# 7.3.1. Service Worker Runtime (`valyrian.js/sw`)

`SwRuntimeManager` manages service worker registration and update lifecycle in the browser.

## Quick Start

```ts
import { SwRuntimeManager } from "valyrian.js/sw";

const runtime = await new SwRuntimeManager({
  swUrl: "/sw.js",
  strategy: "prompt-user" // prompt-user | auto | manual
}).init();

runtime.on("updateavailable", () => showUpdateBanner());
```

## API Surface

* `state` -> `{ updateAvailable, installing, registration, waiting }`
* `on(event, callback)` / `off(event, callback)`
* `applyUpdate()`
* `checkForUpdate()`
* `unregister()`

Events:

* `registered`
* `updateavailable`
* `updated`
* `error`

## Update Strategies

* `prompt-user` (default): announce update and let app decide when to call `applyUpdate()`.
* `auto`: apply update automatically when waiting worker is available.
* `manual`: never auto-apply or auto-reload.

On `controllerchange`, runtime emits `updated` and reloads the page unless strategy is `manual`.

## Utility Function: `registerSw`

```ts
import { registerSw } from "valyrian.js/sw";

await registerSw("/sw.js", { scope: "/" });
```

If service workers are unsupported, it returns without throwing.
