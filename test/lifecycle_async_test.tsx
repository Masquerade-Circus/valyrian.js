import "valyrian.js/node";

import { afterEach, beforeEach, describe, expect, test as it } from "bun:test";
import { mount, onCreate, onUpdate, unmount, update, v } from "valyrian.js";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForAsyncLifecycleToSettle() {
  await Promise.resolve();
  await wait(60);
  await Promise.resolve();
}

describe("Async lifecycle: onCreate", () => {
  beforeEach(unmount);
  afterEach(unmount);

  it("updates the UI after async onCreate settles without manual update", async () => {
    const deferred = createDeferred<void>();
    const state = { ready: false };
    const host = document.createElement("div");

    const Component = () => {
      onCreate(async () => {
        await deferred.promise;
        state.ready = true;
      });

      return <div>{state.ready ? "ready" : "loading"}</div>;
    };

    expect(mount(host, Component)).toEqual("<div>loading</div>");
    expect(host.innerHTML).toEqual("<div>loading</div>");

    deferred.resolve();
    await waitForAsyncLifecycleToSettle();

    expect(host.innerHTML).toEqual("<div>ready</div>");
  });

  it("does not register cleanup returned asynchronously from onCreate", async () => {
    const deferred = createDeferred<() => void>();
    const events: string[] = [];
    const host = document.createElement("div");
    let showChild = true;

    const asyncOnCreateCleanupOutsideContract = (async () => {
      const cleanup = await deferred.promise;
      return cleanup;
    }) as unknown as Parameters<typeof onCreate>[0];

    const Child = () => {
      // Runtime-only misuse: public types reject async cleanup, but runtime should ignore it defensively.
      onCreate(asyncOnCreateCleanupOutsideContract);

      return <span>child</span>;
    };

    const Parent = () => <div>{showChild ? <Child /> : <span>empty</span>}</div>;

    expect(mount(host, Parent)).toEqual("<div><span>child</span></div>");
    expect(events).toEqual([]);

    deferred.resolve(() => {
      events.push("cleanup");
    });
    await waitForAsyncLifecycleToSettle();

    expect(host.innerHTML).toEqual("<div><span>child</span></div>");
    expect(events).toEqual([]);

    showChild = false;
    expect(update()).toEqual("<div><span>empty</span></div>");
    expect(events).toEqual([]);

    expect(unmount()).toEqual("");
    expect(events).toEqual([]);
  });

  it("reports async onCreate rejection and rerenders after the rejection settles", async () => {
    const deferred = createDeferred<void>();
    const error = new Error("boom");
    const host = document.createElement("div");
    const events: string[] = [];
    const state = { phase: "loading" };
    let showChild = true;
    const originalConsoleError = console.error;
    const reportedErrors: unknown[][] = [];

    const Child = () => {
      onCreate(async () => {
        try {
          await deferred.promise;
        } catch (caughtError) {
          state.phase = "failed";
          throw caughtError;
        }

        throw error;
      });

      return <span>{state.phase}</span>;
    };

    const Parent = () => <div>{showChild ? <Child /> : <span>empty</span>}</div>;

    try {
      console.error = ((...args: unknown[]) => {
        reportedErrors.push(args);
      }) as typeof console.error;

      expect(mount(host, Parent)).toEqual("<div><span>loading</span></div>");
      deferred.reject(error);

      await waitForAsyncLifecycleToSettle();

      expect(host.innerHTML).toEqual("<div><span>failed</span></div>");
      expect(reportedErrors).toContainEqual(["Error in onCreate:", error]);

      showChild = false;
      expect(update()).toEqual("<div><span>empty</span></div>");
      expect(events).toEqual([]);
    } finally {
      console.error = originalConsoleError;
    }
  });

  it("keeps onUpdate sync-only when a Promise is returned", async () => {
    const deferred = createDeferred<void>();
    const state = { phase: "idle", version: 0 };
    const host = document.createElement("div");
    let cleanupHits = 0;

    // Runtime-only misuse: public types keep onUpdate sync-only, but runtime should ignore async returns defensively.
    const asyncOnUpdateOutsideContract = (() =>
      deferred.promise.then(() => {
        state.phase = "settled";
        return () => {
          cleanupHits++;
        };
      })) as unknown as Parameters<typeof onUpdate>[0];

    const Component = () => {
      onUpdate(asyncOnUpdateOutsideContract);

      return (
        <div>
          <span>{state.phase}</span>
          <span>{state.version}</span>
        </div>
      );
    };

    expect(mount(host, Component)).toEqual("<div><span>idle</span><span>0</span></div>");
    await waitForAsyncLifecycleToSettle();

    state.version = 1;
    expect(update()).toEqual("<div><span>idle</span><span>1</span></div>");

    deferred.resolve();
    await waitForAsyncLifecycleToSettle();

    expect(host.innerHTML).toEqual("<div><span>idle</span><span>1</span></div>");

    expect(unmount()).toEqual("");
    expect(cleanupHits).toBe(0);
  });
});
