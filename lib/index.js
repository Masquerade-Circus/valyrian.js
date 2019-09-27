let UND;
let oncreate = 'v-create';
let onupdate = 'v-update';
let onremove = 'v-remove';
let onbeforeupdate = 'v-beforeupdate';
let oldTree;
let mainContainer;
let mountedComponent;
let FALSE = false;
let TRUE = true;
let NIL = null;
let emptyObject = Object.create(NIL);
let emptyArray = [];

function Vnode(name, props, children) {
  this.props = props || emptyObject;
  this.children = children;
  this.isSVG = name === 'svg';
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
  if (typeof tagOrComponent === 'string') {
    return new Vnode(tagOrComponent, props, children);
  }

  if ('view' in tagOrComponent === FALSE) {
    tagOrComponent.view = tagOrComponent;
  }

  return tagOrComponent.view(props, ...children);
};

v.isNode = typeof window === 'undefined';

// This could be extended to do a deep clone
// This mutates the component
v.addState = (component, state) => Object.assign(component, {view: component}, state);

// Hydrates the current dom before mount
v.dom2vnode = function (dom) {
  let vnode;
  if (dom.nodeType === 3) {
    vnode = new TextVnode();
    vnode.dom = dom;
  } else if (dom.nodeType === 1) {
    let name = dom.nodeName;
    vnode = new Vnode(
      name,
      {},
      []
    );
    vnode.dom = dom;

    for (let l = dom.attributes.length; l--;) {
      let property = dom.attributes[l];
      vnode.props[property.nodeName] = property.nodeValue;
    }

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
    for (let i = 0, l = vnode.children.length; i < l; i++) {
      lifecycleCall(vnode.children[i], onremove);
    }
  }

  if (methodName in vnode.props) {
    return vnode.props[methodName](vnode, oldNode);
  }
}

function updateProps(newNode, oldNode, isSVG) {
  let dom = newNode.dom;
  for (let name in newNode.props) {
    let prop = newNode.props[name];
    if (name in v.reservedWords) {
      if (typeof v.reservedWords[name] === 'function') {
        v.reservedWords[name](prop, newNode, oldNode);
      }
    } else if (typeof prop === 'function') {
      name = `__${name}`;
      if (name in attachedListeners === FALSE) {
        document.addEventListener(name.slice(4), eventListener);
        attachedListeners[name] = TRUE;
      };
      dom[name] = prop;
    } else if (name in dom && !isSVG) {
      if (dom[name] !== prop) {
        dom[name] = prop;
      }
    } else if (prop !== oldNode.props[name]) {
      dom.setAttribute(name, prop);
    }
  }
}

function createNode(newNode, isSVG) {
  newNode.dom = createElement(newNode.name, isSVG);
  updateProps(newNode, emptyNode, isSVG);
  lifecycleCall(newNode, oncreate);
  newNode.children = patch(newNode.dom, newNode.children, emptyArray, isSVG);
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
    newNode.children = patch(newNode.dom, newNode.children, oldNode.children, isSVG);
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

// eslint-disable-next-line complexity,sonarjs/cognitive-complexity
function patch($parent, newTree, oldTree, isSVG) {
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
      if (Array.isArray(newTree[i])) {
        newTree.splice(i, 1, ...newTree[i]);
        i--;
        continue;
      }
    }

    let firstNode = newTree[0];

    // Is keyed list
    if (oldTree.length > 0 && firstNode !== NIL && firstNode !== UND && firstNode.constructor === Vnode && 'key' in firstNode.props) {
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
        if (newNode !== NIL && newNode !== UND && newNode.constructor === Vnode) {
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
          } else if (oldNode !== NIL && oldNode !== UND && oldNode.constructor === Vnode) {
            dom = document.createTextNode(newNode);
            lifecycleCall(oldNode, onremove);
            $parent.replaceChild(dom, oldNode.dom);
            // Updated
          } else {
            dom = oldNode.dom;
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

  return newTree;
};

v.update = (props, ...children) => {
  if (mountedComponent !== UND) {
    oldTree = patch(mainContainer, v(mountedComponent, props, children), oldTree);
    v.isMounted = TRUE;
  }

  return v.isNode && mainContainer.innerHTML;
};

v.mount = (container, component, props, ...children) => {
  mainContainer = v.isNode
    ? createElement('div')
    : typeof container === 'string'
      ? document.querySelectorAll(container)[0]
      : container;

  oldTree = v.dom2vnode(mainContainer).children;

  mountedComponent = component;

  return v.update(props, children);
};

v.unmount = () => {
  mountedComponent = () => {};
  v.update();
  mountedComponent = UND;
  v.isMounted = FALSE;
};

v.directive = (directive, handler) => directive in v.reservedWords === FALSE && (v.reservedWords[directive] = handler);
v.directive('v-for', (set, vnode) => {
  let handler = vnode.children[0];
  vnode.children = [];
  for (let i = 0, l = set.length; i < l; i++) {
    vnode.children[i] = handler(set[i], i);
  }
});

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
