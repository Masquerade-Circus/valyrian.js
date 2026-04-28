import "valyrian.js/node";

import { describe, expect, test as it } from "bun:test";
import { SwRuntimeManager } from "valyrian.js/sw";

describe("Service worker runtime", () => {
  it("should not register or throw when service workers are unavailable", async () => {
    let registerCalls = 0;
    const serviceWorker = {
      register: async () => {
        registerCalls++;
      }
    };
    const runtime = new SwRuntimeManager({
      runtime: {
        isNodeJs: true,
        navigator: { serviceWorker } as unknown as Navigator,
        window: null
      }
    });

    await expect(runtime.init()).resolves.toBe(runtime);
    expect(registerCalls).toEqual(0);
    expect(runtime.state.registration).toEqual(null);
  });

  it("should emit registered after successful registration", async () => {
    const registration = {
      waiting: null,
      installing: null,
      addEventListener() {},
      update() {},
      unregister: async () => true
    };
    const serviceWorker = {
      controller: null,
      register: async () => registration,
      addEventListener() {},
      removeEventListener() {}
    };
    const runtime = new SwRuntimeManager({
      runtime: {
        isNodeJs: false,
        navigator: { serviceWorker } as unknown as Navigator,
        window: null
      }
    });
    let registeredPayload: unknown = null;
    runtime.on("registered", (payload) => {
      registeredPayload = payload;
    });

    await runtime.init();

    expect(registeredPayload).toBe(registration);
  });

  it("should send SKIP_WAITING to the waiting worker when applying updates", async () => {
    const messages: unknown[] = [];
    const waiting = { postMessage: (message: unknown) => messages.push(message) };
    const registration = {
      waiting,
      installing: null,
      addEventListener() {},
      update() {},
      unregister: async () => true
    };
    const serviceWorker = {
      controller: {},
      register: async () => registration,
      addEventListener() {},
      removeEventListener() {}
    };
    const runtime = new SwRuntimeManager({
      runtime: {
        isNodeJs: false,
        navigator: { serviceWorker } as unknown as Navigator,
        window: null
      }
    });

    await runtime.init();
    runtime.applyUpdate();

    expect(messages).toEqual([{ type: "SKIP_WAITING" }]);
  });

  it("should apply an existing waiting update automatically with auto strategy", async () => {
    const messages: unknown[] = [];
    const waiting = { postMessage: (message: unknown) => messages.push(message) };
    const registration = {
      waiting,
      installing: null,
      addEventListener() {},
      update() {},
      unregister: async () => true
    };
    const serviceWorker = {
      controller: {},
      register: async () => registration,
      addEventListener() {},
      removeEventListener() {}
    };
    const runtime = new SwRuntimeManager({
      strategy: "auto",
      runtime: {
        isNodeJs: false,
        navigator: { serviceWorker } as unknown as Navigator,
        window: null
      }
    });

    await runtime.init();

    expect(messages).toEqual([{ type: "SKIP_WAITING" }]);
  });

  it("should clear update state and emit updated on controllerchange", async () => {
    const waiting = { postMessage() {} };
    const listeners = new Map<string, EventListener>();
    const registration = {
      waiting,
      installing: null,
      addEventListener() {},
      update() {},
      unregister: async () => true
    };
    const serviceWorker = {
      controller: {},
      register: async () => registration,
      addEventListener: (event: string, listener: EventListener) => listeners.set(event, listener),
      removeEventListener() {}
    };
    let reloads = 0;
    const runtime = new SwRuntimeManager({
      runtime: {
        isNodeJs: false,
        navigator: { serviceWorker } as unknown as Navigator,
        window: { location: { reload: () => reloads++ } } as unknown as Window
      }
    });
    let updatedCount = 0;
    runtime.on("updated", () => {
      updatedCount++;
    });

    await runtime.init();
    listeners.get("controllerchange")?.(new Event("controllerchange"));

    expect(runtime.state.updateAvailable).toEqual(false);
    expect(runtime.state.waiting).toEqual(null);
    expect(updatedCount).toEqual(1);
    expect(reloads).toEqual(1);
  });

  it("should not reload on controllerchange when strategy is manual", async () => {
    const waiting = { postMessage() {} };
    const listeners = new Map<string, EventListener>();
    const registration = {
      waiting,
      installing: null,
      addEventListener() {},
      update() {},
      unregister: async () => true
    };
    const serviceWorker = {
      controller: {},
      register: async () => registration,
      addEventListener: (event: string, listener: EventListener) => listeners.set(event, listener),
      removeEventListener() {}
    };
    let reloads = 0;
    const runtime = new SwRuntimeManager({
      strategy: "manual",
      runtime: {
        isNodeJs: false,
        navigator: { serviceWorker } as unknown as Navigator,
        window: { location: { reload: () => reloads++ } } as unknown as Window
      }
    });

    await runtime.init();
    listeners.get("controllerchange")?.(new Event("controllerchange"));

    expect(reloads).toEqual(0);
  });

  it("should check for service worker updates when registered", async () => {
    let updateCalls = 0;
    const registration = {
      waiting: null,
      installing: null,
      addEventListener() {},
      update: async () => {
        updateCalls++;
      },
      unregister: async () => true
    };
    const serviceWorker = {
      controller: null,
      register: async () => registration,
      addEventListener() {},
      removeEventListener() {}
    };
    const runtime = new SwRuntimeManager({
      runtime: {
        isNodeJs: false,
        navigator: { serviceWorker } as unknown as Navigator,
        window: null
      }
    });

    await runtime.init();
    await runtime.checkForUpdate();

    expect(updateCalls).toEqual(1);
  });

  it("should skip update checks when no registration exists", async () => {
    const runtime = new SwRuntimeManager({
      runtime: {
        isNodeJs: true,
        navigator: null,
        window: null
      }
    });

    await expect(runtime.checkForUpdate()).resolves.toEqual(undefined);
  });

  it("should clear state after successful unregister", async () => {
    const waiting = { postMessage() {} };
    const listeners = new Map<string, EventListener>();
    const registration = {
      waiting,
      installing: null,
      addEventListener() {},
      update() {},
      unregister: async () => true
    };
    const serviceWorker = {
      controller: {},
      register: async () => registration,
      addEventListener: (event: string, listener: EventListener) => listeners.set(event, listener),
      removeEventListener: (event: string) => listeners.delete(event)
    };
    const runtime = new SwRuntimeManager({
      runtime: {
        isNodeJs: false,
        navigator: { serviceWorker } as unknown as Navigator,
        window: null
      }
    });

    await runtime.init();
    const unregistered = await runtime.unregister();

    expect(unregistered).toEqual(true);
    expect(runtime.state).toEqual({
      registration: null,
      waiting: null,
      updateAvailable: false,
      installing: false
    });
    expect(listeners.size).toEqual(0);
  });

  it("should keep state when unregister returns false", async () => {
    const waiting = { postMessage() {} };
    const registration = {
      waiting,
      installing: null,
      addEventListener() {},
      update() {},
      unregister: async () => false
    };
    const serviceWorker = {
      controller: {},
      register: async () => registration,
      addEventListener() {},
      removeEventListener() {}
    };
    const runtime = new SwRuntimeManager({
      runtime: {
        isNodeJs: false,
        navigator: { serviceWorker } as unknown as Navigator,
        window: null
      }
    });

    await runtime.init();
    const stateBeforeUnregister = runtime.state;
    const unregistered = await runtime.unregister();

    expect(unregistered).toEqual(false);
    expect(runtime.state).toEqual(stateBeforeUnregister);
  });
});
