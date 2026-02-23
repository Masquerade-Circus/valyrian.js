# 4.2.5. Network Awareness (`valyrian.js/network`)

`NetworkManager` wraps browser online/offline and connection signals in a small API.

## Quick Start

```ts
import { NetworkEvent, NetworkManager, SignalLevel } from "valyrian.js/network";

const network = new NetworkManager();

network.on(NetworkEvent.CHANGE, (status) => {
  console.log(status.online, status.effectiveType);
});

if (network.getSignalLevel() <= SignalLevel.Poor) {
  console.log("enable low-bandwidth mode");
}
```

## API Surface

* `getNetworkStatus()`
* `getSignalLevel()`
* `isConnectionPoor()`
* `getStatus()` (alias of network status)
* `on(event, listener)`
* `off(event, listener)`
* `destroy()`

`isConnectionPoor()` is a strict check for `SignalLevel.None`.

Events:

* `NetworkEvent.ONLINE`
* `NetworkEvent.OFFLINE`
* `NetworkEvent.CHANGE`

## Signal Mapping

Signal levels:

* `SignalLevel.None`
* `SignalLevel.Poor`
* `SignalLevel.Fair`
* `SignalLevel.Good`
* `SignalLevel.Excellent`

The mapping considers `online`, `effectiveType`, `downlink`, and `rtt` when available.

## Runtime Differences

Node runtime behavior is intentionally simple:

* `getNetworkStatus()` returns `{ online: true }`
* `getSignalLevel()` returns `SignalLevel.Good`

Browser runtime reads `navigator` and optional Network Information API fields.

If the Network Information API is unavailable, status still includes `online` and omits connection metrics.

## Cleanup

Call `destroy()` when the manager is no longer needed to remove listeners and clear subscriptions.
