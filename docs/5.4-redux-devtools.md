# 5.4. Redux DevTools Bridge (`valyrian.js/redux-devtools`)

This optional bridge sends FluxStore and Pulse updates to Redux DevTools.

## Quick Start

```ts
import { connectFluxStore, connectPulseStore, connectPulse } from "valyrian.js/redux-devtools";

connectFluxStore(fluxStore, { name: "MyFluxStore" });
connectPulseStore(pulseStore, { name: "MyPulseStore" });

const pulse = connectPulse(rawPulse, { name: "CounterPulse" });
```

## Runtime Behavior

If Redux DevTools extension is not available, all connectors are no-op and return safely.

## FluxStore Integration

`connectFluxStore`:

* initializes devtools with current store state
* sends actions for commits
* sends synthetic actions for module lifecycle:
  * `[Module] Register: <namespace>`
  * `[Module] Unregister: <namespace>`

## PulseStore Integration

`connectPulseStore` listens for `pulse` events and sends them as actions.

## Single Pulse Integration

`connectPulse` returns a wrapped pulse tuple.

Always use the returned tuple, especially the wrapped write function, so updates are sent to devtools.

```ts
const [readCount, writeCount] = connectPulse(createPulse(0), { name: "Count" });
writeCount(1);
```

## Production Guidance

Keep instrumentation behind environment checks when possible to avoid unnecessary production overhead.
