let v = {
  current: {}
};

function createHook({ onCreate, onUpdate, onRemove, onCleanup, returnValue }) {
  return (...args) => {
    let { component, vnode, oldVnode } = v.current;

    // Init the components array for the current vnode
    if (!vnode.components) {
      vnode.components = [];
      v.onUnmount(() => Reflect.deleteProperty(vnode, "components"));
    }

    // Add the component to the components array if it's not already there
    if (vnode.components.indexOf(component) === -1) {
      vnode.components.push(component);
    }

    // Init the component hooks array
    if (!component.hooks) {
      component.hooks = [];
      v.onUnmount(() => Reflect.deleteProperty(component, "hooks"));
    }

    let hook;

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
        v.onUnmount(() => onRemove(hook));
      }
    } else {
      // old vnode has components, we are updating the component

      // Set the calls property to the current component if it's not already set
      if ("calls" in component === false) {
        component.calls = -1;
        v.onUnmount(() => Reflect.deleteProperty(component, "calls"));
      }

      // Reset the calls property to -1 on cleanup so we can detect if the component is updated again
      v.onCleanup(() => (component.calls = -1));

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
      v.onCleanup(() => onCleanup(hook));
    }

    // If we have a returnValue function, call it and return the result instead of the hook
    if (returnValue) {
      return returnValue(hook);
    }

    // Return the hook
    return hook;
  };
}

// Use state hook
const useState = createHook({
  onCreate: (value) => {
    let stateObj = Object.create(null);
    stateObj.value = value;
    stateObj.toJSON = stateObj.toString = stateObj.valueOf = () => (typeof stateObj.value === "function" ? stateObj.value() : stateObj.value);

    return [stateObj, (value) => (stateObj.value = value)];
  }
});

// Effect hook
const useEffect = createHook({
  onCreate: (effect, changes) => {
    let hook = { effect, prev: [] };
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

const useRef = createHook({
  onCreate: (initialValue) => {
    v.directive("ref", (ref, vnode) => {
      ref.current = vnode.dom;
    });
    return { current: initialValue };
  }
});

const useCallback = createHook({
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

const useMemo = createHook({
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

function plugin(vInstance) {
  v = vInstance;
}

plugin.createHook = createHook;
plugin.useState = useState;
plugin.useEffect = useEffect;
plugin.useRef = useRef;
plugin.useCallback = useCallback;
plugin.useMemo = useMemo;

plugin.default = plugin;
module.exports = plugin;
