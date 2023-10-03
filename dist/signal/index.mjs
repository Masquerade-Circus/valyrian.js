// lib/signal/index.ts
import { current, onUnmount, updateVnode, v } from "valyrian.js";
function Signal(initialValue) {
  const { vnode, component } = { ...current };
  if (vnode && component) {
    if (!vnode.components) {
      vnode.components = [];
    }
    if (vnode.components.indexOf(component) === -1) {
      vnode.signal_calls = -1;
      vnode.components.push(component);
      if (!component.signals) {
        component.signals = [];
        onUnmount(() => Reflect.deleteProperty(component, "signals"));
      }
    }
    const signal2 = component.signals[++vnode.signal_calls];
    if (signal2) {
      signal2[3].length = 0;
      return signal2;
    }
  }
  let value = initialValue;
  const subscriptions = [];
  const subscribe = (callback) => {
    if (subscriptions.indexOf(callback) === -1) {
      subscriptions.push(callback);
    }
  };
  const vnodesToUpdate = [];
  const updateVnodes = () => {
    const vnodesToUpdateCopy = vnodesToUpdate.filter((vnode2, index, self) => {
      return self.findIndex((v2) => v2.dom === vnode2.dom) === index;
    });
    for (let i = 0, l = vnodesToUpdateCopy.length; i < l; i++) {
      const vnode2 = vnodesToUpdateCopy[i];
      const newVnode = v(vnode2.tag, vnode2.props, ...vnode2.initialChildren);
      newVnode.dom = vnode2.dom;
      newVnode.isSVG = vnode2.isSVG;
      updateVnode(newVnode, vnode2);
    }
  };
  function get() {
    const { vnode: vnode2 } = current;
    if (vnode2 && vnodesToUpdate.indexOf(vnode2) === -1) {
      if (!vnode2.initialChildren) {
        vnode2.initialChildren = [...vnode2.children];
      }
      vnodesToUpdate.push(vnode2);
      subscribe(updateVnodes);
    }
    return value;
  }
  const set = (newValue) => {
    if (current.event) {
      current.event.preventDefault();
    }
    if (newValue === value) {
      return;
    }
    value = newValue;
    for (let i = 0, l = subscriptions.length; i < l; i++) {
      subscriptions[i](value);
    }
  };
  const signal = [get, set, subscribe, subscriptions];
  if (vnode && component) {
    component.signals.push(signal);
  }
  return signal;
}
export {
  Signal
};
