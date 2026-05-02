/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { updateVnode, VnodeWithDom, current, DomElement, preventUpdate } from "valyrian.js";
import { deepCloneUnfreeze, deepFreeze, hasChanged } from "valyrian.js/utils";

type State = Record<string, any>;

export type PulseContext = {
  $flush: () => void;
};

export type Pulse<StateType, TReturn = unknown> = (state: StateType, ...args: any[]) => TReturn | Promise<TReturn>;

type ProxyState<StateType> = StateType & { [key: string]: any };

type EffectSubscription = {
  run: Function;
  dependencies: Set<Set<Function>>;
};

type DomSubscription = {
  subscription: Function;
  subscriberSets: Set<Set<Function>>;
};

const effectStack: EffectSubscription[] = [];

type StorePulses<PulsesType> = {
  [K in keyof PulsesType]: PulsesType[K] extends (state: any, ...args: infer Args) => infer R
    ? (...args: Args) => R
    : never;
};

function addDomSubscription(subscribers: Set<Function>, domSubscription: DomSubscription): void {
  if (domSubscription.subscriberSets.has(subscribers)) {
    return;
  }

  subscribers.add(domSubscription.subscription);
  domSubscription.subscriberSets.add(subscribers);
}

function registerDomSubscription(
  subscribers: Set<Function>,
  domSubscriptions: WeakMap<DomElement, DomSubscription>,
  currentVnode: VnodeWithDom
): void {
  if (!currentVnode) {
    return;
  }

  const existingSubscription = domSubscriptions.get(currentVnode.dom);
  if (existingSubscription) {
    addDomSubscription(subscribers, existingSubscription);
    return;
  }

  let parent = currentVnode.dom.parentElement as DomElement;
  while (parent) {
    const parentSubscription = domSubscriptions.get(parent);
    if (parentSubscription) {
      addDomSubscription(subscribers, parentSubscription);
      return;
    }
    parent = parent.parentElement as DomElement;
  }

  const dom = currentVnode.dom;
  const domSubscription: DomSubscription = {
    subscription: () => {
      updateVnode(dom.vnode);
      if (!dom.parentElement) {
        for (const subscriberSet of domSubscription.subscriberSets) {
          subscriberSet.delete(domSubscription.subscription);
        }
        domSubscription.subscriberSets.clear();
        domSubscriptions.delete(dom);
      }
    },
    subscriberSets: new Set()
  };
  addDomSubscription(subscribers, domSubscription);
  domSubscriptions.set(dom, domSubscription);
}

