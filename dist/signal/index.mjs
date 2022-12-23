// lib/signal/index.ts
import { current, update, updateVnode, v } from "valyrian.js";
function Signal(initialValue) {
  const context = { ...current };
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
      let newVnode = v(context.vnode.tag, context.vnode.props, ...context.vnode.initialChildren);
      newVnode.dom = context.vnode.dom;
      newVnode.isSVG = context.vnode.isSVG;
      context.vnode.subscribers.forEach(
        (subscribers2) => subscribers2.length = 0
      );
      context.vnode.subscribers = [];
      return updateVnode(newVnode, context.vnode);
    }
    return update();
  };
  let signal = [get, set, subscribe];
  if (context.vnode) {
    context.vnode.signals.push(signal);
    context.vnode.subscribers.push(subscribers);
  }
  return signal;
}
export {
  Signal
};
