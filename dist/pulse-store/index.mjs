// lib/pulse-store/index.ts
import { updateVnode, current } from "valyrian.js";
import { deepCloneUnfreeze, deepFreeze, hasChanged } from "valyrian.js/utils";
var effectStack = [];
function createStore(initialState, pulses, immutable = false) {
  const subscribers = /* @__PURE__ */ new Set();
  const domWithVnodesToUpdate = /* @__PURE__ */ new WeakSet();
  const boundPulses = {};
  for (const key in pulses) {
    if (typeof pulses[key] !== "function") {
      throw new Error(`Pulse '${key}' must be a function`);
    }
    if (key === "state") {
      throw new Error(`A pulse cannot be named 'state'`);
    }
    boundPulses[key] = getPulseMethod(key);
  }
  const localState = (typeof initialState === "function" ? initialState() : initialState) || {};
  function isMutable() {
    if (immutable) {
      throw new Error("You need to call a pulse to modify the state");
    }
  }
  const proxyState = new Proxy(localState, {
    get: (state, prop) => {
      const currentEffect = effectStack[effectStack.length - 1];
      if (currentEffect && !subscribers.has(currentEffect)) {
        subscribers.add(currentEffect);
      }
      const currentVnode = current.vnode;
      if (currentVnode && !domWithVnodesToUpdate.has(currentVnode.dom)) {
        const dom = currentVnode.dom;
        const subscription = () => {
          if (!dom.parentNode) {
            subscribers.delete(subscription);
            domWithVnodesToUpdate.delete(dom);
            return;
          }
          updateVnode(dom.vnode);
        };
        subscribers.add(subscription);
        domWithVnodesToUpdate.add(dom);
      }
      return state[prop];
    },
    set: (state, prop, value) => {
      isMutable();
      Reflect.set(state, prop, value);
      return true;
    },
    deleteProperty: (state, prop) => {
      isMutable();
      Reflect.deleteProperty(state, prop);
      return true;
    }
  });
  function syncState(newState) {
    for (const key in newState) {
      localState[key] = immutable ? deepFreeze(newState[key]) : newState[key];
    }
    for (const key in localState) {
      if (!(key in newState)) {
        Reflect.deleteProperty(localState, key);
      }
    }
  }
  let debounceTimeout = null;
  function debouncedUpdate() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => subscribers.forEach((subscriber) => subscriber()), 0);
  }
  function setState(newState) {
    if (!hasChanged(localState, newState)) {
      return;
    }
    syncState(newState);
    debouncedUpdate();
  }
  function getPulseMethod(key) {
    return (...args) => {
      const currentState = deepCloneUnfreeze(localState);
      const pulse = pulses[key](currentState, ...args);
      if (pulse instanceof Promise) {
        return pulse.then(() => setState(currentState)).catch((error) => {
          console.error("Error in pulse:", error);
        });
      }
      setState(currentState);
    };
  }
  syncState(localState);
  const pulsesProxy = new Proxy(boundPulses, {
    get: (pulses2, prop) => {
      if (prop === "state") {
        return proxyState;
      }
      if (!(prop in pulses2)) {
        throw new Error(`Pulse '${prop}' does not exist`);
      }
      return pulses2[prop];
    }
  });
  return pulsesProxy;
}
function createPulseStore(initialState, pulses) {
  return createStore(initialState, pulses, true);
}
function createMutableStore(initialState, pulses) {
  console.warn(
    "Warning: You are working with a mutable state. This can lead to unpredictable behavior. All state changes made outside of a pulse will not trigger a re-render."
  );
  return createStore(initialState, pulses, false);
}
function createEffect(effect, dependencies) {
  const runEffect = () => {
    try {
      effectStack.push(runEffect);
      effect();
    } finally {
      effectStack.pop();
    }
  };
  runEffect();
}
export {
  createEffect,
  createMutableStore,
  createPulseStore
};
