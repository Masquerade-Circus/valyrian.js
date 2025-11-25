// lib/pulses/index.ts
import { updateVnode, current } from "valyrian.js";
import { deepCloneUnfreeze, deepFreeze, hasChanged } from "valyrian.js/utils";
var effectStack = [];
function registerDomSubscription(subscribers, domWithVnodesToUpdate) {
  const currentVnode = current.vnode;
  if (!currentVnode || domWithVnodesToUpdate.has(currentVnode.dom)) {
    return;
  }
  let hasParent = false;
  let parent = currentVnode.dom.parentElement;
  while (parent) {
    if (domWithVnodesToUpdate.has(parent)) {
      hasParent = true;
      break;
    }
    parent = parent.parentElement;
  }
  if (!hasParent) {
    const dom = currentVnode.dom;
    const subscription = () => {
      updateVnode(dom.vnode);
      if (!dom.parentElement) {
        subscribers.delete(subscription);
        domWithVnodesToUpdate.delete(dom);
      }
    };
    subscribers.add(subscription);
    domWithVnodesToUpdate.add(dom);
  }
}
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
      registerDomSubscription(subscribers, domWithVnodesToUpdate);
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
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(() => subscribers.forEach((subscriber) => subscriber()), 0);
  }
  function setState(newState, flush = false) {
    pulseCallCount--;
    if (!hasChanged(localState, newState)) {
      return;
    }
    if (pulseCallCount > 0 && !flush) {
      return;
    }
    syncState(newState);
    currentState = null;
    debouncedUpdate();
  }
  function getPulseMethod(key) {
    return function(...args) {
      pulseCallCount++;
      if (currentState === null) {
        currentState = deepCloneUnfreeze(localState);
      }
      const context = Object.create(pulses);
      context.$flush = async () => {
        if (currentState) {
          setState(currentState, true);
          currentState = deepCloneUnfreeze(localState);
        }
        await new Promise((resolve) => setTimeout(resolve, 0));
      };
      const emptyFlush = async () => {
      };
      try {
        const pulseResult = pulses[key].apply(context, [currentState, ...args]);
        if (pulseResult instanceof Promise) {
          return pulseResult.then((resolvedValue) => {
            setState(currentState);
            context.$flush = emptyFlush;
            return resolvedValue;
          }).catch((error) => {
            console.error(`Error in pulse '${key}':`, error);
            context.$flush = emptyFlush;
            throw error;
          });
        } else {
          setState(currentState);
          context.$flush = emptyFlush;
          return pulseResult;
        }
      } catch (error) {
        console.error(`Error in pulse '${key}':`, error);
        context.$flush = emptyFlush;
        throw error;
      }
    };
  }
  syncState(localState);
  const listeners = {};
  const trigger = (event, ...args) => {
    if (listeners[event]) {
      listeners[event].forEach((callback) => callback(...args));
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
function createPulse(initialValue) {
  let value = initialValue;
  const subscribers = /* @__PURE__ */ new Set();
  const domWithVnodesToUpdate = /* @__PURE__ */ new WeakSet();
  const runSubscribers = () => {
    subscribers.forEach((subscriber) => subscriber());
  };
  const read = () => {
    const currentEffect = effectStack[effectStack.length - 1];
    if (currentEffect && !subscribers.has(currentEffect)) {
      subscribers.add(currentEffect);
    }
    registerDomSubscription(subscribers, domWithVnodesToUpdate);
    return value;
  };
  const write = (newValue) => {
    const resolvedValue = typeof newValue === "function" ? newValue(value) : newValue;
    if (!hasChanged(value, resolvedValue)) {
      return;
    }
    value = resolvedValue;
    runSubscribers();
  };
  return [read, write, runSubscribers];
}
export {
  createEffect,
  createMutableStore,
  createPulse,
  createPulseStore
};
