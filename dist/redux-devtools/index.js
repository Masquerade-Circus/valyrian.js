"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/redux-devtools/index.ts
var index_exports = {};
__export(index_exports, {
  connectFluxStore: () => connectFluxStore,
  connectPulse: () => connectPulse,
  connectPulseStore: () => connectPulseStore
});
module.exports = __toCommonJS(index_exports);
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
