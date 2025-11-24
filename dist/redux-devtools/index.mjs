// lib/redux-devtools/index.ts
function getDevTools() {
  const isBrowser = typeof window !== "undefined";
  if (isBrowser && window.__REDUX_DEVTOOLS_EXTENSION__) {
    return window.__REDUX_DEVTOOLS_EXTENSION__;
  }
  return null;
}
function connectFluxStore(store, options = {}) {
  const devTools = getDevTools();
  if (!devTools) {
    return;
  }
  const name = options.name || "FluxStore";
  const dt = devTools.connect({ name, ...options });
  dt.init(store.state);
  store.on("commit", (_, mutation, ...args) => {
    dt.send({ type: mutation, payload: args }, store.state);
  });
  store.on("registerModule", (_, namespace) => {
    dt.send({ type: `[Module] Register: ${namespace}` }, store.state);
  });
  store.on("unregisterModule", (_, namespace) => {
    dt.send({ type: `[Module] Unregister: ${namespace}` }, store.state);
  });
}
function connectPulseStore(store, options = {}) {
  const devTools = getDevTools();
  if (!devTools) {
    return;
  }
  const name = options.name || "PulseStore";
  const dt = devTools.connect({ name, ...options });
  dt.init(store.state);
  if (store.on) {
    store.on("pulse", (pulse, args) => {
      dt.send({ type: pulse, payload: args }, store.state);
    });
  }
}
function connectPulse(pulse, options = {}) {
  const devTools = getDevTools();
  if (!devTools) {
    return pulse;
  }
  const name = options.name || "Pulse";
  const dt = devTools.connect({ name, ...options });
  const [read, write, run] = pulse;
  dt.init(read());
  const newWrite = (newValue) => {
    write(newValue);
    dt.send({ type: "update", payload: newValue }, read());
  };
  return [read, newWrite, run];
}
export {
  connectFluxStore,
  connectPulse,
  connectPulseStore
};
