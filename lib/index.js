//eslint-disable-next-line max-lines-per-function
function valyrian() {
  let UND = void 0;
  let oncreate = "oncreate";
  let onupdate = "onupdate";
  let onremove = "onremove";
  let onbeforeupdate = "onbeforeupdate";
  let functionstr = "function";
  let once = "v-once";
  let isArray = Array.isArray;
  let mainNode;
  let oldMainNode;
  let mountedComponent;
  let directives = {};
  let mainContainer;

  function Vnode(name, props, children) {
    this.props = props || {};
    this.children = children;
    this.name = name;
  }

  function TextVnode(dom) {
    this.dom = dom;
  }
  TextVnode.prototype = {
    props: {},
    children: []
  };

  let emptyNode = new TextVnode();

  function createElement(tag, isSVG) {
    return isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
  }

  function lifecycleCall(vnode, methodName, oldNode) {
    if (vnode.props[methodName]) {
      return vnode.props[methodName](vnode, oldNode);
    }
  }

  function callRemove(vnode) {
    if (vnode instanceof Vnode) {
      for (let i = 0, l = vnode.children.length; i < l; i++) {
        callRemove(vnode.children[i]);
      }

      vnode.props[onremove] && vnode.props[onremove](vnode);
    }
  }

  function v(tagOrComponent, props, ...children) {
    return new Vnode(tagOrComponent, props, children);
  }

  v.isNode = typeof window === "undefined";

  // Hydrates the current dom before mount
  v.domToVnode = (dom) => {
    if (dom.nodeType === 3) {
      return new TextVnode(dom);
    }

    if (dom.nodeType === 1) {
      let props = {};
      [].forEach.call(dom.attributes, (prop) => (props[prop.nodeName] = prop.nodeValue));

      let vnode = new Vnode(dom.nodeName, props, []);
      vnode.dom = dom;

      for (let i = 0, l = dom.childNodes.length; i < l; i++) {
        let childVnode = v.domToVnode(dom.childNodes[i]);
        childVnode && vnode.children.push(childVnode);
      }
      return vnode;
    }
  };

  v.trust = (htmlString) => {
    let div = createElement("div");
    div.innerHTML = htmlString.trim();

    return [].map.call(div.childNodes, (item) => v.domToVnode(item));
  };

  // Plugin system
  let plugins = new Map();
  v.usePlugin = (plugin, options) => !plugins.has(plugin) && plugins.set(plugin, true) && plugin(v, options);

  v.reservedWords = ["key", once, oncreate, onbeforeupdate, onupdate, onremove, "data"];

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

  v.updateProperty = (name, newNode, oldNode) => {
    if (name in newNode.props) {
      let value = newNode.props[name];
      if (v.reservedWords.indexOf(name) !== -1) {
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
        if (newNode.dom[name] !== value) {
          newNode.dom[name] = value;
        }
      } else if (!oldNode || value !== oldNode.props[name]) {
        newNode.dom.setAttribute(name, value);
      }
    }
  };

  function updateProps(newNode, oldNode) {
    for (let name in newNode.props) {
      v.updateProperty(name, newNode, oldNode);
    }
  }

  function removeProps(newNode, oldNode) {
    for (let name in oldNode.props) {
      if (v.reservedWords.indexOf(name) === -1 && name in newNode.props === false && typeof oldNode.props[name] !== functionstr) {
        if (name in newNode.dom) {
          newNode.dom[name] = UND;
        } else {
          newNode.dom.removeAttribute(name);
        }
      }
    }
  }

  function moveDom(dom, $parent, oldDom) {
    if (dom !== oldDom) {
      oldDom ? $parent.replaceChild(dom, oldDom) : $parent.appendChild(dom);
    }
  }

  function removeVnode(vnode) {
    callRemove(vnode);
    vnode.dom && vnode.dom.parentNode && vnode.dom.parentNode.removeChild(vnode.dom);
  }

  function updateKeyedNode($parent, newNode, compareNode, newIndex) {
    let oldDom = $parent.childNodes[newIndex];
    // Moved or updated
    if (compareNode.dom) {
      newNode.dom = compareNode.dom;
      if (newNode.props[once] || lifecycleCall(newNode, onbeforeupdate, compareNode) === false) {
        newNode.children = compareNode.children;
        moveDom(newNode.dom, $parent, oldDom);
      } else {
        removeProps(newNode, compareNode);
        updateProps(newNode, compareNode);
        moveDom(newNode.dom, $parent, oldDom);
        lifecycleCall(newNode, v.isMounted ? onupdate : oncreate, compareNode);
        patch(newNode, compareNode);
      }
    } else {
      newNode.dom = createElement(newNode.name, newNode.isSVG);
      updateProps(newNode);
      moveDom(newNode.dom, $parent, oldDom);
      lifecycleCall(newNode, oncreate);
      patch(newNode, emptyNode);
    }
  }

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

  function cleanupVnodes() {
    for (let l = vnodesToCleanup.length; l--; ) {
      for (let callback of vnodesToCleanup[l].onCleanup) {
        callback();
      }
    }
    vnodesToCleanup = [];
  }

  v.current = {
    parentVnode: UND,
    oldParentVnode: UND,
    component: UND
  };

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
        if (typeof childVnode.name === "string") {
          childVnode.isSVG = parentNode.isSVG || childVnode.name === "svg";
        } else {
          v.current.component = childVnode;
          newTree.splice(i--, 1, ...[(childVnode.name.view || childVnode.name).call(childVnode.name, childVnode.props, ...childVnode.children)]);
        }
      } else if (childVnode === null || childVnode === UND) {
        newTree.splice(i--, 1);
      }
    }

    if (newTree.length === 0) {
      if (oldTree.length > 0) {
        let i = oldTree.length;
        while (i--) {
          callRemove(oldTree[i]);
        }
        parentNode.dom.textContent = "";
      }

      // Is keyed list
    } else if (oldTree.length && newTree[0] instanceof Vnode && newTree[0].props.key) {
      let oldKeys = oldTree.map((vnode) => vnode.props.key);
      let newKeys = newTree.map((vnode) => vnode.props.key);

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
        !oldTree[l].processed && removeVnode(oldTree[l]);
      }

      // Not keyed list or first render so use the simple algorithm
    } else {
      let i = oldTree.length;
      let l = newTree.length;

      // Remove deleted nodes
      while (i-- > l) {
        removeVnode(oldTree[i]);
      }

      for (i = 0; i < l; i++) {
        let newNode = newTree[i];
        let oldNode = oldTree[i];
        // Is vnode
        if (newNode instanceof Vnode) {
          if (!oldNode) {
            newNode.dom = createElement(newNode.name, newNode.isSVG);
            updateProps(newNode);
            parentNode.dom.appendChild(newNode.dom);
            lifecycleCall(newNode, oncreate);
            patch(newNode, emptyNode);
          } else {
            if (newNode.name === oldNode.name) {
              newNode.dom = oldNode.dom;
              if (newNode.props[once] || lifecycleCall(newNode, onbeforeupdate, oldNode) === false) {
                newNode.children = oldNode.children;
              } else {
                removeProps(newNode, oldNode);
                updateProps(newNode, oldNode);
                lifecycleCall(newNode, v.isMounted ? onupdate : oncreate, oldNode);
                patch(newNode, oldNode);
              }
            } else {
              callRemove(oldNode);
              newNode.dom = createElement(newNode.name, newNode.isSVG);
              updateProps(newNode);
              parentNode.dom.replaceChild(newNode.dom, parentNode.dom.childNodes[i]);
              lifecycleCall(newNode, oncreate);
              patch(newNode, emptyNode);
            }
          }
        } else {
          let dom;

          // If we are getting a TextVnode could be from the domToVnode method
          let value = newNode.dom ? newNode.dom.nodeValue : String(newNode);

          if (oldNode instanceof TextVnode) {
            dom = oldNode.dom;
            if (value !== dom.nodeValue) {
              dom.nodeValue = value;
            }
          } else {
            dom = document.createTextNode(value);
            if (!oldNode) {
              parentNode.dom.appendChild(dom);
            } else {
              callRemove(oldNode);
              parentNode.dom.replaceChild(dom, oldNode.dom);
            }
          }
          newTree[i] = new TextVnode(dom);
        }
      }
    }

    parentNode.children = newTree;
  }

  v.update = (props, ...children) => {
    if (mainNode) {
      if (mountedComponent) {
        cleanupVnodes();
        oldMainNode = mainNode;
        mainNode = new Vnode(mainNode.name, mainNode.props, [v(mountedComponent, props, ...children)]);
        mainNode.dom = oldMainNode.dom;
        mainNode.isSVG = mainNode.name === "svg";
        patch(mainNode, oldMainNode);
        v.isMounted = true;
      }

      return v.isNode && mainNode.dom.innerHTML;
    }
  };

  v.mount = (container, component, props, ...children) => {
    mainContainer = v.isNode ? createElement("div") : typeof container === "string" ? document.querySelectorAll(container)[0] : container;

    mainNode = v.domToVnode(mainContainer);
    mountedComponent = component;

    return v.update(props, ...children);
  };

  v.unMount = () => {
    mainContainer = null;
    mountedComponent = () => "";
    let result = v.update();
    mountedComponent = UND;
    v.isMounted = false;
    return result;
  };

  v.directive = (directive, handler) => {
    let directiveName = `v-${directive}`;
    if (v.reservedWords.indexOf(directiveName) === -1) {
      v.reservedWords.push(directiveName);
      directives[directiveName] = handler;
    }
  };

  let hideDirective = (test) => (bool, vnode, oldnode) => {
    let value = test ? bool : !bool;
    if (value) {
      let newdom = document.createTextNode("");
      if (oldnode && oldnode.dom && oldnode.dom.parentNode) {
        callRemove(oldnode);
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
  v.directive("for", (set, vnode) => (vnode.children = set.map(vnode.children[0])));
  v.directive("show", (bool, vnode) => (vnode.dom.style.display = bool ? "" : "none"));
  v.directive("class", (classes, vnode) => {
    for (let name in classes) {
      vnode.dom.classList.toggle(name, classes[name]);
    }
  });
  v.directive("html", (html, vnode) => (vnode.children = v.trust(html)));

  return v;
}

const v = valyrian();
v.newInstance = valyrian;

(v.isNode ? global : window).v = v;
