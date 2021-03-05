(function(){'use strict';class Vnode {
  constructor(name, props, children) {
    this.props = props || {};
    this.children = children;
    this.name = name;
  }
}
class TextVnode {
  constructor(dom) {
    this.dom = dom;
  }
}
class Component {
  constructor(component, props, children) {
    this.props = props;
    this.children = children;
    this.component = component;
  }
}
const UND = void 0;
const NULL = null;
const isArray = Array.isArray;
const functionstr = "function";
const once = "v-once";
const key = "key";
const svg = "svg";
const str = "string";
const createElement = (tag, isSVG = false) => isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
const domToVnode = (dom) => {
  if (dom.nodeType === 1) {
    let props = {};
    [].forEach.call(dom.attributes, (prop) => props[prop.nodeName] = prop.nodeValue);
    let vnode = new Vnode(dom.nodeName, props, []);
    vnode.dom = dom;
    for (let i = 0, l = dom.childNodes.length; i < l; i++) {
      let childVnode = domToVnode(dom.childNodes[i]);
      childVnode && vnode.children.push(childVnode);
    }
    return vnode;
  }
  if (dom.nodeType === 3) {
    return new TextVnode(dom);
  }
};
const emptyNode = new Vnode("empty", NULL, []);
const callRemove = (vnode) => {
  for (let i = 0, l = vnode.children.length; i < l; i++) {
    vnode.children[i] instanceof Vnode && callRemove(vnode.children[i]);
  }
  vnode.props.onremove && vnode.props.onremove(vnode);
};
const isNode = new Function("try {return this===global;}catch(e){return false;}")();
const trust = (htmlString) => {
  let div = createElement("div");
  div.innerHTML = htmlString.trim();
  return [].map.call(div.childNodes, (item) => domToVnode(item));
};
function valyrian() {
  function v(tagOrComponent, props = NULL, ...children) {
    if (typeof tagOrComponent === str) {
      return new Vnode(tagOrComponent, props, children);
    }
    return new Component(tagOrComponent, props, children);
  }
  v.isMounted = false;
  v.isNode = isNode;
  let mainContainer = NULL;
  let mainNode;
  let oldMainNode;
  let mountedComponent;
  const reservedWords = [key, "data", once, "oncreate", "onupdate", "onremove", "onbeforeupdate"];
  v.reservedWords = reservedWords;
  const current = {
    parentVnode: UND,
    oldParentVnode: UND,
    component: UND
  };
  v.current = current;
  const plugins = new Map();
  v.usePlugin = (plugin, options = {}) => !plugins.has(plugin) && plugins.set(plugin, true) && plugin(v, options);
  let attachedListeners = {};
  function eventListener(e) {
    let dom = e.target;
    let name = `__on${e.type}`;
    while (dom) {
      if (dom[name]) {
        dom[name](e, dom);
        if (!e.defaultPrevented) {
          v.update();
        }
        return;
      }
      dom = dom.parentNode;
    }
  }
  v.trust = trust;
  let vnodesToCleanup = [];
  v.onCleanup = (callback) => {
    let parentVnode = v.current.parentVnode;
    if (!parentVnode.onCleanup) {
      parentVnode.onCleanup = [];
    }
    parentVnode.onCleanup.push(callback);
    if (vnodesToCleanup.indexOf(parentVnode) === -1) {
      vnodesToCleanup.push(parentVnode);
    }
  };
  let cleanupVnodes = () => {
    for (let l = vnodesToCleanup.length; l--; ) {
      for (let callback of vnodesToCleanup[l].onCleanup) {
        callback();
      }
    }
    vnodesToCleanup = [];
  };
  const addProps = (newNode) => {
    for (let name in newNode.props) {
      let value = newNode.props[name];
      if (reservedWords.indexOf(name) !== -1) {
        if (directives[name]) {
          directives[name](value, newNode);
        }
      } else if (typeof value === functionstr) {
        name = `__${name}`;
        if (!attachedListeners[name]) {
          mainContainer.addEventListener(name.slice(4), eventListener);
          attachedListeners[name] = true;
        }
        newNode.dom[name] = value;
      } else if (name in newNode.dom && !newNode.isSVG) {
        if (newNode.dom[name] != value) {
          newNode.dom[name] = value;
        }
      } else {
        newNode.dom.setAttribute(name, value);
      }
    }
  };
  const updateProperty = (name, newNode, oldNode) => {
    if (name in newNode.props) {
      let value = newNode.props[name];
      if (reservedWords.indexOf(name) !== -1) {
        if (directives[name]) {
          directives[name](value, newNode, oldNode);
        }
      } else if (typeof value === functionstr) {
        name = `__${name}`;
        if (!attachedListeners[name]) {
          mainContainer.addEventListener(name.slice(4), eventListener);
          attachedListeners[name] = true;
        }
        newNode.dom[name] = value;
      } else if (name in newNode.dom && !newNode.isSVG) {
        if (newNode.dom[name] != value) {
          newNode.dom[name] = value;
        }
      } else if (!oldNode || value !== oldNode.props[name]) {
        newNode.dom.setAttribute(name, value);
      }
    }
  };
  v.updateProperty = updateProperty;
  let updateProps = (newNode, oldNode) => {
    for (let name in newNode.props) {
      updateProperty(name, newNode, oldNode);
    }
  };
  let removeProps = (newNode, oldNode) => {
    for (let name in oldNode.props) {
      if (reservedWords.indexOf(name) === -1 && name in newNode.props === false && (oldNode === emptyNode || typeof oldNode.props[name] !== functionstr)) {
        if (name in newNode.dom) {
          newNode.dom[name] = UND;
        } else {
          newNode.dom.removeAttribute(name);
        }
      }
    }
  };
  let moveDom = (dom, $parent, oldDom) => {
    oldDom ? $parent.replaceChild(dom, oldDom) : $parent.appendChild(dom);
  };
  let updateKeyedNode = ($parent, newNode, newIndex, compareNode) => {
    let oldDom = $parent.childNodes[newIndex];
    if (compareNode) {
      newNode.dom = compareNode.dom;
      if (once in newNode.props || newNode.props.onbeforeupdate && newNode.props.onbeforeupdate(newNode, compareNode) === false) {
        newNode.children = compareNode.children;
        newNode.dom !== oldDom && moveDom(newNode.dom, $parent, oldDom);
      } else {
        removeProps(newNode, compareNode);
        updateProps(newNode, compareNode);
        newNode.dom !== oldDom && moveDom(newNode.dom, $parent, oldDom);
        if (v.isMounted) {
          newNode.props.onupdate && newNode.props.onupdate(newNode, compareNode);
        } else {
          newNode.props.oncreate && newNode.props.oncreate(newNode);
        }
        patch(newNode, compareNode);
      }
    } else {
      newNode.dom = createElement(newNode.name, newNode.isSVG);
      addProps(newNode);
      newNode.dom !== oldDom && moveDom(newNode.dom, $parent, oldDom);
      newNode.props.oncreate && newNode.props.oncreate(newNode);
      patch(newNode);
    }
  };
  let patch = (parentNode, oldParentNode = emptyNode) => {
    let newTree = isArray(parentNode.children) ? parentNode.children : [parentNode.children];
    let oldTree = oldParentNode.children;
    current.parentVnode = parentNode;
    current.oldParentVnode = oldParentNode;
    for (let i = 0; i < newTree.length; i++) {
      let childVnode = newTree[i];
      if (childVnode instanceof Vnode) {
        childVnode.isSVG = parentNode.isSVG || childVnode.name === svg;
      } else if (childVnode === NULL || childVnode === UND) {
        newTree.splice(i--, 1);
      } else if (childVnode instanceof Component) {
        current.component = childVnode;
        newTree.splice(i--, 1, ("view" in childVnode.component ? childVnode.component.view : childVnode.component).call(childVnode.component, childVnode.props, ...childVnode.children));
      } else if (isArray(childVnode)) {
        newTree.splice(i--, 1, ...childVnode);
      }
    }
    if (newTree.length === 0) {
      if (oldTree.length > 0) {
        for (let i = oldTree.length; i--; ) {
          oldTree[i] instanceof Vnode && callRemove(oldTree[i]);
        }
        parentNode.dom.textContent = "";
      }
    } else if (oldTree.length && newTree[0] instanceof Vnode && key in newTree[0].props) {
      let oldKeys = oldTree.map((vnode) => vnode.props.key);
      let newKeys = newTree.map((vnode) => vnode.props.key);
      for (let i = 0, l2 = newKeys.length; i < l2; i++) {
        let key2 = newKeys[i];
        let newNode = newTree[i];
        if (key2 === oldKeys[i]) {
          oldTree[i].processed = true;
          updateKeyedNode(parentNode.dom, newNode, i, oldTree[i]);
        } else {
          let oldIndex = oldKeys.indexOf(key2);
          let newIndex = i >= oldKeys.length ? -1 : i;
          if (oldIndex !== -1) {
            oldTree[oldIndex].processed = true;
            updateKeyedNode(parentNode.dom, newNode, newIndex, oldTree[oldIndex]);
          } else {
            updateKeyedNode(parentNode.dom, newNode, newIndex);
          }
        }
      }
      let l = oldTree.length;
      while (l--) {
        if (!oldTree[l].processed) {
          let oldVnode = oldTree[l];
          callRemove(oldVnode);
          oldVnode.dom && oldVnode.dom.parentNode && oldVnode.dom.parentNode.removeChild(oldVnode.dom);
        }
      }
    } else {
      let i = oldTree.length;
      let l = newTree.length;
      while (i-- > l) {
        let oldVnode = oldTree[i];
        oldVnode instanceof Vnode && callRemove(oldVnode);
        oldVnode.dom && oldVnode.dom.parentNode && oldVnode.dom.parentNode.removeChild(oldVnode.dom);
      }
      for (i = 0; i < l; i++) {
        let newNode = newTree[i];
        let oldNode = oldTree[i];
        if (newNode instanceof Vnode) {
          if (oldNode && newNode.name === oldNode.name) {
            newNode.dom = oldNode.dom;
            if (once in newNode.props || newNode.props.onbeforeupdate && newNode.props.onbeforeupdate(newNode, oldNode) === false) {
              newNode.children = oldNode.children;
            } else {
              removeProps(newNode, oldNode);
              updateProps(newNode, oldNode);
              if (v.isMounted) {
                newNode.props.onupdate && newNode.props.onupdate(newNode, oldNode);
              } else {
                newNode.props.oncreate && newNode.props.oncreate(newNode);
              }
              patch(newNode, oldNode);
            }
          } else {
            newNode.dom = createElement(newNode.name, newNode.isSVG);
            addProps(newNode);
            if (oldNode) {
              oldNode instanceof Vnode && callRemove(oldNode);
              parentNode.dom.replaceChild(newNode.dom, parentNode.dom.childNodes[i]);
            } else {
              parentNode.dom.appendChild(newNode.dom);
            }
            newNode.props.oncreate && newNode.props.oncreate(newNode);
            patch(newNode);
          }
        } else {
          let dom;
          let value = newNode instanceof TextVnode ? newNode.dom.nodeValue : String(newNode);
          if (oldNode instanceof TextVnode) {
            dom = oldNode.dom;
            if (value != dom.nodeValue) {
              dom.nodeValue = value;
            }
          } else {
            dom = document.createTextNode(value);
            if (oldNode) {
              callRemove(oldNode);
              parentNode.dom.replaceChild(dom, oldNode.dom);
            } else {
              parentNode.dom.appendChild(dom);
            }
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
        cleanupVnodes();
        oldMainNode = mainNode;
        mainNode = new Vnode(mainNode.name, mainNode.props, [v(mountedComponent, props, ...children)]);
        mainNode.dom = oldMainNode.dom;
        mainNode.isSVG = mainNode.name === svg;
        patch(mainNode, oldMainNode);
        v.isMounted = true;
      }
      return v.isNode && mainNode.dom.innerHTML;
    }
  };
  v.mount = (container, component, props, ...children) => {
    mainContainer = v.isNode ? createElement(container) : document.querySelectorAll(container)[0];
    mainNode = domToVnode(mainContainer);
    mountedComponent = component;
    return v.update(props, ...children);
  };
  v.unMount = () => {
    mainContainer = NULL;
    mountedComponent = () => "";
    let result = v.update();
    v.isMounted = false;
    return result;
  };
  const directives = {};
  v.directive = (directive, handler) => {
    let directiveName = `v-${directive}`;
    if (reservedWords.indexOf(directiveName) === -1) {
      reservedWords.push(directiveName);
      directives[directiveName] = handler;
    }
  };
  let hideDirective = (test) => (bool, vnode, oldnode) => {
    let value = test ? bool : !bool;
    if (value) {
      let newdom = document.createTextNode("");
      if (oldnode && oldnode.dom && oldnode.dom.parentNode) {
        oldnode instanceof Vnode && callRemove(oldnode);
        oldnode.dom.parentNode.replaceChild(newdom, oldnode.dom);
      }
      vnode.name = "";
      vnode.children = [];
      vnode.props = {};
      vnode.dom = newdom;
    }
  };
  v.directive("if", hideDirective(false));
  v.directive("unless", hideDirective(true));
  v.directive("for", (set, vnode) => vnode.children = set.map(vnode.children[0]));
  v.directive("show", (bool, vnode) => vnode.dom.style.display = bool ? "" : "none");
  v.directive("class", (classes, vnode) => {
    for (let name in classes) {
      vnode.dom.classList.toggle(name, classes[name]);
    }
  });
  v.directive("html", (html, vnode) => vnode.children = trust(html));
  v.newInstance = valyrian;
  return v;
}
module.exports = valyrian();}());