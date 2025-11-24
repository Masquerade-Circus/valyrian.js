/* eslint-disable no-console */
import { FluxStore } from "valyrian.js/flux-store";

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: any;
  }
}

interface DevToolsOptions {
  name?: string;
  [key: string]: any;
}

function getDevTools() {
  const isBrowser = typeof window !== "undefined";
  if (isBrowser && window.__REDUX_DEVTOOLS_EXTENSION__) {
    return window.__REDUX_DEVTOOLS_EXTENSION__;
  }
  return null;
}

export function connectFluxStore(store: FluxStore, options: DevToolsOptions = {}) {
  const devTools = getDevTools();
  if (!devTools) {
    return;
  }

  const name = options.name || "FluxStore";
  const dt = devTools.connect({ name, ...options });
  dt.init(store.state);

  store.on("commit", (_: any, mutation: string, ...args: any[]) => {
    dt.send({ type: mutation, payload: args }, store.state);
  });

  store.on("registerModule", (_: any, namespace: string) => {
    dt.send({ type: `[Module] Register: ${namespace}` }, store.state);
  });

  store.on("unregisterModule", (_: any, namespace: string) => {
    dt.send({ type: `[Module] Unregister: ${namespace}` }, store.state);
  });
}

export function connectPulseStore(store: any, options: DevToolsOptions = {}) {
  const devTools = getDevTools();
  if (!devTools) {
    return;
  }

  const name = options.name || "PulseStore";
  const dt = devTools.connect({ name, ...options });
  dt.init(store.state);

  if (store.on) {
    store.on("pulse", (pulse: string, args: any[]) => {
      dt.send({ type: pulse, payload: args }, store.state);
    });
  }
}

export function connectPulse(pulse: any, options: DevToolsOptions = {}) {
  // Pulse is [read, write, runSubscribers]
  // We can't easily hook into the write function without wrapping it.
  // But the user asked for "simple" and "using existing apis".
  // If we want to debug individual pulses, we might need to wrap them.

  const devTools = getDevTools();
  if (!devTools) {
    return pulse;
  }

  const name = options.name || "Pulse";
  const dt = devTools.connect({ name, ...options });
  const [read, write, run] = pulse;
  
  dt.init(read());

  const newWrite = (newValue: any) => {
    write(newValue);
    dt.send({ type: "update", payload: newValue }, read());
  };

  return [read, newWrite, run];
}
