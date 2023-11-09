// lib/signal/index.ts
import { updateVnode, current, onCleanup, onUnmount } from "valyrian.js";
var componentToSignalsWeakMap = /* @__PURE__ */ new WeakMap();
function Signal(initialValue) {
  if (current.component) {
    if (componentToSignalsWeakMap.has(current.component) === false) {
      const SignalCalls2 = { signals: [], signal_calls: -1 };
      componentToSignalsWeakMap.set(current.component, SignalCalls2);
      onUnmount(() => componentToSignalsWeakMap.delete(current.component));
    }
    const SignalCalls = componentToSignalsWeakMap.get(current.component);
    onCleanup(() => SignalCalls.signal_calls = -1);
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
  const updateVnodes = () => domToVnodesToUpdate.forEach((vnode) => updateVnode(vnode));
  const getValue = () => {
    if (current.vnode) {
      const vnode = current.vnode;
      domToVnodesToUpdate.set(vnode.dom, vnode);
      subscribe(updateVnodes);
    }
    return value;
  };
  const setValue = (newValue) => {
    if (current.event) {
      current.event.preventDefault();
    }
    if (value === newValue) {
      return;
    }
    value = newValue;
    subscribers.forEach((subscriber) => subscriber());
  };
  const signal = [getValue, setValue, subscribe, subscribers];
  if (current.component) {
    const SignalCalls = componentToSignalsWeakMap.get(current.component);
    SignalCalls.signals.push(signal);
  }
  return signal;
}
export {
  Signal
};
