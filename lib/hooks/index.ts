import { Component, POJOComponent, VnodeWithDom, current, directive, onCleanup, onUnmount, update } from "valyrian.js";

interface CurrentOnPatch {
  component: Component | POJOComponent;
  vnode: VnodeWithDom;
  oldVnode: VnodeWithDom;
}

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

export const createHook = function createHook({
  onCreate,
  onUpdate: onUpdateHook,
  onCleanup: onCleanupHook,
  onRemove,
  returnValue
}: HookDefinition): Hook {
  return (...args: any[]) => {
    let { component, vnode } = current as CurrentOnPatch;

    let hook: any = null;

    if (vnode) {
      // Init the components array for the current vnode
      if (!vnode.components) {
        vnode.components = [];
      }

      if (vnode.components.indexOf(component) === -1) {
        vnode.hook_calls = -1;
        vnode.components.push(component);
        if (!component.hooks) {
          component.hooks = [];
          onUnmount(() => Reflect.deleteProperty(component, "hooks"));
        }
      }

      hook = component.hooks[++vnode.hook_calls];
    }

    // If the hook doesn't exist, create it
    if (!hook) {
      // create a new hook
      hook = onCreate(...args);

      if (vnode) {
        // Add the hook to the component
        component.hooks.push(hook);
      }

      // if we have a onRemove hook, add it to the onUnmount set
      if (onRemove) {
        // Add the hook to the onRemove array
        onUnmount(() => onRemove(hook));
      }
    } else {
      if (onUpdateHook) {
        onUpdateHook(hook, ...args);
      }
    }

    // If we have an onCleanup function, add it to the cleanup set
    if (onCleanupHook) {
      // Add the hook to the onCleanup set
      onCleanup(() => onCleanupHook(hook));
    }

    // If we have a returnValue function, call it and return the result instead of the hook
    if (returnValue) {
      return returnValue(hook);
    }

    // Return the hook
    return hook;
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
      // Prevent default event if it exists
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
    let hook: {
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
