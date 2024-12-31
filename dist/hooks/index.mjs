// lib/hooks/index.ts
import { current, directive, onCleanup, onRemove, debouncedUpdate } from "valyrian.js";
import { hasChanged } from "valyrian.js/utils";
var componentToHooksWeakMap = /* @__PURE__ */ new WeakMap();
var createHook = function createHook2({
  onCreate: onCreateHook,
  onUpdate: onUpdateHook,
  onCleanup: onCleanupHook,
  onRemove: onRemoveHook,
  returnValue
}) {
  return (...args) => {
    const component = current.component;
    let HookCalls = componentToHooksWeakMap.get(component);
    if (!HookCalls) {
      HookCalls = { hooks: [], hook_calls: -1 };
      componentToHooksWeakMap.set(component, HookCalls);
      onRemove(() => componentToHooksWeakMap.delete(component));
    }
    onCleanup(() => HookCalls.hook_calls = -1);
    let hook = HookCalls.hooks[++HookCalls.hook_calls];
    if (hook) {
      onUpdateHook?.(hook, ...args);
    } else {
      hook = onCreateHook(...args);
      HookCalls.hooks.push(hook);
      onRemoveHook && onRemove(() => onRemoveHook(hook));
    }
    onCleanupHook && onCleanup(() => onCleanupHook(hook));
    return returnValue ? returnValue(hook) : hook;
  };
};
var useState = createHook({
  onCreate: (value) => {
    let state = value;
    function get() {
      return state;
    }
    function set(newValue) {
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
var useEffect = createHook({
  onCreate: (effect, changes) => {
    const hook = { effect, prev: [] };
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
    if (Array.isArray(changes) && changes.length === 0) {
      return;
    }
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
var useMemo = createHook({
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
export {
  createHook,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
};
