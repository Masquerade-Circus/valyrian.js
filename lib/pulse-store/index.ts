/* eslint-disable no-console */
import { updateVnode, VnodeWithDom, current, DomElement } from "valyrian.js";
import { deepCloneUnfreeze, deepFreeze, hasChanged } from "valyrian.js/utils";

type State = Record<string, any>;

export type Pulse<StateType, TReturn = unknown> = (state: StateType, ...args: any[]) => TReturn | Promise<TReturn>;

export type Pulses<StateType> = Record<string, Pulse<StateType, any>>;

type ProxyState<StateType> = StateType & {
  [key: string]: any;
};

const effectStack: Function[] = [];

type StorePulses<PulsesType extends Pulses<any>> = {
  [K in keyof PulsesType]: PulsesType[K] extends (state: any, ...args: infer Args) => infer R
    ? (...args: Args) => R
    : never;
};

// Crea la tienda
function createStore<StateType extends State, PulsesType extends Pulses<StateType>>(
  initialState: StateType | (() => StateType) | null,
  pulses: PulsesType,
  immutable = false
): StorePulses<PulsesType> & { state: ProxyState<StateType> } {
  const subscribers = new Set<Function>();
  const domWithVnodesToUpdate = new WeakSet<DomElement>();

  const boundPulses: Record<string, Pulse<StateType, any>> = {};
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
      // If there is a current state, return the value from it
      // because we are inside a pulse
      if (currentState) {
        return currentState[prop];
      }

      const currentEffect = effectStack[effectStack.length - 1];
      if (currentEffect && !subscribers.has(currentEffect)) {
        subscribers.add(currentEffect);
      }

      const currentVnode = current.vnode as VnodeWithDom;
      if (currentVnode && !domWithVnodesToUpdate.has(currentVnode.dom)) {
        let hasParent = false;
        let parent = currentVnode.dom.parentElement as DomElement;
        while (parent) {
          if (domWithVnodesToUpdate.has(parent)) {
            hasParent = true;
            break;
          }
          parent = parent.parentElement as DomElement;
        }

        if (hasParent) {
          return state[prop];
        }

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

  function setState(newState: StateType) {
    pulseCallCount--;

    if (!hasChanged(localState, newState)) {
      return;
    }

    if (pulseCallCount > 0) {
      return;
    }

    syncState(newState);
    currentState = null;
    debouncedUpdate();
  }

  function getPulseMethod(key: string) {
    return (...args: any[]) => {
      pulseCallCount++;

      if (currentState === null) {
        currentState = deepCloneUnfreeze(localState);
      }

      try {
        const pulseResult = pulses[key](currentState, ...args);

        if (pulseResult instanceof Promise) {
          return pulseResult
            .then((resolvedValue) => {
              setState(currentState as StateType);
              return resolvedValue;
            })
            .catch((error) => {
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
    get: (pulses, prop: string) => {
      if (prop === "state") {
        return proxyState;
      }

      if (!(prop in pulses)) {
        throw new Error(`Pulse '${prop}' does not exist`);
      }
      return pulses[prop];
    }
  });

  return pulsesProxy as StorePulses<PulsesType> & { state: ProxyState<StateType> };
}

// Create a immutable store with an unfrozen state, balance between security and flexibility
export function createPulseStore<StateType extends State, PulsesType extends Pulses<StateType>>(
  initialState: StateType,
  pulses: PulsesType
): StorePulses<PulsesType> & { state: ProxyState<StateType> } {
  return createStore(initialState, pulses, true);
}

// Create a mutable store with a unfrozen state to allow more flexibility
export function createMutableStore<StateType extends State, PulsesType extends Pulses<StateType>>(
  initialState: StateType,
  pulses: PulsesType
): StorePulses<PulsesType> & { state: ProxyState<StateType> } {
  console.warn(
    "Warning: You are working with a mutable state. This can lead to unpredictable behavior. All state changes made outside of a pulse will not trigger a re-render."
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
