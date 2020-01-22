let UND = void 0;
let oncreate = 'v-create';
let onupdate = 'v-update';
let onremove = 'v-remove';
let onbeforeupdate = 'v-beforeupdate';
let functionstr = 'function';
let list = 'v-list';
let noop = 'v-noop';
let mainNode;
let oldMainNode;
let mountedComponent;

function Vnode(name, props, children) {
  this.props = props || {};
  this.children = children;
  this.name = name;
};

function TextVnode(dom) {
  this.dom = dom;
}
TextVnode.prototype = {
  props: {},
  children: []
};

let emptyNode = new TextVnode();

function createElement(tag, isSVG) {
  return isSVG ?
    document.createElementNS('http://www.w3.org/2000/svg', tag) :
    document.createElement(tag);
}

function v(tagOrComponent, props, ...children) {
  return new Vnode(tagOrComponent, props, children);
};

v.isNode = typeof window === 'undefined';

// Hydrates the current dom before mount
v.dom2vnode = function (dom) {
  if (dom.nodeType === 3) {
    return new TextVnode(dom);
  }

  if (dom.nodeType === 1) {
    let props = {};
    [].forEach.call(dom.attributes, (prop) => props[prop.nodeName] = prop.nodeValue);

    let vnode = new Vnode(
      dom.nodeName,
      props,
      []
    );
    vnode.dom = dom;

    for (let i = 0, l = dom.childNodes.length; i < l; i++) {
      let childVnode = v.dom2vnode(dom.childNodes[i]);
      childVnode && vnode.children.push(childVnode);
    }
    return vnode;
  }
};

v.trust = (htmlString) => {
  let div = createElement('div');
  div.innerHTML = htmlString.trim();

  return [].map.call(div.childNodes, (item) => v.dom2vnode(item));
};

// Plugin system
let plugins = new Map();
v.usePlugin = (plugin, options) => !plugins.has(plugin) && plugins.set(plugin, true) && plugin(v, options);

v.reservedWords = {
  key: true,
  [list]: true,
  [noop]: true,
  [oncreate]: true,
  [onbeforeupdate]: true,
  [onupdate]: true,
  [onremove]: true
};

let attachedListeners = {};
function eventListener(e) {
  let dom = e.target;
  let name = `__on${e.type}`;
  while (dom) {
    if (dom[name]) {
      dom[name](e);
      if (!e.defaultPrevented) {
        v.update();
      }
      return;
    }
    dom = dom.parentNode;
  }
};

function lifecycleCall(vnode, methodName, oldNode) {
  if (methodName === onremove) {
    vnode.cleanUp && cleanupVnode(vnode);
    for (let i = 0, l = vnode.children.length; i < l; i++) {
      lifecycleCall(vnode.children[i], onremove);
    }
  }

  if (vnode.props[methodName]) {
    return vnode.props[methodName](vnode, oldNode);
  }
}

v.updateProperty = (name, newNode, oldNode) => {
  let value = newNode.props[name];
  if (v.reservedWords[name]) {
    if (typeof v.reservedWords[name] === functionstr) {
      v.reservedWords[name](value, newNode, oldNode);
    }
  } else if (typeof value === functionstr) {
    name = `__${name}`;
    if (!attachedListeners[name]) {
      document.addEventListener(name.slice(4), eventListener);
      attachedListeners[name] = true;
    };
    newNode.dom[name] = value;
  } else if (name in newNode.dom && !newNode.isSVG) {
    if (newNode.dom[name] !== value) {
      newNode.dom[name] = value;
    }
  } else if (value !== oldNode.props[name]) {
    newNode.dom.setAttribute(name, value);
  }
};

function updateProps(newNode, oldNode) {
  for (let name in newNode.props) {
    v.updateProperty(name, newNode, oldNode);
  }
}

function createNode(newNode) {
  newNode.dom = createElement(newNode.name, newNode.isSVG);
  updateProps(newNode, emptyNode);
  lifecycleCall(newNode, oncreate);
  patch(newNode, emptyNode);
}

function updateNode(newNode, oldNode) {
  newNode.dom = oldNode.dom;
  if (newNode.props[noop] || lifecycleCall(newNode, onbeforeupdate, oldNode) === false) {
    newNode.children = oldNode.children;
  } else {
    for (let name in oldNode.props) {
      if (!v.reservedWords[name] && name in newNode.props === false && typeof oldNode.props[name] !== functionstr) {
        if (name in newNode.dom) {
          newNode.dom[name] = UND;
        } else {
          newNode.dom.removeAttribute(name);
        }
      }
    }
    updateProps(newNode, oldNode);
    lifecycleCall(newNode, v.isMounted ? onupdate : oncreate, oldNode);
    patch(newNode, oldNode);
  }
}

function updateKeyedNode($parent, newNode, compareNode, newIndex) {
  // Moved or updated
  compareNode.dom ?
    updateNode(newNode, compareNode) :
    createNode(newNode);

  if (newNode.dom !== $parent.childNodes[newIndex]) {
    $parent.childNodes[newIndex] ?
      $parent.replaceChild(newNode.dom, $parent.childNodes[newIndex]) :
      $parent.appendChild(newNode.dom);
  }
}

v.onCleanup = function (callback) {
  let parentVnode = v.current.parentVnode;
  if (!parentVnode.cleanUp) {
    parentVnode.onCleanup = [];
    parentVnode.cleanUp = true;
  }
  parentVnode.onCleanup.push(callback);
};

function cleanupVnode(vnode) {
  for (let callback of vnode.onCleanup) {
    callback();
  }
}

v.current = {
  parentVnode: UND,
  oldParentVnode: UND,
  component: UND
};

let isArray = Array.isArray;

