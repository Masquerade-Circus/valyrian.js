function createHook({ create, update, remove }) {
  return (...args) => {
    let { component, vnode, oldVnode, app } = v.current;

    // Init the components array for the current vnode
    if (vnode.components === undefined) {
      vnode.components = [];
      app.onUnmount.push(() => {
        Reflect.deleteProperty(vnode, "components");
      });
    }

    // Add the component to the components array if it's not already there
    if (vnode.components.indexOf(component) === -1) {
      vnode.components.push(component);
    }

    // Init the component hooks array
    if (component.hooks === undefined) {
      component.hooks = [];
      app.onUnmount.push(() => {
        Reflect.deleteProperty(component, "hooks");
      });
    }
    let hook;

    if (!oldVnode || !oldVnode.components || oldVnode.components[vnode.components.length - 1] !== component) {
      hook = create(...args);
      component.hooks.push(hook);

      if (remove) {
        // Add the hook to the onRemove array
        app.onUnmount.push(() => remove(hook));
      }
    } else {
      hook = component.hooks[component.hooks.length - 1];
      if (update) {
        update(hook, ...args);
      }
    }

    return hook;
  };
}

const useState = createHook({
  create: (value) => {
    let state = value;
    let setState = (value) => (state = value);

    let stateObj = Object.create(null);
    stateObj.toJSON = stateObj.toString = stateObj.valueOf = () => (typeof state === "function" ? state() : state);

    return [stateObj, setState];
  }
});

// Effect hook
const useEffect = createHook({
  create: (effect, changes) => {
    let hook = { effect, prev: [] };
    // on unmount
    if (changes === null) {
      hook.onRemove = effect;
      return hook;
    }

    // on create
    hook.prev = changes;
    hook.onCleanup = hook.effect();
    return hook;
  },
  update: (hook, effect, changes) => {
    // on update
    if (typeof changes === "undefined") {
      hook.prev = changes;
      if (typeof hook.onCleanup === "function") {
        hook.onCleanup();
      }
      hook.onCleanup = hook.effect();
      return;
    }

    // on update if there are changes
    if (Array.isArray(changes)) {
      for (let i = 0, l = changes.length; i < l; i++) {
        if (changes[i] !== hook.prev[i]) {
          hook.prev = changes;
          if (typeof hook.onCleanup === "function") {
            hook.onCleanup();
          }
          hook.onCleanup = hook.effect();
          return;
        }
      }
    }
  },
  remove: (hook) => {
    if (typeof hook.onCleanup === "function") {
      hook.onCleanup();
    }
    if (typeof hook.onRemove === "function") {
      hook.onRemove();
    }
  }
});

const plugin = { useState, useEffect, createHook };
plugin.default = plugin;
module.exports = plugin;
