/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { updateVnode, VnodeWithDom, current, DomElement } from "valyrian.js";
import { deepCloneUnfreeze, deepFreeze, hasChanged } from "valyrian.js/utils";

type State = Record<string, any>;

export type PulseContext = {
  $flush: () => Promise<void>;
};

export type Pulse<StateType, TReturn = unknown> = (state: StateType, ...args: any[]) => TReturn | Promise<TReturn>;

type ProxyState<StateType> = StateType & { [key: string]: any };

const effectStack: Function[] = [];

type StorePulses<PulsesType> = {
  [K in keyof PulsesType]: PulsesType[K] extends (state: any, ...args: infer Args) => infer R
    ? (...args: Args) => R
    : never;
};

function registerDomSubscription(subscribers: Set<Function>, domWithVnodesToUpdate: WeakSet<DomElement>): void {
  const currentVnode = current.vnode as VnodeWithDom;
  if (!currentVnode || domWithVnodesToUpdate.has(currentVnode.dom)) {
    return;
  }

  let hasParent = false;
  let parent = currentVnode.dom.parentElement as DomElement;
  while (parent) {
    if (domWithVnodesToUpdate.has(parent)) {
      hasParent = true;
      break;
    }
    parent = parent.parentElement as DomElement;
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

function createStore<StateType extends State, PulsesType extends Record<string, Pulse<StateType, any>>>(
  initialState: StateType | (() => StateType) | null,
  pulses: PulsesType & ThisType<PulsesType & PulseContext>,
  immutable = false
): StorePulses<PulsesType> & {
  state: ProxyState<StateType>;
  on: (event: string, callback: Function) => void;
  off: (event: string, callback: Function) => void;
} {
  const subscribers = new Set<Function>();
  const domWithVnodesToUpdate = new WeakSet<DomElement>();

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
  function debouncedUpdate() {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(() => subscribers.forEach((subscriber) => subscriber()), 0);
  }

  function setState(newState: StateType, flush = false) {
    pulseCallCount--;
    if (!hasChanged(localState, newState)) {
      return;
    }
    if (pulseCallCount > 0 && !flush) {
      return;
    }
    syncState(newState);
    if (!flush) {
      currentState = null;
    }
    pulseCallCount = 0;
    debouncedUpdate();
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

      context.$flush = async () => {
        if (currentState) {
          setState(currentState, true);
        }
      };

      const emptyFlush = async () => {};

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
          current.event.preventDefault();
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
      listeners[event].forEach((callback) => callback(...args));
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

export function createEffect(effect: Function) {
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

export function createPulse<T>(initialValue: T): [() => T, (newValue: T | ((current: T) => T)) => void, () => void] {
  let value = initialValue;
  const subscribers = new Set<Function>();
  const domWithVnodesToUpdate = new WeakSet<DomElement>();

  const runSubscribers = () => {
    subscribers.forEach((subscriber) => subscriber());
  };

  const read = (): T => {
    const currentEffect = effectStack[effectStack.length - 1];
    if (currentEffect && !subscribers.has(currentEffect)) {
      subscribers.add(currentEffect);
    }
    registerDomSubscription(subscribers, domWithVnodesToUpdate);
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
