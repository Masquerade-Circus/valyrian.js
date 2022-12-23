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
function Signal(initialValue) {
  const context = { ...import_valyrian.current };
  if (context.vnode) {
    if (!context.vnode.signals) {
      context.vnode.signals = context.oldVnode?.signals || [];
      context.vnode.calls = -1;
      context.vnode.subscribers = context.oldVnode?.subscribers || [];
      context.vnode.initialChildren = [...context.vnode.children];
    }
    let signal2 = context.vnode.signals[++context.vnode.calls];
    if (signal2) {
      return signal2;
    }
  }
  let value = initialValue;
  const subscribers = [];
  const subscribe = (callback) => {
    if (subscribers.indexOf(callback) === -1) {
      subscribers.push(callback);
    }
  };
  function get() {
    return value;
  }
  get.value = value;
  get.toJSON = get.valueOf = get;
  get.toString = () => `${value}`;
  const set = (newValue) => {
    value = newValue;
    get.value = value;
    for (let i = 0, l = subscribers.length; i < l; i++) {
      subscribers[i](value);
    }
    if (context.vnode) {
      let newVnode = (0, import_valyrian.v)(context.vnode.tag, context.vnode.props, ...context.vnode.initialChildren);
      newVnode.dom = context.vnode.dom;
      newVnode.isSVG = context.vnode.isSVG;
      context.vnode.subscribers.forEach(
        (subscribers2) => subscribers2.length = 0
      );
      context.vnode.subscribers = [];
      return (0, import_valyrian.updateVnode)(newVnode, context.vnode);
    }
    return (0, import_valyrian.update)();
  };
  let signal = [get, set, subscribe];
  if (context.vnode) {
    context.vnode.signals.push(signal);
    context.vnode.subscribers.push(subscribers);
  }
  return signal;
}
