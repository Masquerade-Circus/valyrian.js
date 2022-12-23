// lib/hooks/index.ts
import { current, directive, onCleanup, onUnmount, update } from "valyrian.js";
var createHook = function createHook2({
  onCreate,
  onUpdate: onUpdateHook,
  onCleanup: onCleanupHook,
  onRemove,
  returnValue
}) {
  return (...args) => {
    let { component, vnode } = current;
    let hook = null;
    if (vnode) {
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
    if (!hook) {
      hook = onCreate(...args);
      if (vnode) {
        component.hooks.push(hook);
      }
      if (onRemove) {
        onUnmount(() => onRemove(hook));
      }
    } else {
      if (onUpdateHook) {
        onUpdateHook(hook, ...args);
      }
    }
    if (onCleanupHook) {
      onCleanup(() => onCleanupHook(hook));
    }
    if (returnValue) {
      return returnValue(hook);
    }
    return hook;
  };
};
var updateTimeout;
function delayedUpdate() {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(update);
}
var useState = createHook({
  onCreate: (value) => {
    function get() {
      return value;
    }
    get.value = value;
    get.toJSON = get.valueOf = get;
    get.toString = () => `${value}`;
    function set(newValue) {
      if (value !== newValue) {
        value = newValue;
        get.value = newValue;
        delayedUpdate();
      }
    }
    return [get, set];
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
    directive("ref", (ref, vnode) => {
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
export {
  createHook,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
};
