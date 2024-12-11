import { Component, POJOComponent, current, directive, onCleanup, onUnmount, debouncedUpdate } from "valyrian.js";
import { hasChanged } from "valyrian.js/utils";

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
    let HookCalls = componentToHooksWeakMap.get(component);

    if (!HookCalls) {
      HookCalls = { hooks: [], hook_calls: -1 } as HookCalls;
      componentToHooksWeakMap.set(component, HookCalls);
      onUnmount(() => {
        componentToHooksWeakMap.delete(component);
      });
    }

    onCleanup(() => ((HookCalls as HookCalls).hook_calls = -1));

    let hook = HookCalls.hooks[++HookCalls.hook_calls];
    if (hook) {
      onUpdateHook?.(hook, ...args);
    } else {
      hook = onCreate(...args);
      HookCalls.hooks.push(hook);
      onRemove && onUnmount(() => onRemove(hook));
    }

    onCleanupHook && onCleanup(() => onCleanupHook(hook));
    return returnValue ? returnValue(hook) : hook;
  };
} as unknown as CreateHook;

// Use state hook
export const useState = createHook({
  onCreate: (value) => {
    let state = value;
    function get() {
      return state;
    }

    function set(newValue: any) {
      if (current.event && !current.event.defaultPrevented) {
        current.event.preventDefault();
      }

      const resolvedValue = typeof newValue === "function" ? newValue(state) : newValue;

      if (hasChanged(state, resolvedValue)) {
        state = resolvedValue;
        debouncedUpdate();
      }
    }

    return [get, set];
  }
});

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

    if (Array.isArray(changes) && changes.length === 0) {
      // Si las dependencias son un array vacío, no se debe volver a ejecutar.
      return;
    }

    // on update if there are changes
    if (Array.isArray(changes) && hasChanged(hook.prev, changes)) {
      hook.prev = changes;
      if (typeof hook.onCleanup === "function") {
        hook.onCleanup();
      }
      hook.onCleanup = hook.effect();
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
    return { callback, changes };
  },
  onUpdate: (hook, callback, changes) => {
    if (hasChanged(hook.changes, changes)) {
      hook.changes = changes;
      hook.callback = callback;
    }
  },
  returnValue: (hook) => hook.callback
});

export const useMemo = createHook({
  onCreate: (callback, changes) => {
    return { callback, changes, value: callback() };
  },
  onUpdate: (hook, callback, changes) => {
    if (hasChanged(hook.changes, changes)) {
      hook.changes = changes;
      hook.value = callback();
    }
  },
  returnValue: (hook) => hook.value
});
