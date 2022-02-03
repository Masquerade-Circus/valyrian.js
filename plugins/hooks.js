const UND = undefined;

function createHook({ init, update, response, cleanup }) {
  return (...args) => {
    let { component, vnode, oldVnode, app } = v.current;

    // Init the components array for the current vnode
    if (vnode.components === UND) {
      vnode.components = [];
    }

    // Add the component to the components array if it's not already there
    if (vnode.components.indexOf(component) === -1) {
      vnode.components.push(component);
    }

    // Init the component hooks array
    if (component.hooks === UND) {
      component.hooks = [];
    }

    let componentIndex = vnode.components.length - 1;
    let oldComponent = ((oldVnode || {}).components || [])[componentIndex];
    let hook;
    let hookIndex = component.hooks.length - 1;

    if (oldComponent === component) {
      component.hooks = oldComponent.hooks;
      hook = oldComponent.hooks[hookIndex];
      if (update) {
        update(hook, ...args);
      }
    } else {
      hook = init(...args);
      component.hooks.push(hook);
    }

    if (cleanup) {
      app.cleanup.push(() => cleanup(hook));
    }

    if (response) {
      return response(hook);
    } else {
      return hook;
    }
  };
}

const useState = createHook({
  init: (value) => {
    let state = value;
    let setState = (value) => (state = value);

    let stateObj = Object.create(null);
    stateObj.toJSON = stateObj.toString = stateObj.valueOf = () => (typeof state === "function" ? state() : state);

    return [stateObj, setState];
  }
});

// Effect hook
function callEffectHook(hook, changes) {
  let { prev } = hook;

  if (!changes) {
    hook.onCleanup = hook.effect();
  } else if (changes.length > 0) {
    for (let i = 0, l = changes.length; i < l; i++) {
      if (changes[i] !== prev[i]) {
        hook.prev = changes;
        hook.onCleanup = hook.effect();
        break;
      }
    }
  }
}
const useEffect = createHook({
  init: (effect, changes) => {
    let hook = { effect, prev: changes };
    callEffectHook(hook);
    return hook;
  },
  update: (hook, effect, changes) => callEffectHook(hook, changes),
  cleanup: (hook) => {
    if (typeof hook.onCleanup === "function") {
      hook.onCleanup();
    }
  }
});

let exports = {
  createHook,
  useState,
  useEffect
};

exports.default = exports;
module.exports = exports;
