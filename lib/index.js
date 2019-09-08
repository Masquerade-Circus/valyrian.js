let und;
let oncreate = 'oncreate';
let onupdate = 'onupdate';
let onremove = 'onremove';
let onbeforeupdate = 'onbeforeupdate';
let update;
let oldTree;
let mainContainer;
let mountedComponent;
let FALSE = false;
let TRUE = true;
let emptyObject = Object.create(null);
let emptyArray = [];
let keyString = 'key';

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

// Hydrates the current dom before mount
function dom2vnode($el) {
  let nt = $el.nodeType;
  if (nt === 3) {
    let vnode = new TextVnode();
    vnode.dom = $el;
    return vnode;
  }

  if (nt === 1) {
    let name = $el.nodeName.toLowerCase();
    let vnode = new Vnode(
      name,
      {},
      []
    );
    vnode.dom = $el;

    for (let l = $el.attributes.length; l--;) {
      let property = $el.attributes[l];
      vnode.props[property.nodeName] = property.nodeValue;
    }

    for (let l = $el.childNodes.length; l--;) {
      let childVnode = dom2vnode($el.childNodes[l]);
      if (childVnode) {
        vnode.children.push(childVnode);
      }
    }

    return vnode;
  }
};

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

// NOTE: This does not work with undom for server side rendering
// See: https://github.com/developit/undom/issues/7
v.trust = (htmlString) => {
  let div = createElement('div', FALSE);
  div.innerHTML = htmlString.trim();

  return emptyArray.map.call(div.childNodes, (item) => dom2vnode(item));
};

// Plugin system
let plugins = new Map();
v.use = (plugin, options) => !plugins.has(plugin) && plugins.set(plugin, plugin(v, options));

let attachedListeners = {};
function eventListener(e) {
  let dom = e.target;
  let name = `__on${e.type}`;
  while (dom) {
    if (name in dom) {
      dom[name](e);
      update();
      return;
    }
    dom = dom.parentNode;
  }
};

function lifecycleCall(vnode, methodName, oldNode) {
  if (vnode instanceof Vnode) {
    if (methodName === onremove) {
      for (let i = 0, l = vnode.children.length; i < l; i++) {
        lifecycleCall(vnode.children[i], onremove);
      }
    }

    if (methodName in vnode.props) {
      return vnode.props[methodName](vnode, oldNode);
    }
  }
}

function updateProps(newNode, oldNode, isSVG) {
  let dom = newNode.dom;
  for (let name in newNode.props) {
    if (name !== keyString) {
      let prop = newNode.props[name];
      if (typeof prop === 'function') {
        switch (name) {
          case oncreate:
          case onupdate:
          case onremove:
          case onbeforeupdate:
            break;
          default:
            name = `__${name}`;
            if (name in attachedListeners === FALSE) {
              document.addEventListener(name.slice(4), eventListener);
              attachedListeners[name] = TRUE;
            };
            dom[name] = prop;
            break;
        }
      } else if (name in dom && dom[name] !== prop && !isSVG) {
        dom[name] = prop;
      } else if (prop !== oldNode.props[name]) {
        dom.setAttribute(name, prop);
      }
    }
  }
}

function addNode($parent, newNode, isSVG, index) {
  isSVG || newNode.isSVG;
  newNode.dom = createElement(newNode.name, isSVG);
  updateProps(newNode, emptyNode, isSVG);
  index === und ?
    $parent.appendChild(newNode.dom) :
    $parent.insertBefore(newNode.dom, $parent.children[index] || null);

  lifecycleCall(newNode, oncreate);
  newNode.children = patch(newNode.dom, newNode.children, emptyArray, isSVG);
}

