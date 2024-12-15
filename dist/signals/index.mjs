// lib/signals/index.ts
import { current, updateVnode } from "valyrian.js";
import { get, set, hasChanged } from "valyrian.js/utils";
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
    const currentVnode = current.vnode;
    if (currentVnode && !domWithVnodesToUpdate.has(currentVnode.dom)) {
      const dom = currentVnode.dom;
      const subscription = () => {
        if (!dom.parentNode) {
          subscribers.delete(subscription);
          domWithVnodesToUpdate.delete(dom);
          return;
        }
        updateVnode(dom.vnode);
      };
      subscribers.add(subscription);
      domWithVnodesToUpdate.add(dom);
    }
    return value;
  };
  const write = (newValue) => {
    const resolvedValue = typeof newValue === "function" ? newValue(value) : newValue;
    if (current.event && !current.event.defaultPrevented) {
      current.event.preventDefault();
    }
    if (!hasChanged(value, resolvedValue)) {
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
    const current2 = get(initialState, path);
    const resolvedValue = typeof newValue === "function" ? newValue(current2) : newValue;
    if (!hasChanged(current2, resolvedValue)) {
      return;
    }
    set(initialState, path, resolvedValue);
    runSubscribers();
  };
  return [state, setter];
}
export {
  createEffect,
  createSignal,
  createSignalStore
};
