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
var createHook = function createHook2({
  onCreate,
  onUpdate: onUpdateHook,
  onCleanup: onCleanupHook,
  onRemove,
  returnValue
}) {
  return (...args) => {
    const { component, vnode } = import_valyrian.current;
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
          (0, import_valyrian.onUnmount)(() => Reflect.deleteProperty(component, "hooks"));
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
        (0, import_valyrian.onUnmount)(() => onRemove(hook));
      }
    } else {
      if (onUpdateHook) {
        onUpdateHook(hook, ...args);
      }
    }
    if (onCleanupHook) {
      (0, import_valyrian.onCleanup)(() => onCleanupHook(hook));
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
  updateTimeout = setTimeout(import_valyrian.update);
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
      if (import_valyrian.current.event) {
        import_valyrian.current.event.preventDefault();
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
    (0, import_valyrian.directive)("ref", (ref, vnode) => {
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
