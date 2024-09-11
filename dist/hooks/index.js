"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/hooks/index.ts
var hooks_exports = {};
__export(hooks_exports, {
  createHook: () => createHook,
  useCallback: () => useCallback,
  useEffect: () => useEffect,
  useMemo: () => useMemo,
  useRef: () => useRef,
  useState: () => useState
});
module.exports = __toCommonJS(hooks_exports);
var import_valyrian = require("valyrian.js");
var import_utils = require("valyrian.js/utils");
var componentToHooksWeakMap = /* @__PURE__ */ new WeakMap();
var createHook = function createHook2({
  onCreate,
  onUpdate: onUpdateHook,
  onCleanup: onCleanupHook,
  onRemove,
  returnValue
}) {
  return (...args) => {
    const component = import_valyrian.current.component;
    let HookCalls = componentToHooksWeakMap.get(component);
    if (!HookCalls) {
      HookCalls = { hooks: [], hook_calls: -1 };
      componentToHooksWeakMap.set(component, HookCalls);
      (0, import_valyrian.onUnmount)(() => componentToHooksWeakMap.delete(component));
    }
    (0, import_valyrian.onCleanup)(() => HookCalls.hook_calls = -1);
    let hook = HookCalls.hooks[++HookCalls.hook_calls];
    if (hook) {
      onUpdateHook?.(hook, ...args);
    } else {
      hook = onCreate(...args);
      HookCalls.hooks.push(hook);
      onRemove && (0, import_valyrian.onUnmount)(() => onRemove(hook));
    }
    onCleanupHook && (0, import_valyrian.onCleanup)(() => onCleanupHook(hook));
    return returnValue ? returnValue(hook) : hook;
  };
};
var timeout;
var debouncedUpdate = () => {
  clearTimeout(timeout);
  timeout = setTimeout(import_valyrian.update, 5);
};
var useState = createHook({
  onCreate: (value) => {
    let state = value;
    function get() {
      return state;
    }
    function set(newValue) {
      if (import_valyrian.current.event && !import_valyrian.current.event.defaultPrevented) {
        import_valyrian.current.event.preventDefault();
      }
      const resolvedValue = typeof newValue === "function" ? newValue(state) : newValue;
      if ((0, import_utils.hasChanged)(state, resolvedValue)) {
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
    if (Array.isArray(changes) && (0, import_utils.hasChanged)(hook.prev, changes)) {
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
    (0, import_valyrian.directive)("ref", (ref, vnode) => {
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
    if ((0, import_utils.hasChanged)(hook.changes, changes)) {
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
    if ((0, import_utils.hasChanged)(hook.changes, changes)) {
      hook.changes = changes;
      hook.value = callback();
    }
  },
  returnValue: (hook) => hook.value
});
