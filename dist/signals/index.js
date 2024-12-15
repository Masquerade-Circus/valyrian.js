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

// lib/signals/index.ts
var signals_exports = {};
__export(signals_exports, {
  createEffect: () => createEffect,
  createSignal: () => createSignal,
  createSignalStore: () => createSignalStore
});
module.exports = __toCommonJS(signals_exports);
var import_valyrian = require("valyrian.js");
var import_utils = require("valyrian.js/utils");
var effectStack = [];
function createSignal(initialValue) {
  let value = initialValue;
  const subscribers = /* @__PURE__ */ new Set();
  const domWithVnodesToUpdate = /* @__PURE__ */ new WeakSet();
  const runSubscribers = () => subscribers.forEach((subscriber) => subscriber());
  const read = () => {
    const currentEffect = effectStack[effectStack.length - 1];
    if (currentEffect && !subscribers.has(currentEffect)) {
      subscribers.add(currentEffect);
    }
    const currentVnode = import_valyrian.current.vnode;
    if (currentVnode && !domWithVnodesToUpdate.has(currentVnode.dom)) {
      const dom = currentVnode.dom;
      const subscription = () => {
        if (!dom.parentNode) {
          subscribers.delete(subscription);
          domWithVnodesToUpdate.delete(dom);
          return;
        }
        (0, import_valyrian.updateVnode)(dom.vnode);
      };
      subscribers.add(subscription);
      domWithVnodesToUpdate.add(dom);
    }
    return value;
  };
  const write = (newValue) => {
    const resolvedValue = typeof newValue === "function" ? newValue(value) : newValue;
    if (import_valyrian.current.event && !import_valyrian.current.event.defaultPrevented) {
      import_valyrian.current.event.preventDefault();
    }
    if (!(0, import_utils.hasChanged)(value, resolvedValue)) {
      return;
    }
    value = resolvedValue;
    runSubscribers();
  };
  return [read, write, runSubscribers];
}
var effectDeps = /* @__PURE__ */ new WeakMap();
function createEffect(effect, dependencies) {
  const runEffect = () => {
    const oldDeps = effectDeps.get(effect);
    const hasChangedDeps = !oldDeps || !dependencies || dependencies.some((dep, i) => !Object.is(dep, oldDeps[i]));
    if (!hasChangedDeps) return;
    effectDeps.set(effect, dependencies || []);
    try {
      effectStack.push(runEffect);
      effect();
    } finally {
      effectStack.pop();
    }
  };
  runEffect();
}
function createSignalStore(initialState) {
  const [state, , runSubscribers] = createSignal(initialState);
  const setter = (path, newValue) => {
    const current2 = (0, import_utils.get)(initialState, path);
    const resolvedValue = typeof newValue === "function" ? newValue(current2) : newValue;
    if (!(0, import_utils.hasChanged)(current2, resolvedValue)) {
      return;
    }
    (0, import_utils.set)(initialState, path, resolvedValue);
    runSubscribers();
  };
  return [state, setter];
}
