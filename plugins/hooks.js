let plugin = (v) => {
  let UND;

  v.createHook = function ({name, init, update, response}) {
    name = `use${name.charAt(0).toUpperCase()}${name.slice(1).toLowerCase()}`;
    if (!v[name]) {
      v[name] = (...args) => {
        let {component, parentVnode, oldParentVnode} = v.current;

        if (parentVnode.components === UND) {
          parentVnode.components = [];
        }

        if (parentVnode.components.indexOf(component) === -1) {
          parentVnode.components.push(component);
        }

        let hook;
        let oldComponentNode = oldParentVnode.components && oldParentVnode.components[parentVnode.components.length - 1];
        let oldMethod = oldComponentNode && ('view' in oldComponentNode.name ? oldComponentNode.name.view : oldComponentNode.name);
        let currentMethod = 'view' in component.name ? component.name.view : component.name;

        if (component.hooks === UND) {
          component.hooks = [];
        }
        let hookIndex = component.hooks.length;

        if (oldMethod === currentMethod && 'hooks' in oldComponentNode && oldComponentNode.hooks[hookIndex] !== UND) {
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

  function createStateHook(value) {
    let state = value;
    let setState = value => state = value;

    let stateObj = Object.create(null);
    stateObj.toJSON = stateObj.toString = stateObj.valueOf = () => typeof state === 'function' ? state() : state;

    return [stateObj, setState];
  }

  v.createHook({
    name: 'state',
    init: (initial) => createStateHook(initial),
    response: (hook) => hook
  });


  // Effect hook
  function callHook(hook, changes) {
    let {prev} = hook;
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

    if (hook.onCleanup) {
      v.onCleanup(hook.onCleanup);
    }
  }
  v.createHook({
    name: 'effect',
    init: (effect, changes) => {
      let hook = {effect, prev: changes};
      callHook(hook);
      return hook;
    },
    update: (hook, effect, changes) => {
      callHook(hook, changes);
    }
  });

};

export default plugin;
