import { updateVnode, current, VnodeWithDom, onCleanup, POJOComponent, Component, onUnmount } from "valyrian.js";

type getter = () => any;
type setter = (newValue: any) => void;
type unsubscribe = () => void;
type subscribe = (callback: () => void) => unsubscribe;
type subscriptions = Set<() => void>;
type signal = [getter, setter, subscribe, subscriptions];

type SignalCalls = {
  signals: signal[];
  signal_calls: number;
};

const componentToSignalsWeakMap = new WeakMap<Component | POJOComponent, SignalCalls>();

// Signal is a generic function that creates a reactive state with a getter, setter, and subscribe mechanism.
export function Signal<T>(initialValue: T): signal {
  if (current.component) {
    if (componentToSignalsWeakMap.has(current.component) === false) {
      const SignalCalls = { signals: [], signal_calls: -1 };
      componentToSignalsWeakMap.set(current.component, SignalCalls);
      onUnmount(() => componentToSignalsWeakMap.delete(current.component as Component | POJOComponent));
    }

    const SignalCalls = componentToSignalsWeakMap.get(current.component) as SignalCalls;
    onCleanup(() => (SignalCalls.signal_calls = -1));

    const signal = SignalCalls.signals[++SignalCalls.signal_calls];

    if (signal) {
      // Return the signal if it already exists.
      // But without the subscribe function. This is to prevent the subscribe function from being called multiple times.
      const fakeSubscribe = (() => {}) as unknown as subscribe;
      return [signal[0], signal[1], fakeSubscribe, signal[3]];
    }
  }

  // The current value of the signal is stored in a closure to maintain state.
  let value: T = initialValue;
  // Subscribers is a Set of functions to be called whenever the value changes.
  const subscribers: subscriptions = new Set();

  // subscribe is a function that allows a subscriber to listen to changes in the signal's value.
  // It returns an unsubscribe function to stop listening to changes.
  const subscribe = (callback: () => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  };

  const domToVnodesToUpdate: Map<Node, VnodeWithDom> = new Map();
  const updateVnodes = () => domToVnodesToUpdate.forEach((vnode) => updateVnode(vnode));

  // getValue is a function that returns the current value of the signal.
  const getValue = () => {
    if (current.vnode) {
      const vnode = current.vnode as VnodeWithDom;
      domToVnodesToUpdate.set(vnode.dom, vnode);
      subscribe(updateVnodes);
    }
    return value;
  };

  // setValue is a function that updates the value of the signal and notifies subscribers.
  const setValue = (newValue: any) => {
    if (current.event) {
      current.event.preventDefault();
    }

    if (value === newValue) {
      return;
    }
    value = newValue;
    // Notify all subscribers by invoking their callback functions.
    subscribers.forEach((subscriber) => subscriber());
  };

  const signal: signal = [getValue, setValue, subscribe, subscribers];

  if (current.component) {
    const SignalCalls = componentToSignalsWeakMap.get(current.component) as SignalCalls;
    SignalCalls.signals.push(signal);
  }

  return signal;
}
