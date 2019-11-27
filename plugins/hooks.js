let plugin = (v) => {
  let hookIndex = 0;
  let UND;

  function createHook(value) {
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

  v.useState = function (initial) {
    let currentVnode = v.current.component;

    if (v.current.parentVnode.components === UND) {
      v.current.parentVnode.components = [];
    }

    if (v.current.parentVnode.components.indexOf(currentVnode) === -1) {
      v.current.parentVnode.components.push(currentVnode);
    }

    let hook;
    let oldComponentNode = v.current.oldParentVnode.components &&
      v.current.oldParentVnode.components[v.current.parentVnode.components.length - 1];
    let oldMethod = oldComponentNode && ('view' in oldComponentNode.name ? oldComponentNode.name.view : oldComponentNode.name);
    let currentMethod = 'view' in currentVnode.name ? currentVnode.name.view : currentVnode.name;

    if (currentVnode.hooks === UND) {
      currentVnode.hooks = [];
      hookIndex = 0;
    }

    if (oldMethod === currentMethod && 'hooks' in oldComponentNode && oldComponentNode.hooks[hookIndex] !== UND) {
      currentVnode.hooks = oldComponentNode.hooks;
      hook = oldComponentNode.hooks[hookIndex];
    } else {
      hook = createHook(initial);
      currentVnode.hooks.push(hook);
    }

    hookIndex++;
    return hook;
  };
};

export default plugin;
