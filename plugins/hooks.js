let plugin = (v) => {
  let currentComponentNode;
  let hookIndex = 0;
  let currentParentNode;
  let currentOldParentNode;
  let currentComponentIndex;

  function cleanupVnode(vnode) {
    if (vnode.hasComponents) {
      for (let i = 0, l = vnode.onCleanup.length; i < l; i++) {
        vnode.onCleanup[i] && vnode.onCleanup[i]();
      }
    }
  }

  v.useState = function (initial) {
    let hook;
    let oldComponentNode = currentOldParentNode.components[currentComponentIndex];
    let oldMethod = oldComponentNode && (oldComponentNode.name.view || oldComponentNode.name);
    let currentMethod = currentComponentNode && (currentComponentNode.name.view || currentComponentNode.name);

    if (oldMethod === currentMethod && oldComponentNode.hooks && oldComponentNode.hooks[hookIndex]) {
      currentComponentNode.hooks = oldComponentNode.hooks;
      hook = oldComponentNode.hooks[hookIndex];
    } else {
      hook = {
        state: initial,
        setState(value) {
          hook.state = typeof value === 'function' ? value(hook.state) : value;
          v.update();
        }
      };
      currentComponentNode.hooks.push(hook);
    }

    return [hook.state, hook.setState];
  };

  v.useCleanup = function (callback) {
    currentParentNode.onCleanup.push(callback);
  };

  v.onEvent('onUpdate', cleanupVnode);
  v.onEvent('onVnode', vnode => {
    vnode.hooks = vnode.isComponent || [];
    vnode.onCleanup = [];
    cleanupVnode(vnode);
  });
  v.onEvent('onLifecycle', (vnode, methodName) => methodName === 'onremove' && cleanupVnode(vnode));
  v.onEvent('onPatch', (parentNode, oldParentNode) => {
    currentParentNode = parentNode;
    currentOldParentNode = oldParentNode;
    currentComponentIndex = 0;
  });
  v.onEvent('onComponent', (currentComponent) => {
    hookIndex = 0;
    currentComponentNode = currentComponent;
  });
  v.onEvent('afterComponent', () => currentComponentIndex++);
};

export default plugin;
