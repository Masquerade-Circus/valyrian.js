import { current, updateVnode, Vnode, VnodeWithDom } from "valyrian.js";
import { get, set, hasChanged } from "valyrian.js/utils";

const effectStack: Function[] = [];

export type Signal<T> = [() => T, (newValue: T | ((current: T) => T)) => void, () => void];

export function createSignal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<Function>();
  const vnodesToUpdate = new WeakSet<Vnode>();

  const runSubscribers = () => subscribers.forEach((subscriber) => subscriber());

  const read = () => {
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

    return value;
  };

  const write = (newValue: T | ((current: T) => T)) => {
    const resolvedValue = typeof newValue === "function" ? (newValue as (current: T) => T)(value) : newValue;

    if (current.event && !current.event.defaultPrevented) {
      current.event.preventDefault();
    }

    if (!hasChanged(value, resolvedValue)) {
      return;
    }

    value = resolvedValue;

    runSubscribers();
  };

  return [read, write, runSubscribers];
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

// Path is a string with dot notation, e.g:
// 'a.b.c' === obj.a.b.c
// 'a.0.c' === obj.a[0].c
export type SignalStore<T> = [() => T, (path: string, newValue: T | ((current: T) => T)) => void];

export function createSignalStore<T>(initialState: T): SignalStore<T> {
  const [state, _, runSubscribers] = createSignal(initialState);

  const setter = (path: string, newValue: T | ((current: T) => T)) => {
    const current = get(initialState, path);
    const resolvedValue = typeof newValue === "function" ? (newValue as (current: T) => T)(current) : newValue;

    if (!hasChanged(current, resolvedValue)) {
      return;
    }

    set(initialState, path, resolvedValue);
    runSubscribers();
  };

  return [state, setter];
}
