import { Component, POJOComponent, current, directive, onCleanup, onUnmount, update } from "valyrian.js";

export type Hook = any;

export interface HookDefinition {
  // eslint-disable-next-line no-unused-vars
  onCreate: (...args: any[]) => any;
  // eslint-disable-next-line no-unused-vars
  onUpdate?: (hook: Hook, ...args: any[]) => any;
  // eslint-disable-next-line no-unused-vars
  onCleanup?: (hook: Hook) => any;
  // eslint-disable-next-line no-unused-vars
  onRemove?: (hook: Hook) => any;
  // eslint-disable-next-line no-unused-vars
  returnValue?: (hook: Hook) => any;
}

export interface CreateHook {
  // eslint-disable-next-line no-unused-vars
  (HookDefinition: HookDefinition): (...args: any[]) => any;
}

type HookCalls = {
  hooks: Hook[];
  hook_calls: number;
};

const componentToHooksWeakMap = new WeakMap<Component | POJOComponent, HookCalls>();

export const createHook = function createHook({
  onCreate,
  onUpdate: onUpdateHook,
  onCleanup: onCleanupHook,
  onRemove,
  returnValue
}: HookDefinition): Hook {
  return (...args: any[]) => {
    const component = current.component as Component | POJOComponent;
    let hook: any = null;

    if (componentToHooksWeakMap.has(component) === false) {
      const HookCalls = { hooks: [], hook_calls: -1 };
      componentToHooksWeakMap.set(component, HookCalls);
      onUnmount(() => componentToHooksWeakMap.delete(component));
    }

    const HookCalls = componentToHooksWeakMap.get(component) as HookCalls;
    onCleanup(() => (HookCalls.hook_calls = -1));

    hook = HookCalls.hooks[++HookCalls.hook_calls];

    if (hook) {
      onUpdateHook && onUpdateHook(hook, ...args);
    }

    // If the hook doesn't exist, create it
    if (!hook) {
      hook = onCreate(...args);
      HookCalls.hooks.push(hook);
      onRemove && onUnmount(() => onRemove(hook));
    }

    onCleanupHook && onCleanup(() => onCleanupHook(hook));
    return returnValue ? returnValue(hook) : hook;
  };
} as unknown as CreateHook;

let updateTimeout: any;
function delayedUpdate() {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(update);
}

// Use state hook
export const useState = createHook({
  onCreate: (value) => {
    function get() {
      return value;
    }
    get.value = value;
    get.toJSON = get.valueOf = get;
    get.toString = () => `${value}`;

    function set(newValue: any) {
      if (current.event) {
        current.event.preventDefault();
      }

      if (value !== newValue) {
        value = newValue;
        get.value = newValue;
        delayedUpdate();
      }
    }

    return [get, set];
  }
});

// Effect hook
export const useEffect = createHook({
  onCreate: (effect: Function, changes: any[]) => {
    const hook: {
      effect: Function;
      prev: any[];
      onRemove?: Function;
      onCleanup?: Function;
    } = { effect, prev: [] };
    // on unmount
    if (changes === null) {
      hook.onRemove = effect;
      return hook;
    }

    // on create
    hook.prev = changes;
    hook.onCleanup = hook.effect();
    return hook;
  },
  onUpdate: (hook, effect, changes) => {
    // on update
    if (typeof changes === "undefined") {
      hook.prev = changes;
      if (typeof hook.onCleanup === "function") {
        hook.onCleanup();
      }
      hook.onCleanup = hook.effect();
      return;
    }

    // on update if there are changes
    if (Array.isArray(changes)) {
      for (let i = 0, l = changes.length; i < l; i++) {
        if (changes[i] !== hook.prev[i]) {
          hook.prev = changes;
          if (typeof hook.onCleanup === "function") {
            hook.onCleanup();
          }
          hook.onCleanup = hook.effect();
          return;
        }
      }
    }
  },
  onRemove: (hook) => {
    if (typeof hook.onCleanup === "function") {
      hook.onCleanup();
    }
    if (typeof hook.onRemove === "function") {
      hook.onRemove();
    }
  }
});

export const useRef = createHook({
  onCreate: (initialValue) => {
    directive("ref", (ref, vnode) => {
      ref.current = vnode.dom;
    });
    return { current: initialValue };
  }
});

export const useCallback = createHook({
  onCreate: (callback, changes) => {
    callback();
    return { callback, changes };
  },
  onUpdate: (hook, callback, changes) => {
    for (let i = 0, l = changes.length; i < l; i++) {
      if (changes[i] !== hook.changes[i]) {
        hook.changes = changes;
        hook.callback();
        return;
      }
    }
  }
});

export const useMemo = createHook({
  onCreate: (callback, changes) => {
    return { callback, changes, value: callback() };
  },
  onUpdate: (hook, callback, changes) => {
    for (let i = 0, l = changes.length; i < l; i++) {
      if (changes[i] !== hook.changes[i]) {
        hook.changes = changes;
        hook.value = callback();
        return;
      }
    }
  },
  returnValue: (hook) => {
    return hook.value;
  }
});
