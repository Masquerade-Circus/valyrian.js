let UND;
let oncreate = 'v-create';
let onupdate = 'v-update';
let onremove = 'v-remove';
let onbeforeupdate = 'v-beforeupdate';
let mainNode;
let oldMainNode;
let mountedComponent;
let FALSE = false;
let TRUE = true;
let NIL = null;
let emptyObject = Object.create(NIL);
let emptyArray = [];

function Vnode(name, props, children) {
  this.props = props || emptyObject;
  this.children = children;
  this.name = name;
};

function TextVnode() {}
TextVnode.prototype = {
  props: emptyObject,
  children: emptyArray
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

// This could be extended to do a deep clone
// This mutates the component
v.addState = (component, state) => Object.assign(component, state);

// Hydrates the current dom before mount
v.dom2vnode = function (dom) {
  let vnode;
  if (dom.nodeType === 3) {
    vnode = new TextVnode();
    vnode.dom = dom;
  } else if (dom.nodeType === 1) {
    let props = {};
    emptyArray.forEach.call(dom.attributes, ({nodeName, nodeValue}) => props[nodeName] = nodeValue);

    vnode = new Vnode(
      dom.nodeName,
      props,
      []
    );
    vnode.dom = dom;

    for (let i = 0, l = dom.childNodes.length; i < l; i++) {
      let childVnode = v.dom2vnode(dom.childNodes[i]);
      childVnode && vnode.children.push(childVnode);
    }
  }
  return vnode;
};

v.trust = (htmlString) => {
  let div = createElement('div');
  div.innerHTML = htmlString.trim();

  return emptyArray.map.call(div.childNodes, (item) => v.dom2vnode(item));
};

// Plugin system
let plugins = new Map();
v.usePlugin = (plugin, options) => !plugins.has(plugin) && plugins.set(plugin, TRUE) && plugin(v, options);

v.reservedWords = {
  key: NIL,
  'v-noop': NIL,
  [oncreate]: NIL,
  [onbeforeupdate]: NIL,
  [onupdate]: NIL,
  [onremove]: NIL
};

let attachedListeners = {};
function eventListener(e) {
  let dom = e.target;
  let name = `__on${e.type}`;
  while (dom) {
    if (name in dom) {
      dom[name](e);
      if (e.defaultPrevented === FALSE) {
        v.update();
      }
      return;
    }
    dom = dom.parentNode;
  }
};

function lifecycleCall(vnode, methodName, oldNode) {
  if (methodName === onremove) {
    cleanupVnode(vnode);
    for (let i = 0, l = vnode.children.length; i < l; i++) {
      lifecycleCall(vnode.children[i], onremove);
    }
  }

  if (methodName in vnode.props) {
    return vnode.props[methodName](vnode, oldNode);
  }
}

v.updateProperty = (name, newNode, oldNode, isSVG) => {
  let value = newNode.props[name];
  if (name in v.reservedWords) {
    if (typeof v.reservedWords[name] === 'function') {
      v.reservedWords[name](value, newNode, oldNode, isSVG);
    }
  } else if (typeof value === 'function') {
    name = `__${name}`;
    if (name in attachedListeners === FALSE) {
      document.addEventListener(name.slice(4), eventListener);
      attachedListeners[name] = TRUE;
    };
    newNode.dom[name] = value;
  } else if (name in newNode.dom && !isSVG) {
    if (newNode.dom[name] !== value) {
      newNode.dom[name] = value;
    }
  } else if (value !== oldNode.props[name]) {
    newNode.dom.setAttribute(name, value);
  }
};

function updateProps(newNode, oldNode, isSVG) {
  for (let name in newNode.props) {
    v.updateProperty(name, newNode, oldNode, isSVG);
  }
}

function createNode(newNode, isSVG) {
  newNode.dom = createElement(newNode.name, isSVG);
  updateProps(newNode, emptyNode, isSVG);
  lifecycleCall(newNode, oncreate);
  patch(newNode, emptyNode, isSVG);
}

function updateNode(newNode, oldNode, isSVG) {
  newNode.dom = oldNode.dom;
  if ('v-noop' in newNode.props || lifecycleCall(newNode, onbeforeupdate, oldNode) === FALSE) {
    newNode.children = oldNode.children;
  } else {
    for (let name in oldNode.props) {
      if (name in v.reservedWords === FALSE && name in newNode.props === FALSE && typeof oldNode.props[name] !== 'function') {
        if (name in newNode.dom) {
          newNode.dom[name] = NIL;
        } else {
          newNode.dom.removeAttribute(name);
        }
      }
    }
    updateProps(newNode, oldNode, isSVG);
    lifecycleCall(newNode, !v.isMounted ? oncreate : onupdate, oldNode);
    patch(newNode, oldNode, isSVG);
  }
}

function removeNode($parent, oldNode) {
  lifecycleCall(oldNode, onremove);
  $parent.removeChild(oldNode.dom);
}

function updateKeyedNode($parent, newNode, compareNode, isSVG, newIndex) {
  // Moved or updated
  'dom' in compareNode ?
    updateNode(newNode, compareNode, isSVG) :
    createNode(newNode, isSVG);

  if (newNode.dom !== $parent.childNodes[newIndex]) {
    $parent.childNodes[newIndex] !== UND ?
      $parent.replaceChild(newNode.dom, $parent.childNodes[newIndex]) :
      $parent.appendChild(newNode.dom);
  }
}

function getKeys(list) {
  let keys = [];
  for (let i = 0, l = list.length; i < l; i++) {
    keys.push(list[i].props.key);
  }
  return keys;
}

v.onCleanup = function (callback) {
  if (v.current.parentVnode.onCleanup === UND) {
    v.current.parentVnode.onCleanup = [];
    v.current.parentVnode.cleanUp = TRUE;
  }
  v.current.parentVnode.onCleanup.push(callback);
};

function cleanupVnode(vnode) {
  if (vnode.cleanUp) {
    for (let i = 0, l = vnode.onCleanup.length; i < l; i++) {
      vnode.onCleanup[i]();
    }
  }
}

v.current = {
  parentVnode: NIL,
  oldParentVnode: NIL,
  component: NIL
};

// eslint-disable-next-line complexity,sonarjs/cognitive-complexity
function patch(parentNode, oldParentNode, isSVG) {
  let {dom: $parent, children: newTree} = parentNode;
  let oldTree = oldParentNode.children;
  v.current.parentVnode = parentNode;
  v.current.oldParentVnode = oldParentNode;
  cleanupVnode(oldParentNode);

  if (Array.isArray(newTree) === FALSE) {
    newTree = [newTree];
  }

  // New tree is empty so just remove all old nodes
  if (newTree.length === 0) {
    for (let i = oldTree.length; i--;) {
      lifecycleCall(oldTree[i], onremove);
    }
    $parent.textContent = '';
  } else {

    // Flatten children
    for (let i = 0; i < newTree.length; i++) {
      let childVnode = newTree[i];

      if (childVnode instanceof Vnode) {
        if (typeof childVnode.name !== 'string') {
          v.current.component = childVnode;
          let viewMethod = 'view' in childVnode.name ? childVnode.name.view : childVnode.name;
          newTree.splice(i, 1, ...[viewMethod.call(viewMethod, childVnode.props, ...childVnode.children)]);
          i--;
        } else {
          if (childVnode.name === 'svg') {
            childVnode.isSVG = TRUE;
          }
        }
      } else if (Array.isArray(childVnode)) {
        newTree.splice(i, 1, ...childVnode);
        i--;
      }
    }

    let firstNode = newTree[0];

    // Is keyed list
    if (oldTree.length > 0 && firstNode instanceof Vnode && 'key' in firstNode.props) {
      let oldKeys = getKeys(oldTree);
      let newKeys = getKeys(newTree);

      for (let i = 0, l = newKeys.length; i < l; i++) {
        let key = newKeys[i];
        let newNode = newTree[i];
        isSVG = isSVG || newNode.isSVG;

        // Updated: Same key
        if (key === oldKeys[i]) {
          oldTree[i].processed = TRUE;
          updateKeyedNode($parent, newNode, oldTree[i], isSVG, i);
        } else {
          let oldIndex = oldKeys.indexOf(key);
          let newIndex = i >= oldKeys.length ? UND : i;

          // Moved: Key exists in old keys
          if (oldIndex !== -1) {
            oldTree[oldIndex].processed = TRUE;
            updateKeyedNode($parent, newNode, oldTree[oldIndex], isSVG, newIndex);
          // Added: Key does not exists in old keys
          } else {
            updateKeyedNode($parent, newNode, emptyNode, isSVG, newIndex);
          }
        }
      }

      // Delete unprocessed old keys
      for (let i = 0, l = oldTree.length; i < l; i++) {
        if ('processed' in oldTree[i] === FALSE) {
          lifecycleCall(oldTree[i], onremove);
          oldTree[i].dom.parentNode && $parent.removeChild(oldTree[i].dom);
        }
      }

    // Not keyed list or first render so use the simple algorithm
    } else {
      if (oldTree.length > newTree.length) {
        // Remove deleted nodes
        for (let i = oldTree.length, l = newTree.length; i-- && i >= l;) {
          removeNode($parent, oldTree[i]);
        }
      }

      for (let i = 0, l = newTree.length; i < l; i++) {
        let newNode = newTree[i];
        let oldNode = oldTree[i];


        // Is vnode
        if (newNode instanceof Vnode) {
          isSVG = isSVG || newNode.isSVG;

          // Added
          if (oldNode === UND) {
            createNode(newNode, isSVG);
            $parent.appendChild(newNode.dom);
          // Replaced
          } else if (newNode.name !== oldNode.name) {
            createNode(newNode, isSVG);
            lifecycleCall(oldNode, onremove);
            $parent.replaceChild(newNode.dom, oldNode.dom);
          // Updated
          } else {
            updateNode(newNode, oldNode, isSVG);
          }

        // Is text
        } else {
          let dom;
          // Added
          if (oldNode === UND) {
            dom = document.createTextNode(newNode);
            $parent.appendChild(dom);
          // Replace element
          } else if (oldNode instanceof Vnode) {
            dom = document.createTextNode(newNode);
            lifecycleCall(oldNode, onremove);
            $parent.replaceChild(dom, oldNode.dom);
            // Updated
          } else {
            dom = oldNode.dom;
            newNode = String(newNode);
            if (newNode !== dom.nodeValue) {
              dom.nodeValue = newNode;
            }
          }

          newTree[i] = new TextVnode();
          newTree[i].dom = dom;
        }
      }
    }
  }

  parentNode.children = newTree;
};

v.update = (props, ...children) => {
  if (mainNode) {
    if (mountedComponent !== UND) {
      oldMainNode = mainNode;
      mainNode = new Vnode(mainNode.name, mainNode.props, v(mountedComponent, props, children));
      mainNode.dom = oldMainNode.dom;
      patch(mainNode, oldMainNode, mainNode.isSVG);
      v.isMounted = TRUE;
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

  return v.update(props, children);
};

v.unmount = () => {
  mountedComponent = () => '';
  let result = v.update();
  mountedComponent = UND;
  v.isMounted = FALSE;
  return result;
};

v.directive = (directive, handler) => directive in v.reservedWords === FALSE && (v.reservedWords[directive] = handler);
v.directive('v-for', (set, vnode) => vnode.children = set.map(vnode.children[0]));

let hideDirective = (test) => (bool, vnode, oldnode) => {
  if (bool === test) {
    let dom = document.createTextNode('');
    if (oldnode && oldnode.dom && oldnode.dom.parentNode) {
      lifecycleCall(oldnode, onremove);
      oldnode.dom.parentNode.replaceChild(dom, oldnode.dom);
    }
    vnode.name = '';
    vnode.children = emptyArray;
    vnode.props = emptyObject;
    vnode.dom = dom;
  }
};

v.directive('v-if', hideDirective(FALSE));
v.directive('v-unless', hideDirective(TRUE));
v.directive('v-show', (bool, vnode) => vnode.dom.style.display = bool === FALSE ? 'none' : '');

(v.isNode ? global : window).v = v;
