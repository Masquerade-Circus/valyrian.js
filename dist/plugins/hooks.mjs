// plugins/hooks.ts
var localValyrian = {
  current: {
    component: null,
    vnode: null,
    oldVnode: null
  },
  onUnmount: () => {
  },
  onCleanup: () => {
  },
  onMount: () => {
  },
  onUpdate: () => {
  }
};
var createHook = function createHook2({ onCreate, onUpdate, onCleanup, onRemove, returnValue }) {
  return (...args) => {
    let { component, vnode, oldVnode } = localValyrian.current;
    if (!vnode.components) {
      vnode.components = [];
      localValyrian.onUnmount(() => Reflect.deleteProperty(vnode, "components"));
    }
    if (vnode.components.indexOf(component) === -1) {
      vnode.components.push(component);
    }
    if (!component.hooks) {
      component.hooks = [];
      localValyrian.onUnmount(() => Reflect.deleteProperty(component, "hooks"));
    }
    let hook = void 0;
    if (!oldVnode || !oldVnode.components || oldVnode.components[vnode.components.length - 1] !== component) {
      hook = onCreate(...args);
      component.hooks.push(hook);
      if (onRemove) {
        localValyrian.onUnmount(() => onRemove(hook));
      }
    } else {
      if ("calls" in component === false) {
        component.calls = -1;
        localValyrian.onUnmount(() => Reflect.deleteProperty(component, "calls"));
      }
      localValyrian.onCleanup(() => component.calls = -1);
      component.calls++;
      hook = component.hooks[component.calls];
      if (onUpdate) {
        onUpdate(hook, ...args);
      }
    }
    if (onCleanup) {
      localValyrian.onCleanup(() => onCleanup(hook));
    }
    if (returnValue) {
      return returnValue(hook);
    }
    return hook;
  };
};
var useState = createHook({
  onCreate: (value) => {
    let stateObj = /* @__PURE__ */ Object.create(null);
    stateObj.value = value;
    stateObj.toJSON = stateObj.toString = stateObj.valueOf = () => typeof stateObj.value === "function" ? stateObj.value() : stateObj.value;
    return [stateObj, (value2) => stateObj.value = value2];
  }
});
var useEffect = createHook({
  onCreate: (effect, changes) => {
    let hook = { effect, prev: [] };
    if (changes === null) {
      hook.onRemove = effect;
      return hook;
    }
    hook.prev = changes;
    hook.onCleanup = hook.effect();
    return hook;
  },
  onUpdate: (hook, effect, changes) => {
    if (typeof changes === "undefined") {
      hook.prev = changes;
      if (typeof hook.onCleanup === "function") {
        hook.onCleanup();
      }
      hook.onCleanup = hook.effect();
      return;
    }
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
var useRef = createHook({
  onCreate: (initialValue) => {
    localValyrian.directive("ref", (ref, vnode) => {
      ref.current = vnode.dom;
    });
    return { current: initialValue };
  }
});
var useCallback = createHook({
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
var useMemo = createHook({
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
function plugin(v) {
  localValyrian = v;
}
var hooks_default = plugin;
export {
  createHook,
  hooks_default as default,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
};
