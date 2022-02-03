let plugin = function (v) {
  let UND;

  function createHook ({ name, init, update, response }) {

    if (!v[name]) {
      v[name] = (...args) => {
        let { component, parentVnode, oldParentVnode } = v.current;

        if (parentVnode.components === UND) {
          parentVnode.components = [];
        }

        if (parentVnode.components.indexOf(component) === -1) {
          parentVnode.components.push(component);
        }

        let hook;
        let oldComponentNode = oldParentVnode && oldParentVnode.components && oldParentVnode.components[parentVnode.components.length - 1];
        let oldMethod = oldComponentNode && ("view" in oldComponentNode.component ? oldComponentNode.component.view : oldComponentNode.component);
        let currentMethod = "view" in component.component ? component.component.view : component.component;

        if (component.hooks === UND) {
          component.hooks = [];
        }
        let hookIndex = component.hooks.length;

        if (oldMethod === currentMethod && "hooks" in oldComponentNode && oldComponentNode.hooks[hookIndex] !== UND) {
          component.hooks = oldComponentNode.hooks;
          hook = oldComponentNode.hooks[hookIndex];
          if (update) {
            update(hook, ...args);
          }
        } else {
          hook = init(...args);
          component.hooks.push(hook);
        }

        if (response) {
          return response(hook);
        }
      };
    }
  };

  createHook({
    name: "state",
    init: (value) => {
      let state = value;
      let setState = (value) => (state = value);

      let stateObj = Object.create(null);
      stateObj.toJSON = stateObj.toString = stateObj.valueOf = () => (typeof state === "function" ? state() : state);

      return [stateObj, setState];
    },
    response: (hook) => hook
  });

  // Effect hook
  function callHook(hook, changes) {
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

    if (typeof hook.onCleanup === "function") {
      v.onCleanup(hook.onCleanup);
    }
  }
  createHook({
    name: "effect",
    init: (effect, changes) => {
      let hook = { effect, prev: changes };
      callHook(hook);
      return hook;
    },
    update: (hook, effect, changes) => callHook(hook, changes)
  });
};

plugin.default = plugin;
module.exports = plugin;
