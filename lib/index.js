

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

function Vnode(name, props, children) {
  this.props = props || emptyObject;
  this.children = children;
  this.isSVG = name === 'svg';
  this.name = name;
};

function TextVnode() {}
TextVnode.prototype = {
  props: emptyObject,
  children: []
};

let emptyNode = new TextVnode();

function createElement(tag, isSVG, isText) {
  return isText ?
    document.createTextNode(tag) :
    isSVG ?
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
  let div = createElement('div');
  div.innerHTML = htmlString.trim();

  return [].map.call(div.childNodes, (item) => dom2vnode(item));
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

// eslint-disable-next-line complexity,sonarjs/cognitive-complexity
function patch($parent, newTree, oldTree, isSVG) {
  if (!Array.isArray(newTree)) {
    newTree = [newTree];
  }

  if (newTree.length === 0) {
    // Remove deleted nodes
    for (let i = oldTree.length; i--;) {
      lifecycleCall(oldTree[i], onremove);
    }

    $parent.textContent = '';
  } else {
    for (let i = 0; i < newTree.length; i++) {
      let newNode = newTree[i];
      let oldNode = oldTree[i];
      let dom;

      if (Array.isArray(newNode)) {
        newTree.splice(i, 1, ...newNode);
        i--;
        continue;
      }

      if (newNode instanceof Vnode) {
        let isNew = !v.isMounted;
        isSVG = isSVG || newNode.isSVG;
        let shouldUpdate = TRUE;

        // Added
        if (oldNode === und) {
          dom = newNode.dom = createElement(newNode.name, isSVG);
          $parent.appendChild(dom);
          isNew = TRUE;
          oldNode = emptyNode;
          // Updated
        } else if (newNode.name === oldNode.name) {
          dom = newNode.dom = oldNode.dom;

          shouldUpdate = lifecycleCall(newNode, onbeforeupdate, oldNode) !== FALSE;

          if (shouldUpdate) {
            for (let name in oldNode.props) {
              if (name in newNode.props === FALSE && typeof oldNode.props[name] !== 'function') {
                if (name in dom) {
                  dom[name] = null;
                } else {
                  dom.removeAttribute(name);
                }
              }
            }
          } else {
            newNode.children = oldNode.children;
          }
          // Replaced
        } else {
          dom = newNode.dom = createElement(newNode.name, isSVG);
          lifecycleCall(oldNode, onremove);
          $parent.replaceChild(dom, oldNode.dom);
          isNew = TRUE;
        }

        if (shouldUpdate) {
          for (let name in newNode.props) {
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
            } else if (name in oldNode.props === FALSE || prop !== oldNode.props[name]) {
              dom.setAttribute(name, prop);
            }
          }

          lifecycleCall(newNode, isNew ? oncreate : onupdate, oldNode);

          newNode.children = patch(newNode.dom, newNode.children, oldNode.children, isSVG);
        }
      } else {

        // Added
        if (oldNode === und) {
          dom = dom = createElement(newNode, FALSE, TRUE);
          $parent.appendChild(dom);

        // Replaced text
        } else if (oldNode instanceof TextVnode) {
          dom = oldNode.dom;
          if (newNode !== dom.nodeValue) {
            dom.nodeValue = newNode;
          }
        // Replaced element
        } else {
          dom = createElement(newNode, FALSE, TRUE);
          lifecycleCall(oldNode, onremove);
          $parent.replaceChild(dom, oldNode.dom);
        }

        newTree[i] = new TextVnode();
        newTree[i].dom = dom;
      }
    }

    if (oldTree.length > newTree.length) {
      // Remove deleted nodes
      for (let i = oldTree.length, l = newTree.length; i-- && i >= l;) {
        lifecycleCall(oldTree[i], onremove);
        $parent.removeChild(oldTree[i].dom);
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
