# 4.2.6. Offline Queue (`valyrian.js/offline`)

`OfflineQueue` stores operations and syncs them when the network is available.

## Quick Start

```ts
import { OfflineQueue } from "valyrian.js/offline";
import { NetworkManager } from "valyrian.js/network";

const queue = new OfflineQueue({
  id: "orders-queue",
  network: new NetworkManager(),
  handler: (operation) => request.post(`/api/offline/${operation.type}`, operation.payload as Record<string, unknown>)
});

queue.enqueue({ type: "create-order", payload: { sku: "sword" } });
await queue.sync();
```

## Queue State and Inspection

* `state()` -> `{ pending, failed, syncing, lastSyncAt, lastError }`
* `pending()` -> copy of pending operations
* `failed()` -> copy of failed operations

`enqueue(...)` auto-generates `id`, `createdAt`, and initializes `retries` to `0`.

## Sync Lifecycle

1. `sync()` exits early if already syncing.
2. `sync()` exits early if network reports offline.
3. Pending operations are processed in order.
4. Success removes operation from pending.
5. Non-retryable or max-retries errors move operation to failed.
6. Retryable errors apply backoff and stop current sync pass.

Retryable failure does not drain the entire queue in one call. Later `sync()` calls continue processing.

## Retry and Recovery APIs

* `retryOne(id)`
* `retryAll()`
* `discardFailed()`

`retryOne(id)` is a safe no-op when the id is not found.

## Events

* `change` -> queue state snapshot
* `sync:success` -> successful operation
* `sync:error` -> `{ operation, error }`

```ts
queue.on("change", (state) => console.log(state.pending, state.failed));
```

## Auto-Sync and Cleanup

Queue subscribes to `NetworkEvent.ONLINE` and triggers `sync()` automatically.

Call `destroy()` to remove network and queue listeners when the queue is no longer used.

## Options

`OfflineQueue` accepts:

* `id`
* `network`
* `storage` (`"local"` or `"session"`)
* `handler(operation)`
* `isRetryable(error)`
* `backoff` (`strategy`, `baseMs`, `maxMs`)
* `maxRetries`
