/* eslint-disable no-console */
import { updateVnode, VnodeWithDom, current, DomElement } from "valyrian.js";
import { deepCloneUnfreeze, deepFreeze, hasChanged } from "valyrian.js/utils";

type State = Record<string, any>;

// Tipo de acción o pulso
export type Pulse<StateType> = (state: StateType, ...args: any[]) => void | Promise<void>;

// Colección de pulsos
export type Pulses<StateType> = {
  [key: string]: Pulse<StateType>;
};

// Estado proxy que observará el acceso y las mutaciones del estado
type ProxyState<StateType> = StateType & {
  [key: string]: any;
};

// Pila de efectos
const effectStack: Function[] = [];

type StorePulses<PulsesType> = {
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

  const boundPulses: Record<string, Pulse<StateType>> = {};
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

  const proxyState = new Proxy(localState, {
    get: (state, prop: string) => {
      const currentEffect = effectStack[effectStack.length - 1];
      if (currentEffect && !subscribers.has(currentEffect)) {
        subscribers.add(currentEffect);
      }

      const currentVnode = current.vnode as VnodeWithDom;
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

  let debounceTimeout: any = null;
  function debouncedUpdate() {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => subscribers.forEach((subscriber) => subscriber()), 0);
  }

  function setState(newState: StateType) {
    if (!hasChanged(localState, newState)) {
      return;
    }

    syncState(newState);
    debouncedUpdate();
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

// Crea una tienda inmutable
export function createPulseStore<StateType extends State, PulsesType extends Pulses<StateType>>(
  initialState: StateType,
  pulses: PulsesType
): StorePulses<PulsesType> & { state: ProxyState<StateType> } {
  return createStore(initialState, pulses, true);
}

// Crea una tienda mutable
export function createMutableStore<StateType extends State, PulsesType extends Pulses<StateType>>(
  initialState: StateType,
  pulses: PulsesType
): StorePulses<PulsesType> & { state: ProxyState<StateType> } {
  console.warn(
    "Warning: You are working with a mutable state. This can lead to unpredictable behavior. All state changes made outside of a pulse will not trigger a re-render."
  );
  return createStore(initialState, pulses, false);
}

const effectDeps = new WeakMap<Function, any[]>();

export function createEffect(effect: Function, dependencies?: any[]) {
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
