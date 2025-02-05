import { current, DomElement, updateVnode, VnodeWithDom } from "valyrian.js";
import { get, set, hasChanged } from "valyrian.js/utils";

const effectStack: Function[] = [];

// eslint-disable-next-line no-unused-vars
export type Signal<T> = [() => T, (newValue: T | ((current: T) => T)) => void, () => void];

export function createSignal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<Function>();
  const domWithVnodesToUpdate = new WeakSet<DomElement>();

  const runSubscribers = () => subscribers.forEach((subscriber) => subscriber());

  const read = () => {
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
        return value;
      }

      const dom = currentVnode.dom;
      const subscription = () => {
        updateVnode(dom.vnode);
        if (!dom.parentNode) {
          subscribers.delete(subscription);
          domWithVnodesToUpdate.delete(dom);
        }
      };

      subscribers.add(subscription);
      domWithVnodesToUpdate.add(dom);
    }

    return value;
  };

  // eslint-disable-next-line no-unused-vars
  const write = (newValue: T | ((current: T) => T)) => {
    // eslint-disable-next-line no-unused-vars
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
// eslint-disable-next-line no-unused-vars
export type SignalStore<T> = [() => T, (path: string, newValue: T | ((current: T) => T) | any) => void];

export function createSignalStore<T>(initialState: T): SignalStore<T> {
  const [state, , runSubscribers] = createSignal(initialState);

  // eslint-disable-next-line no-unused-vars
  const setter = (path: string, newValue: T | ((current: T) => T)) => {
    const current = get(initialState, path);
    // eslint-disable-next-line no-unused-vars
    const resolvedValue = typeof newValue === "function" ? (newValue as (current: T) => T)(current) : newValue;

    if (!hasChanged(current, resolvedValue)) {
      return;
    }

    set(initialState, path, resolvedValue);
    runSubscribers();
  };

  return [state, setter];
}
