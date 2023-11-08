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

// lib/signal/index.ts
var signal_exports = {};
__export(signal_exports, {
  Signal: () => Signal
});
module.exports = __toCommonJS(signal_exports);
var import_valyrian = require("valyrian.js");
var componentToSignalsWeakMap = /* @__PURE__ */ new WeakMap();
function Signal(initialValue) {
  if (import_valyrian.current.component) {
    if (componentToSignalsWeakMap.has(import_valyrian.current.component) === false) {
      const SignalCalls2 = { signals: [], signal_calls: -1 };
      componentToSignalsWeakMap.set(import_valyrian.current.component, SignalCalls2);
      (0, import_valyrian.onUnmount)(() => componentToSignalsWeakMap.delete(import_valyrian.current.component));
    }
    const SignalCalls = componentToSignalsWeakMap.get(import_valyrian.current.component);
    (0, import_valyrian.onCleanup)(() => SignalCalls.signal_calls = -1);
    const signal2 = SignalCalls.signals[++SignalCalls.signal_calls];
    if (signal2) {
      const fakeSubscribe = () => {
      };
      return [signal2[0], signal2[1], fakeSubscribe, signal2[3]];
    }
  }
  let value = initialValue;
  const subscribers = /* @__PURE__ */ new Set();
  const subscribe = (callback) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  };
  const domToVnodesToUpdate = /* @__PURE__ */ new Map();
  const updateVnodes = () => domToVnodesToUpdate.forEach((vnode) => (0, import_valyrian.updateVnode)(vnode));
  const getValue = () => {
    if (import_valyrian.current.vnode) {
      const vnode = import_valyrian.current.vnode;
      domToVnodesToUpdate.set(vnode.dom, vnode);
      subscribe(updateVnodes);
    }
    return value;
  };
  const setValue = (newValue) => {
    if (import_valyrian.current.event) {
      import_valyrian.current.event.preventDefault();
    }
    if (value === newValue) {
      return;
    }
    value = newValue;
    subscribers.forEach((subscriber) => subscriber());
  };
  const signal = [getValue, setValue, subscribe, subscribers];
  if (import_valyrian.current.component) {
    const SignalCalls = componentToSignalsWeakMap.get(import_valyrian.current.component);
    SignalCalls.signals.push(signal);
  }
  return signal;
}
