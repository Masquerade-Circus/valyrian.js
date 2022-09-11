import { Component, Valyrian, ValyrianComponent, VnodeWithDom } from "Valyrian";

type LocalValyrian =
  | Valyrian
  | {
      current: Valyrian["current"];
      onUnmount: Valyrian["onUnmount"];
      onCleanup: Valyrian["onCleanup"];
      onMount: Valyrian["onMount"];
      onUpdate: Valyrian["onUpdate"];
      update: Valyrian["update"];
    };

let localValyrian: LocalValyrian = {
  current: {
    component: null,
    vnode: null,
    oldVnode: null
  },
  onUnmount() {},
  onCleanup() {},
  onMount() {},
  onUpdate() {},
  update() {}
};

interface CurrentOnPatch {
  component: Component | ValyrianComponent;
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

export const createHook = function createHook({ onCreate, onUpdate, onCleanup, onRemove, returnValue }: HookDefinition): Hook {
  return (...args: any[]) => {
    let { component, vnode, oldVnode } = localValyrian.current as CurrentOnPatch;

    // Init the components array for the current vnode
    if (!vnode.components) {
      vnode.components = [];
      localValyrian.onUnmount(() => Reflect.deleteProperty(vnode, "components"));
    }

    // Add the component to the components array if it's not already there
    if (vnode.components.indexOf(component) === -1) {
      vnode.components.push(component);
    }

    // Init the component hooks array
    if (!component.hooks) {
      component.hooks = [];
      localValyrian.onUnmount(() => Reflect.deleteProperty(component, "hooks"));
    }

    let hook: Hook = undefined;

    // if no old vnode or old vnode has no components or old vnode's last component is not the current component
    // we are mounting the component for the first time so we create a new hook
    if (!oldVnode || !oldVnode.components || oldVnode.components[vnode.components.length - 1] !== component) {
      // create a new hook
      hook = onCreate(...args);

      // add the hook to the component's hooks array
      component.hooks.push(hook);

      // if we have a onRemove hook, add it to the onRemove array
      if (onRemove) {
        // Add the hook to the onRemove array
        localValyrian.onUnmount(() => onRemove(hook));
      }
    } else {
      // old vnode has components, we are updating the component

      // Set the calls property to the current component if it's not already set
      if ("calls" in component === false) {
        component.calls = -1;
        localValyrian.onUnmount(() => Reflect.deleteProperty(component, "calls"));
      }

      // Reset the calls property to -1 on cleanup so we can detect if the component is updated again
      localValyrian.onCleanup(() => (component.calls = -1));

      // Increment the calls property
      component.calls++;

      // Get the current hook from the component's hooks array
      hook = component.hooks[component.calls];

      // If we have an onUpdate hook, call it
      if (onUpdate) {
        onUpdate(hook, ...args);
      }
    }

    // If we have an onCleanup function, add it to the cleanup array
    if (onCleanup) {
      // Add the hook to the onCleanup array
      localValyrian.onCleanup(() => onCleanup(hook));
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
  updateTimeout = setTimeout(localValyrian.update);
}

// Use state hook
export const useState = createHook({
  onCreate: (value) => {
    let stateObj = Object.create(null);
    stateObj.value = value;
    stateObj.toJSON = stateObj.toString = stateObj.valueOf = () => (typeof stateObj.value === "function" ? stateObj.value() : stateObj.value);

    return [
      stateObj,
      (value: any) => {
        if (stateObj.value !== value) {
          stateObj.value = value;
          delayedUpdate();
        }
      }
    ];
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
    (localValyrian as Valyrian).directive("ref", (ref, vnode) => {
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

export function plugin(v: Valyrian) {
  localValyrian = v;
}