function createStore<StateType extends State, PulsesType extends Record<string, Pulse<StateType, any>>>(
  initialState: StateType | (() => StateType) | null,
  pulses: PulsesType & ThisType<PulsesType & PulseContext>,
  immutable = false
): StorePulses<PulsesType> & {
  state: ProxyState<StateType>;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback: Function) => void;
} {
  const domSubscriptions = new WeakMap<DomElement, DomSubscription>();
  const propertySubscribers = new Map<PropertyKey, Set<Function>>();

  const getPropertySubscribers = (prop: PropertyKey) => {
    let subscribers = propertySubscribers.get(prop);
    if (!subscribers) {
      subscribers = new Set<Function>();
      propertySubscribers.set(prop, subscribers);
    }
    return subscribers;
  };

  const boundPulses: Record<string, Function> = {};
  for (const key in pulses) {
    if (typeof pulses[key] !== "function") {
      throw new Error(`Pulse '${key}' must be a function`);
    }
    if (key === "state") {
      throw new Error(`A pulse cannot be named 'state'`);
    }
    boundPulses[key] = getPulseMethod(key);
  }

  const localState: StateType =
    (typeof initialState === "function" ? initialState() : initialState) || ({} as StateType);

  function isMutable() {
    if (immutable) {
      throw new Error("You need to call a pulse to modify the state");
    }
  }

  let currentState: StateType | null = null;
  let pulseCallCount = 0;

  const proxyState = new Proxy(localState, {
    get: (state, prop: string) => {
      const currentEffect = effectStack[effectStack.length - 1];
      const currentVnode = current.vnode as VnodeWithDom;
      if (currentEffect || currentVnode) {
        const subscribers = getPropertySubscribers(prop);
        if (currentEffect) {
          currentEffect.dependencies.add(subscribers);
        }

        registerDomSubscription(subscribers, domSubscriptions, currentVnode);
      }

      return currentState ? currentState[prop] : state[prop];
    },
    set: (state, prop: string, value: any) => {
      isMutable();
      Reflect.set(state, prop, value);
      return true;
    },
    deleteProperty: (state, prop: string) => {
      isMutable();
      Reflect.deleteProperty(state, prop);
      return true;
    }
  });

  function syncState(newState: StateType) {
    for (const key in newState) {
      localState[key] = immutable ? deepFreeze(newState[key]) : newState[key];
    }
    for (const key in localState) {
      if (!(key in newState)) {
        Reflect.deleteProperty(localState, key);
      }
    }
  }

  let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  const pendingSubscribers = new Set<Function>();

  function debouncedUpdate(changedProps: Set<PropertyKey>) {
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

  function setState(newState: StateType, flush = false) {
    pulseCallCount--;

    // Always reset currentState after pulse method completes
    if (pulseCallCount <= 0 && !flush) {
      currentState = null;
      pulseCallCount = 0;
    }

    // Only trigger update if state actually changed
    if ((pulseCallCount > 0 && !flush) || !hasChanged(localState, newState)) {
      return;
    }

    const changedProps = new Set<PropertyKey>();

    for (const key in newState) {
      if (!(key in localState) || hasChanged(localState[key], newState[key])) {
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
      currentState = deepCloneUnfreeze(localState);
    }
    return currentState;
  }

  function getPulseMethod(key: string) {
    return function (this: any, ...args: any[]) {
      pulseCallCount++;

      const state = unfreezeState();

      const context = Object.create(pulses);

      context.$flush = () => {
        if (currentState) {
          setState(currentState, true);
        }
      };

      const emptyFlush = () => {};

      const handleError = (error: any) => {
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
        if (current.event) {
          preventUpdate();
          current.event.stopImmediatePropagation();
        }
        const pulseResult = pulses[key].apply(context, [state, ...args]);
        if (pulseResult instanceof Promise) {
          return pulseResult
            .then((resolvedValue) => {
              setState(state as StateType);
              context.$flush = emptyFlush;
              return resolvedValue;
            })
            .catch(handleError);
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

  const listeners: Record<string, Function[]> = {};
  const trigger = (event: string, ...args: any[]) => {
    if (listeners[event]) {
      const eventListeners = listeners[event];
      for (let i = 0; i < eventListeners.length; i++) {
        eventListeners[i](...args);
      }
    }
  };

  const pulsesProxy = new Proxy(boundPulses, {
    get: (pulses, prop: string) => {
      if (prop === "state") {
        return proxyState;
      }
      if (prop === "on") {
        return (event: string, callback: Function) => {
          if (!listeners[event]) {
            listeners[event] = [];
          }
          listeners[event].push(callback);
        };
      }
      if (prop === "off") {
        return (event: string, callback: Function) => {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter((cb) => cb !== callback);
          }
        };
      }
      if (!(prop in pulses)) {
        throw new Error(`Pulse '${prop}' does not exist`);
      }
      const pulseMethod = pulses[prop];

      return (...args: any[]) => {
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

  return pulsesProxy as StorePulses<PulsesType> & {
    state: ProxyState<StateType>;
    on: (event: string, callback: Function) => void;
    off: (event: string, callback: Function) => void;
  };
}

export function createPulseStore<StateType extends State, PulsesType extends Record<string, Pulse<StateType, any>>>(
  initialState: StateType,
  pulses: PulsesType & ThisType<PulsesType & PulseContext>
) {
  return createStore(initialState, pulses, true);
}

export function createMutableStore<StateType extends State, PulsesType extends Record<string, Pulse<StateType, any>>>(
  initialState: StateType,
  pulses: PulsesType & ThisType<PulsesType & PulseContext>
) {
  console.warn(
    "Warning: You are working with a mutable state. All state changes made outside of a pulse will not trigger a re-render."
  );
  return createStore(initialState, pulses, false);
}

export function createEffect(effect: Function): () => void {
  let currentDependencies = new Set<Set<Function>>();
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

    const nextDependencies = new Set<Set<Function>>();

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

export function createPulse<T>(initialValue: T): [() => T, (newValue: T | ((current: T) => T)) => void, () => void] {
  let value = initialValue;
  const subscribers = new Set<Function>();
  const domSubscriptions = new WeakMap<DomElement, DomSubscription>();

  const runSubscribers = () => {
    for (const subscriber of subscribers) {
      subscriber();
    }
  };

  const read = (): T => {
    const currentEffect = effectStack[effectStack.length - 1];
    if (currentEffect) {
      currentEffect.dependencies.add(subscribers);
    }
    registerDomSubscription(subscribers, domSubscriptions, current.vnode as VnodeWithDom);
    return value;
  };

  const write = (newValue: T | ((current: T) => T)): void => {
    const resolvedValue = typeof newValue === "function" ? (newValue as (current: T) => T)(value) : newValue;
    if (!hasChanged(value, resolvedValue)) {
      return;
    }
    value = resolvedValue;
    runSubscribers();
  };

  return [read, write, runSubscribers];
}
