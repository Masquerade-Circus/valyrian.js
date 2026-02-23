import "valyrian.js/node";

import { describe, expect, test as it } from "bun:test";
import { NetworkManager } from "valyrian.js/network";
import { OfflineQueue } from "valyrian.js/offline";
import { wait } from "./utils/helpers";

function createAlwaysOnlineNetwork() {
  return new NetworkManager({
    runtime: {
      isNodeJs: true,
      navigator: null,
      window: null
    }
  });
}

describe("Offline", () => {
  it("should enqueue and sync operations successfully", async () => {
    const handled: any[] = [];
    const network = createAlwaysOnlineNetwork();
    const queue = new OfflineQueue({
      id: `offline-success-${Date.now()}`,
      network,
      handler: async (operation: any) => {
        handled.push(operation);
      }
    });

    queue.enqueue({ type: "create", payload: { id: 1 } });
    expect(queue.pending().length).toEqual(1);

    await queue.sync();
    expect(queue.pending().length).toEqual(0);
    expect(queue.failed().length).toEqual(0);
    expect(handled.length).toEqual(1);

    queue.destroy();
    network.destroy();
  });

  it("should move operation to failed after max retries", async () => {
    const network = createAlwaysOnlineNetwork();
    const queue = new OfflineQueue({
      id: `offline-fail-${Date.now()}`,
      network,
      maxRetries: 1,
      backoff: { strategy: "linear", baseMs: 1, maxMs: 1 },
      handler: async () => {
        throw new Error("boom");
      }
    });

    queue.enqueue({ type: "create", payload: { id: 2 } });
    await queue.sync();
    expect(queue.pending().length).toEqual(1);
    expect(queue.failed().length).toEqual(0);

    await queue.sync();
    expect(queue.pending().length).toEqual(0);
    expect(queue.failed().length).toEqual(1);

    queue.destroy();
    network.destroy();
  });

  it("should retry failed operations and allow discard", async () => {
    const network = createAlwaysOnlineNetwork();
    const queue = new OfflineQueue({
      id: `offline-retry-${Date.now()}`,
      network,
      maxRetries: 1,
      backoff: { strategy: "linear", baseMs: 1, maxMs: 1 },
      handler: async () => {
        throw new Error("always fails");
      }
    });

    queue.enqueue({ type: "create", payload: { id: 3 } });
    await queue.sync();
    await queue.sync();
    expect(queue.failed().length).toEqual(1);

    const failedId = queue.failed()[0].id;
    queue.retryOne(failedId);
    expect(queue.pending().length).toEqual(1);
    expect(queue.failed().length).toEqual(0);

    await queue.sync();
    expect(queue.pending().length).toEqual(1);
    await queue.sync();
    expect(queue.failed().length).toEqual(1);

    queue.retryAll();
    expect(queue.pending().length).toEqual(1);
    expect(queue.failed().length).toEqual(0);

    queue.discardFailed();
    expect(queue.failed().length).toEqual(0);

    queue.destroy();
    network.destroy();
  });

  it("should defer sync while offline and auto-sync on online event", async () => {
    const windowListeners: Record<string, () => void> = {};
    const navigatorMock = { onLine: false };
    const windowMock = {
      addEventListener(event: string, listener: () => void) {
        windowListeners[event] = listener;
      },
      removeEventListener(event: string) {
        delete windowListeners[event];
      }
    };

    const network = new NetworkManager({
      runtime: {
        isNodeJs: false,
        navigator: navigatorMock,
        window: windowMock
      }
    });

    const handled: any[] = [];
    const queue = new OfflineQueue({
      id: `offline-event-${Date.now()}`,
      network,
      handler: async (operation: any) => {
        handled.push(operation);
      }
    });

    queue.enqueue({ type: "create", payload: { id: 4 } });
    await queue.sync();

    expect(handled.length).toEqual(0);
    expect(queue.pending().length).toEqual(1);

    navigatorMock.onLine = true;
    windowListeners.online();
    await wait(0);

    expect(handled.length).toEqual(1);
    expect(queue.pending().length).toEqual(0);

    queue.destroy();
    network.destroy();
  });
});
