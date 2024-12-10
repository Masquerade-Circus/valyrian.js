/* eslint-disable no-console */
import { updateVnode, Vnode, VnodeWithDom, current } from "valyrian.js";
import { deepCloneUnfreeze, deepFreeze, hasChanged } from "valyrian.js/utils";

type State = Record<string, any>;

// An action or pulse type definition
// eslint-disable-next-line no-unused-vars
export type Pulse<StateType> = (state: StateType, ...args: any[]) => void | Promise<void>;

// A collection of pulses
export type Pulses<StateType> = {
  [key: string]: Pulse<StateType>;
};

// A proxy state
// This is a state that is proxied to automatically subscribe to changes
// And is used internally to update the vnode when the state changes
type ProxyState<StateType> = StateType & {
  [key: string]: any;
};

// The effect stack
const effectStack: Function[] = [];

// Creates the store
// eslint-disable-next-line sonarjs/cognitive-complexity
function createStore<StateType extends State, PulsesType extends Pulses<StateType>>(
  initialState: StateType | (() => StateType),
  pulses: PulsesType,
  immutable = false
): () => [ProxyState<StateType>, PulsesType] {
  const subscribers = new Set<Function>();
  const vnodesToUpdate = new WeakSet<Vnode>();

  // Initialize the localState for this store
  const localState = (typeof initialState === "function" ? initialState() : initialState) || {};

  function isMutable() {
    if (immutable) {
      throw new Error("You need to call a pulse to modify the state");
    }
  }

  // We create a proxy for the state
  const proxyState = new Proxy(localState || {}, {
    get: (state, prop: string) => {
      const currentEffect = effectStack[effectStack.length - 1];
      if (currentEffect && !subscribers.has(currentEffect)) {
        subscribers.add(currentEffect);
      }

      const currentVnode = current.vnode as VnodeWithDom;
      if (currentVnode && !vnodesToUpdate.has(currentVnode)) {
        const subscription = () => {
          if (!currentVnode.dom) {
            subscribers.delete(subscription);
            vnodesToUpdate.delete(currentVnode);
            return;
          }

          updateVnode(currentVnode);
        };

        subscribers.add(subscription);
        vnodesToUpdate.add(currentVnode);
      }

      return state[prop];
    },
    // If the user tries to set directly it will throw an error
    set: (state, prop: string, value: any) => {
      isMutable();
      Reflect.set(state, prop, value);
      return true;
    },
    // If the user tries to delete directly it will throw an error
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

  function setState(newState: StateType) {
    if (!hasChanged(localState, newState)) {
      return;
    }

    syncState(newState);

    subscribers.forEach((subscriber) => subscriber());
  }

  function getPulseMethod(key: string) {
    return (...args: any[]) => {
      const currentState = deepCloneUnfreeze(localState);
      const pulse = pulses[key](currentState, ...args);

      if (pulse instanceof Promise) {
        return pulse
          .then(() => setState(currentState))
          .catch((error) => {
            console.error("Error in pulse:", error);
          });
      }

      setState(currentState);
    };
  }

  const boundPulses: Record<string, Pulse<StateType>> = {};
  for (const key in pulses) {
    if (typeof pulses[key] !== "function") {
      throw new Error(`Pulse '${key}' must be a function`);
    }
    boundPulses[key] = getPulseMethod(key);
  }

  const pulsesProxy = new Proxy(boundPulses, {
    get: (pulses, prop: string) => {
      if (!(prop in pulses)) {
        throw new Error(`Pulse '${prop}' does not exist`);
      }
      return pulses[prop];
    }
  });

  function usePulseStore(): [ProxyState<StateType>, PulsesType] {
    return [proxyState, pulsesProxy as PulsesType];
  }

  syncState(localState);

  return usePulseStore;
}

// Creates a pulse store with an immutable state by default
export function createPulseStore<StateType extends State, PulsesType extends Pulses<StateType>>(
  initialState: StateType,
  pulses: PulsesType
): () => [ProxyState<StateType>, PulsesType] {
  return createStore(initialState, pulses, true);
}

// Creates a mutable store, useful for performance, but not recommended
export function createMutableStore<StateType extends State, PulsesType extends Pulses<StateType>>(
  initialState: StateType,
  pulses: PulsesType
): () => [ProxyState<StateType>, PulsesType] {
  console.warn(
    "Warning: You are working with a mutable state. This can lead to unpredictable behavior. All state changes made outside of a pulse will not trigger a re-render."
  );
  return createStore(initialState, pulses, false);
}

// Creates an effect
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
