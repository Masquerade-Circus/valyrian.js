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

// lib/pulse-store/index.ts
var pulse_store_exports = {};
__export(pulse_store_exports, {
  createEffect: () => createEffect,
  createMutableStore: () => createMutableStore,
  createPulseStore: () => createPulseStore
});
module.exports = __toCommonJS(pulse_store_exports);
var import_valyrian = require("valyrian.js");
var import_utils = require("valyrian.js/utils");
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
  let currentState = null;
  let pulseCallCount = 0;
  const proxyState = new Proxy(localState, {
    get: (state, prop) => {
      if (currentState) {
        return currentState[prop];
      }
      const currentEffect = effectStack[effectStack.length - 1];
      if (currentEffect && !subscribers.has(currentEffect)) {
        subscribers.add(currentEffect);
      }
      const currentVnode = import_valyrian.current.vnode;
      if (currentVnode && !domWithVnodesToUpdate.has(currentVnode.dom)) {
        let hasParent = false;
        let parent = currentVnode.dom.parentElement;
        while (parent) {
          if (domWithVnodesToUpdate.has(parent)) {
            hasParent = true;
            break;
          }
          parent = parent.parentElement;
        }
        if (hasParent) {
          return state[prop];
        }
        const dom = currentVnode.dom;
        const subscription = () => {
          (0, import_valyrian.updateVnode)(dom.vnode);
          if (!dom.parentElement) {
            subscribers.delete(subscription);
            domWithVnodesToUpdate.delete(dom);
          }
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
      localState[key] = immutable ? (0, import_utils.deepFreeze)(newState[key]) : newState[key];
    }
    for (const key in localState) {
      if (!(key in newState)) {
        Reflect.deleteProperty(localState, key);
      }
    }
  }
  let debounceTimeout = null;
  function debouncedUpdate() {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(() => subscribers.forEach((subscriber) => subscriber()), 0);
  }
  function setState(newState) {
    pulseCallCount--;
    if (!(0, import_utils.hasChanged)(localState, newState)) {
      return;
    }
    if (pulseCallCount > 0) {
      return;
    }
    syncState(newState);
    currentState = null;
    debouncedUpdate();
  }
  function getPulseMethod(key) {
    return (...args) => {
      pulseCallCount++;
      if (currentState === null) {
        currentState = (0, import_utils.deepCloneUnfreeze)(localState);
      }
      try {
        const pulseResult = pulses[key](currentState, ...args);
        if (pulseResult instanceof Promise) {
          return pulseResult.then((resolvedValue) => {
            setState(currentState);
            return resolvedValue;
          }).catch((error) => {
            console.error(`Error in pulse '${key}':`, error);
            throw error;
          });
        } else {
          setState(currentState);
          return pulseResult;
        }
      } catch (error) {
        console.error(`Error in pulse '${key}':`, error);
        throw error;
      }
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
function createEffect(effect) {
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
