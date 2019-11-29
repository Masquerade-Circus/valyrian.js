let plugin = (v) => {
  let UND;

  v.createHook = function ({name, init, update, response}) {
    name = `use${name.charAt(0).toUpperCase()}${name.slice(1).toLowerCase()}`;
    if (!v[name]) {
      v[name] = (...args) => {
        let currentComponent = v.current.component;

        if (v.current.parentVnode.components === UND) {
          v.current.parentVnode.components = [];
        }

        if (v.current.parentVnode.components.indexOf(currentComponent) === -1) {
          v.current.parentVnode.components.push(currentComponent);
        }

        let hook;
        let oldComponentNode = v.current.oldParentVnode.components &&
          v.current.oldParentVnode.components[v.current.parentVnode.components.length - 1];
        let oldMethod = oldComponentNode && ('view' in oldComponentNode.name ? oldComponentNode.name.view : oldComponentNode.name);
        let currentMethod = 'view' in currentComponent.name ? currentComponent.name.view : currentComponent.name;

        if (currentComponent.hooks === UND) {
          currentComponent.hooks = [];
        }
        let hookIndex = currentComponent.hooks.length;

        if (oldMethod === currentMethod && 'hooks' in oldComponentNode && oldComponentNode.hooks[hookIndex] !== UND) {
          currentComponent.hooks = oldComponentNode.hooks;
          hook = oldComponentNode.hooks[hookIndex];
          if (update) {
            update(hook, ...args);
          }
        } else {
          hook = init(...args);
          currentComponent.hooks.push(hook);
        }

        if (response) {
          return response(hook);
        }
      };
    }
  };

  // State hook
  function createStateHook(value) {
    let method = function (value) {
      if (value !== UND) {
        hook.state = value;
      }
      return hook.state;
    };
    method.setState = method.toJSON = method.toString = method.valueOf = method;

    let hook = new Proxy(method, {
      set(hook, prop, val) {
        if (prop === 'state') {
          hook.state = val;
          return true;
        }
      },
      get(hook, prop) {
        if (prop === 'state') {
          return typeof hook.state === 'function' ? hook.state() : hook.state;
        }

        return hook[prop];
      }
    });

    hook(value);
    return hook;
  }
  v.createHook({
    name: 'state',
    init: (initial) => createStateHook(initial),
    response: (hook) => [hook, hook.setState]
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
