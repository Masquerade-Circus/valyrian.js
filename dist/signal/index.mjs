// lib/signal/index.ts
import { current, onUnmount, update, updateVnode, v } from "valyrian.js";
function Signal(initialValue) {
  const { vnode, oldVnode, component } = { ...current };
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
        onUnmount(() => Reflect.deleteProperty(component, "signals"));
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
      let newVnode = v(vnode.tag, vnode.props, ...vnode.initialChildren);
      newVnode.dom = vnode.dom;
      newVnode.isSVG = vnode.isSVG;
      vnode.subscribers.forEach(
        (subscribers2) => subscribers2.length = 0
      );
      vnode.subscribers = [];
      return updateVnode(newVnode, vnode);
    }
    return update();
  };
  let signal = [get, set, subscribe];
  if (vnode) {
    component.signals.push(signal);
    vnode.subscribers.push(subscribers);
  }
  return signal;
}
export {
  Signal
};