function updateNode(newNode, oldNode, isSVG) {
  isSVG = isSVG || newNode.isSVG;
  newNode.dom = oldNode.dom;
  if (lifecycleCall(newNode, onbeforeupdate, oldNode) === FALSE) {
    newNode.children = oldNode.children;
  } else {
    for (let name in oldNode.props) {
      if (name in newNode.props === FALSE && typeof oldNode.props[name] !== 'function') {
        if (name in newNode.dom) {
          newNode.dom[name] = null;
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

    // Is all new so just add them to parent node
    if (oldTree.length === 0) {
      for (let i = 0, l = newTree.length; i < l; i++) {
        let newNode = newTree[i];
        if (newNode instanceof Vnode) {
          addNode($parent, newNode, isSVG);
        } else {
          let dom = document.createTextNode(newNode);
          $parent.appendChild(dom);

          newTree[i] = new TextVnode();
          newTree[i].dom = dom;
        }
      }

    // Is keyed list
    } else if (newTree[0] instanceof Vnode && keyString in newTree[0].props) {
      let oldKeys = getKeys(oldTree);
      let newKeys = getKeys(newTree);
      let oldLength = oldTree.length;
      let newLength = newTree.length;
      let newOldTree = [...oldTree];

      // record the move of the last element.
      let indexDeltas = new Array(oldLength).fill(0);
      for (let newIndex = 0; newIndex < newLength; newIndex++) {
        let key = newKeys[newIndex];
        let physicalIndex = oldKeys.indexOf(key);
        if (physicalIndex === -1) {
          // Added
          let newNode = newTree[newIndex];
          newOldTree.splice(newIndex, 0, newNode);
          addNode($parent, newNode, isSVG, newIndex);

          // Positions of all unprocessed elements should take this delta.
          indexDeltas[oldLength - 1]++;
        } else {
          let oldIndex = physicalIndex;

          for (let i = oldLength - 1; i >= physicalIndex; i--) {
            oldIndex += indexDeltas[i];
          }

          // Updated
          if (newIndex === oldIndex) {
            updateNode(newTree[newIndex], newOldTree[newIndex], isSVG);
            continue;
          }

          // Moved
          let oldNode = newOldTree.splice(oldIndex, 1)[0];
          newOldTree.splice(newIndex, 0, oldNode);
          updateNode(newTree[newIndex], oldNode, isSVG);
          $parent.insertBefore(newTree[newIndex].dom, $parent.children[newIndex]);

          // It is impossible to move element from front to back.
          indexDeltas[physicalIndex]++;
        }
      }

      // Removed
      for (let i = 0, l = oldKeys.length; i < l; i++) {
        if (newKeys.indexOf(oldKeys[i]) === -1) {
          removeNode($parent, newOldTree.splice(newLength, 1)[0]);
        }
      }

    // Not keyed list so use the simple algorithm
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

        if (newNode instanceof Vnode) {
          // Added
          if (oldNode === und) {
            addNode($parent, newNode, isSVG);
            // Updated
          } else if (newNode.name === oldNode.name) {
            updateNode(newNode, oldNode, isSVG);
            // Replaced
          } else {
            isSVG = isSVG || newNode.isSVG;
            newNode.dom = createElement(newNode.name, isSVG);
            lifecycleCall(oldNode, onremove);
            updateProps(newNode, emptyNode, isSVG);
            $parent.replaceChild(newNode.dom, oldNode.dom);
            lifecycleCall(newNode, oncreate);
            newNode.children = patch(newNode.dom, newNode.children, emptyArray, isSVG);
          }

        } else {
          let dom;

          // Added
          if (oldNode === und) {
            dom = document.createTextNode(newNode);
            $parent.appendChild(dom);

            // Replaced text
          } else if (oldNode instanceof TextVnode) {
            dom = oldNode.dom;
            if (newNode !== dom.nodeValue) {
              dom.nodeValue = newNode;
            }
            // Replaced element
          } else {
            dom = document.createTextNode(newNode);
            lifecycleCall(oldNode, onremove);
            $parent.replaceChild(dom, oldNode.dom);
          }

          newTree[i] = new TextVnode();
          newTree[i].dom = dom;
        }
      }
    }
  }

  return newTree;
};

v.update = update = (props, ...children) => {
  oldTree = patch(mainContainer, v(mountedComponent, props, children), oldTree);

  v.isMounted = TRUE;

  return v.isNode && mainContainer.innerHTML;
};

v.mount = (container, component, props, ...children) => {
  mainContainer = v.isNode
    ? createElement('div')
    : typeof container === 'string'
      ? document.querySelectorAll(container)[0]
      : container;

  oldTree = dom2vnode(mainContainer).children;

  mountedComponent = component;

  return update(props, children);
};

(v.isNode ? global : window).v = v;