// eslint-disable-next-line complexity,sonarjs/cognitive-complexity
function patch(parentNode, oldParentNode) {
  let newTree = isArray(parentNode.children) ? parentNode.children : [parentNode.children];
  let oldTree = oldParentNode.children;
  v.current.parentVnode = parentNode;
  v.current.oldParentVnode = oldParentNode;

  // Flatten children
  for (let i = 0; i < newTree.length; i++) {
    let childVnode = newTree[i];

    if (isArray(childVnode)) {
      newTree.splice(i--, 1, ...childVnode);
    } else if (childVnode instanceof Vnode) {
      if (typeof childVnode.name !== 'string') {
        v.current.component = childVnode;
        let viewMethod = childVnode.name.view || childVnode.name;
        newTree.splice(i--, 1, ...[viewMethod.call(childVnode.name, childVnode.props, ...childVnode.children)]);
      } else {
        childVnode.isSVG = parentNode.isSVG || childVnode.name === 'svg';
        childVnode.cleanUp && cleanupVnode(childVnode);
      }
    }
  }

  // Is keyed list
  if (oldTree.length && parentNode.props[list]) {
    let oldKeys = oldTree.map(vnode => vnode.props.key);
    let newKeys = newTree.map(vnode => vnode.props.key);

    for (let i = 0, l = newKeys.length; i < l; i++) {
      let key = newKeys[i];
      let newNode = newTree[i];

      // Updated: Same key
      if (key === oldKeys[i]) {
        oldTree[i].processed = true;
        updateKeyedNode(parentNode.dom, newNode, oldTree[i], i);
      } else {
        let oldIndex = oldKeys.indexOf(key);
        let newIndex = i >= oldKeys.length ? UND : i;

        // Moved: Key exists in old keys
        if (oldIndex !== -1) {
          oldTree[oldIndex].processed = true;
          updateKeyedNode(parentNode.dom, newNode, oldTree[oldIndex], newIndex);
          // Added: Key does not exists in old keys
        } else {
          updateKeyedNode(parentNode.dom, newNode, emptyNode, newIndex);
        }
      }
    }

    // Delete unprocessed old keys
    let l = oldTree.length;

    while (l--) {
      if (!oldTree[l].processed) {
        lifecycleCall(oldTree[l], onremove);
        oldTree[l].dom.parentNode && parentNode.dom.removeChild(oldTree[l].dom);
      }
    }

    // Not keyed list or first render so use the simple algorithm
  } else {
    let i = oldTree.length;
    let l = newTree.length;

    // Remove deleted nodes
    while (i-- > l) {
      lifecycleCall(oldTree[i], onremove);
      parentNode.dom.removeChild(oldTree[i].dom);
    }

    for (i = 0; i < l; i++) {
      let newNode = newTree[i];
      let oldNode = oldTree[i];
      // Is vnode
      if (newNode instanceof Vnode) {
        if (!oldNode) {
          createNode(newNode);
          parentNode.dom.appendChild(newNode.dom);
        } else {
          if (newNode.name === oldNode.name) {
            updateNode(newNode, oldNode);
          } else {
            createNode(newNode);
            lifecycleCall(oldNode, onremove);
            parentNode.dom.replaceChild(newNode.dom, oldNode.dom);
          }
        }

      } else if (oldNode instanceof TextVnode) {
        newNode = String(newNode);
        if (newNode !== oldNode.dom.nodeValue) {
          oldNode.dom.nodeValue = newNode;
        }
        newTree[i] = oldNode;
      } else {
        let dom = document.createTextNode(newNode);
        if (!oldNode) {
          parentNode.dom.appendChild(dom);
        } else {
          lifecycleCall(oldNode, onremove);
          parentNode.dom.replaceChild(dom, oldNode.dom);
        }

        newTree[i] = new TextVnode(dom);
      }
    }
  }

  parentNode.children = newTree;
};

v.update = (props, ...children) => {
  if (mainNode) {
    if (mountedComponent) {
      oldMainNode = mainNode;
      mainNode = new Vnode(mainNode.name, mainNode.props, v(mountedComponent, props, ...children));
      mainNode.dom = oldMainNode.dom;
      mainNode.isSVG = mainNode.name === 'svg';
      oldMainNode.cleanUp && cleanupVnode(oldMainNode);
      patch(mainNode, oldMainNode);
      v.isMounted = true;
    }

    return v.isNode && mainNode.dom.innerHTML;
  }
};

v.mount = (container, component, props, ...children) => {
  let mainContainer = v.isNode
    ? createElement('div')
    : typeof container === 'string'
      ? document.querySelectorAll(container)[0]
      : container;

  mainNode = v.dom2vnode(mainContainer);
  mountedComponent = component;

  return v.update(props, ...children);
};

v.unmount = () => {
  mountedComponent = () => '';
  let result = v.update();
  mountedComponent = UND;
  v.isMounted = false;
  return result;
};

v.directive = (directive, handler) => !v.reservedWords[directive] && (v.reservedWords[directive] = handler);
v.directive('v-for', (set, vnode) => vnode.children = set.map(vnode.children[0]));

let hideDirective = (test) => (bool, vnode, oldnode) => {
  if (bool === test) {
    let newdom = document.createTextNode('');
    if (oldnode.dom && oldnode.dom.parentNode) {
      lifecycleCall(oldnode, onremove);
      oldnode.dom.parentNode.replaceChild(newdom, oldnode.dom);
    }
    vnode.name = '';
    vnode.children = [];
    vnode.props = {};
    vnode.dom = newdom;
  }
};

v.directive('v-if', hideDirective(false));
v.directive('v-unless', hideDirective(true));
v.directive('v-show', (bool, vnode) => vnode.dom.style.display = bool ? '' : 'none');

(v.isNode ? global : window).v = v;
