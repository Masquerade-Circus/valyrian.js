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
  const { vnode, oldVnode, component } = { ...import_valyrian.current };
  if (vnode) {
    if (!vnode.components) {
      vnode.components = [];
    }
    if (vnode.components.indexOf(component) === -1) {
      vnode.subscribers = oldVnode?.subscribers || [];
      vnode.initialChildren = [...vnode.children];
      vnode.signal_calls = -1;
      vnode.components.push(component);
      if (!component.signals) {
        component.signals = [];
        (0, import_valyrian.onUnmount)(() => Reflect.deleteProperty(component, "signals"));
      }
    }
    let signal2 = component.signals[++vnode.signal_calls];
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
    if (vnode) {
      let newVnode = (0, import_valyrian.v)(vnode.tag, vnode.props, ...vnode.initialChildren);
      newVnode.dom = vnode.dom;
      newVnode.isSVG = vnode.isSVG;
      vnode.subscribers.forEach(
        (subscribers2) => subscribers2.length = 0
      );
      vnode.subscribers = [];
      return (0, import_valyrian.updateVnode)(newVnode, vnode);
    }
    return (0, import_valyrian.update)();
  };
  let signal = [get, set, subscribe];
  if (vnode) {
    component.signals.push(signal);
    vnode.subscribers.push(subscribers);
  }
  return signal;
}
