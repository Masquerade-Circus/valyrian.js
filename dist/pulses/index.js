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

// lib/pulses/index.ts
var index_exports = {};
__export(index_exports, {
  createEffect: () => createEffect,
  createMutableStore: () => createMutableStore,
  createPulse: () => createPulse,
  createPulseStore: () => createPulseStore
});
module.exports = __toCommonJS(index_exports);
var import_valyrian = require("valyrian.js");
var import_utils = require("valyrian.js/utils");
var effectStack = [];
function addDomSubscription(subscribers, domSubscription) {
  if (domSubscription.subscriberSets.has(subscribers)) {
    return;
  }
  subscribers.add(domSubscription.subscription);
  domSubscription.subscriberSets.add(subscribers);
}
function registerDomSubscription(subscribers, domSubscriptions, currentVnode) {
  if (!currentVnode) {
    return;
  }
  const existingSubscription = domSubscriptions.get(currentVnode.dom);
  if (existingSubscription) {
    addDomSubscription(subscribers, existingSubscription);
    return;
  }
  let parent = currentVnode.dom.parentElement;
  while (parent) {
    const parentSubscription = domSubscriptions.get(parent);
    if (parentSubscription) {
      addDomSubscription(subscribers, parentSubscription);
      return;
    }
    parent = parent.parentElement;
  }
  const dom = currentVnode.dom;
  const domSubscription = {
    subscription: () => {
      (0, import_valyrian.updateVnode)(dom.vnode);
      if (!dom.parentElement) {
        for (const subscriberSet of domSubscription.subscriberSets) {
          subscriberSet.delete(domSubscription.subscription);
        }
        domSubscription.subscriberSets.clear();
        domSubscriptions.delete(dom);
      }
    },
    subscriberSets: /* @__PURE__ */ new Set()
  };
  addDomSubscription(subscribers, domSubscription);
  domSubscriptions.set(dom, domSubscription);
}
function createStore(initialState, pulses, immutable = false) {
  const domSubscriptions = /* @__PURE__ */ new WeakMap();
  const propertySubscribers = /* @__PURE__ */ new Map();
  const getPropertySubscribers = (prop) => {
    let subscribers = propertySubscribers.get(prop);
    if (!subscribers) {
      subscribers = /* @__PURE__ */ new Set();
      propertySubscribers.set(prop, subscribers);
    }
    return subscribers;
  };
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
      const currentEffect = effectStack[effectStack.length - 1];
      const currentVnode = import_valyrian.current.vnode;
      if (currentEffect || currentVnode) {
        const subscribers = getPropertySubscribers(prop);
        if (currentEffect) {
          currentEffect.dependencies.add(subscribers);
        }
        registerDomSubscription(subscribers, domSubscriptions, currentVnode);
      }
      return currentState ? currentState[prop] : state[prop];
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
  const pendingSubscribers = /* @__PURE__ */ new Set();
  function debouncedUpdate(changedProps) {
    for (const prop of changedProps) {
      const subscribers = propertySubscribers.get(prop);
      if (!subscribers) {
        continue;
      }
      for (const subscriber of subscribers) {
        pendingSubscribers.add(subscriber);
      }
    }
    if (pendingSubscribers.size === 0) {
      return;
    }
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(() => {
      const subscribersToNotify = Array.from(pendingSubscribers);
      pendingSubscribers.clear();
      debounceTimeout = null;
      for (let i = 0; i < subscribersToNotify.length; i++) {
        subscribersToNotify[i]();
      }
    }, 0);
  }
  function setState(newState, flush = false) {
    pulseCallCount--;
    if (pulseCallCount <= 0 && !flush) {
      currentState = null;
      pulseCallCount = 0;
    }
    if (pulseCallCount > 0 && !flush || !(0, import_utils.hasChanged)(localState, newState)) {
      return;
    }
    const changedProps = /* @__PURE__ */ new Set();
    for (const key in newState) {
      if (!(key in localState) || (0, import_utils.hasChanged)(localState[key], newState[key])) {
        changedProps.add(key);
      }
    }
    for (const key in localState) {
      if (!(key in newState)) {
        changedProps.add(key);
      }
    }
    syncState(newState);
    debouncedUpdate(changedProps);
  }
  function unfreezeState() {
    if (currentState === null) {
      currentState = (0, import_utils.deepCloneUnfreeze)(localState);
    }
    return currentState;
  }
  function getPulseMethod(key) {
    return function(...args) {
      pulseCallCount++;
      const state = unfreezeState();
      const context = Object.create(pulses);
      context.$flush = () => {
        if (currentState) {
          setState(currentState, true);
        }
      };
      const emptyFlush = () => {
      };
      const handleError = (error) => {
        console.error(`Error in pulse '${key}':`, error);
        context.$flush = emptyFlush;
        pulseCallCount--;
        if (pulseCallCount <= 0) {
          currentState = null;
          pulseCallCount = 0;
        }
        throw error;
      };
      try {
        if (import_valyrian.current.event) {
          (0, import_valyrian.preventUpdate)();
          import_valyrian.current.event.stopImmediatePropagation();
        }
        const pulseResult = pulses[key].apply(context, [state, ...args]);
        if (pulseResult instanceof Promise) {
          return pulseResult.then((resolvedValue) => {
            setState(state);
            context.$flush = emptyFlush;
            return resolvedValue;
          }).catch(handleError);
        } else {
          setState(state);
          context.$flush = emptyFlush;
          return pulseResult;
        }
      } catch (error) {
        handleError(error);
      }
    };
  }
  syncState(localState);
  const listeners = {};
  const trigger = (event, ...args) => {
    if (listeners[event]) {
      const eventListeners = listeners[event];
      for (let i = 0; i < eventListeners.length; i++) {
        eventListeners[i](...args);
      }
    }
  };
  const pulsesProxy = new Proxy(boundPulses, {
    get: (pulses2, prop) => {
      if (prop === "state") {
        return proxyState;
      }
      if (prop === "on") {
        return (event, callback) => {
          if (!listeners[event]) {
            listeners[event] = [];
          }
          listeners[event].push(callback);
        };
      }
      if (prop === "off") {
        return (event, callback) => {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter((cb) => cb !== callback);
          }
        };
      }
      if (!(prop in pulses2)) {
        throw new Error(`Pulse '${prop}' does not exist`);
      }
      const pulseMethod = pulses2[prop];
      return (...args) => {
        const result = pulseMethod.apply(pulseMethod, args);
        if (result instanceof Promise) {
          return result.then((r) => {
            trigger("pulse", prop, args);
            return r;
          });
        }
        trigger("pulse", prop, args);
        return result;
      };
    }
  });
  return pulsesProxy;
}
function createPulseStore(initialState, pulses) {
  return createStore(initialState, pulses, true);
}
function createMutableStore(initialState, pulses) {
  console.warn(
    "Warning: You are working with a mutable state. All state changes made outside of a pulse will not trigger a re-render."
  );
  return createStore(initialState, pulses, false);
}
function createEffect(effect) {
  let currentDependencies = /* @__PURE__ */ new Set();
  let disposed = false;
  const cleanupDependencies = () => {
    for (const dependency of currentDependencies) {
      dependency.delete(runEffect);
    }
    currentDependencies.clear();
  };
  const runEffect = () => {
    if (disposed) {
      return;
    }
    const nextDependencies = /* @__PURE__ */ new Set();
    try {
      effectStack.push({ run: runEffect, dependencies: nextDependencies });
      effect();
    } finally {
      effectStack.pop();
    }
    for (const dependency of currentDependencies) {
      if (!nextDependencies.has(dependency)) {
        dependency.delete(runEffect);
      }
    }
    for (const dependency of nextDependencies) {
      if (!currentDependencies.has(dependency)) {
        dependency.add(runEffect);
      }
    }
    currentDependencies = nextDependencies;
  };
  runEffect();
  return () => {
    disposed = true;
    cleanupDependencies();
  };
}
function createPulse(initialValue) {
  let value = initialValue;
  const subscribers = /* @__PURE__ */ new Set();
  const domSubscriptions = /* @__PURE__ */ new WeakMap();
  const runSubscribers = () => {
    for (const subscriber of subscribers) {
      subscriber();
    }
  };
  const read = () => {
    const currentEffect = effectStack[effectStack.length - 1];
    if (currentEffect) {
      currentEffect.dependencies.add(subscribers);
    }
    registerDomSubscription(subscribers, domSubscriptions, import_valyrian.current.vnode);
    return value;
  };
  const write = (newValue) => {
    const resolvedValue = typeof newValue === "function" ? newValue(value) : newValue;
    if (!(0, import_utils.hasChanged)(value, resolvedValue)) {
      return;
    }
    value = resolvedValue;
    runSubscribers();
  };
  return [read, write, runSubscribers];
}
