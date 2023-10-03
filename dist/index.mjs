// lib/index.ts
var textTag = "#text";
var isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);
function createDomElement(tag, isSVG = false) {
  return isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
}
var Vnode = function Vnode2(tag, props, children) {
  this.tag = tag;
  this.props = props;
  this.children = children;
};
function isComponent(component) {
  return Boolean(
    component && (typeof component === "function" || typeof component === "object" && "view" in component)
  );
}
var isVnode = (object) => {
  return object instanceof Vnode;
};
var isVnodeComponent = (object) => {
  return isVnode(object) && isComponent(object.tag);
};
function domToVnode(dom) {
  if (dom.nodeType === 3) {
    const vnode2 = new Vnode(textTag, {}, [dom.nodeValue]);
    vnode2.dom = dom;
    return vnode2;
  }
  const children = [];
  for (let i = 0, l = dom.childNodes.length; i < l; i++) {
    const childDom = dom.childNodes[i];
    if (childDom.nodeType === 1 || childDom.nodeType === 3) {
      children.push(domToVnode(childDom));
    }
  }
  const props = {};
  for (let i = 0, l = dom.attributes.length; i < l; i++) {
    const attr = dom.attributes[i];
    props[attr.nodeName] = attr.nodeValue;
  }
  const vnode = new Vnode(dom.tagName.toLowerCase(), props, children);
  vnode.dom = dom;
  return vnode;
}
function trust(htmlString) {
  const div = createDomElement("div");
  div.innerHTML = htmlString.trim();
  return [].map.call(div.childNodes, (item) => domToVnode(item));
}
var mainComponent = null;
var mainVnode = null;
var isMounted = false;
var current = {
  vnode: null,
  oldVnode: null,
  component: null,
  event: null
};
var reservedProps = {
  key: true,
  state: true,
  "v-keep": true,
  // Built in directives
  "v-if": true,
  "v-unless": true,
  "v-for": true,
  "v-show": true,
  "v-class": true,
  "v-html": true,
  "v-model": true,
  "v-create": true,
  "v-update": true,
  "v-cleanup": true
};
var onCleanupSet = /* @__PURE__ */ new Set();
var onMountSet = /* @__PURE__ */ new Set();
var onUpdateSet = /* @__PURE__ */ new Set();
var onUnmountSet = /* @__PURE__ */ new Set();
function onMount(callback) {
  if (!isMounted) {
    onMountSet.add(callback);
  }
}
function onUpdate(callback) {
  onUpdateSet.add(callback);
}
function onCleanup(callback) {
  onCleanupSet.add(callback);
}
function onUnmount(callback) {
  if (!isMounted) {
    onUnmountSet.add(callback);
  }
}
function callSet(set) {
  for (const callback of set) {
    callback();
  }
  set.clear();
}
var eventListenerNames = {};
function eventListener(e) {
  current.event = e;
  let dom = e.target;
  const name = `v-on${e.type}`;
  while (dom) {
    if (dom[name]) {
      dom[name](e, dom);
      if (!e.defaultPrevented) {
        update();
      }
      return;
    }
    dom = dom.parentNode;
  }
  current.event = null;
}
var hideDirective = (test) => (bool, vnode, oldnode) => {
  const value = test ? bool : !bool;
  if (value) {
    const newdom = document.createTextNode("");
    if (oldnode && oldnode.dom && oldnode.dom.parentNode) {
      oldnode.dom.parentNode.replaceChild(newdom, oldnode.dom);
    }
    vnode.tag = "#text";
    vnode.children = [];
    vnode.props = {};
    vnode.dom = newdom;
    return false;
  }
};
var directives = {
  // The "v-if" directive hides an element if the given condition is false
  "v-if": hideDirective(false),
  // The "v-unless" directive hides an element if the given condition is true
  "v-unless": hideDirective(true),
  // The "v-for" directive creates a loop and applies a callback function to each item in the loop
  "v-for": (set, vnode) => {
    const newChildren = [];
    const callback = vnode.children[0];
    for (let i = 0, l = set.length; i < l; i++) {
      newChildren.push(callback(set[i], i));
    }
    vnode.children = newChildren;
  },
  // The "v-show" directive shows or hides an element by setting the "display" style property
  "v-show": (bool, vnode) => {
    vnode.dom.style.display = bool ? "" : "none";
  },
  // The "v-class" directive adds or removes class names from an element based on a condition
  "v-class": (classes, vnode) => {
    for (const name in classes) {
      vnode.dom.classList.toggle(name, classes[name]);
    }
  },
  // The "v-html" directive sets the inner HTML of an element to the given HTML string
  "v-html": (html, vnode) => {
    vnode.children = [trust(html)];
  },
  // The "v-model" directive binds the value of an input element to a model property
  "v-model": ([model, property, event], vnode, oldVnode) => {
    let value;
    let handler = (e) => model[property] = e.target.value;
    if (vnode.tag === "input") {
      event = event || "oninput";
      switch (vnode.props.type) {
        case "checkbox": {
          if (Array.isArray(model[property])) {
            handler = (e) => {
              const val = e.target.value;
              const idx = model[property].indexOf(val);
              if (idx === -1) {
                model[property].push(val);
              } else {
                model[property].splice(idx, 1);
              }
            };
            value = model[property].indexOf(vnode.dom.value) !== -1;
          } else if ("value" in vnode.props) {
            handler = () => {
              if (model[property] === vnode.props.value) {
                model[property] = null;
              } else {
                model[property] = vnode.props.value;
              }
            };
            value = model[property] === vnode.props.value;
          } else {
            handler = () => model[property] = !model[property];
            value = model[property];
          }
          sharedSetAttribute("checked", value, vnode);
          break;
        }
        case "radio": {
          sharedSetAttribute("checked", model[property] === vnode.dom.value, vnode);
          break;
        }
        default: {
          sharedSetAttribute("value", model[property], vnode);
        }
      }
    } else if (vnode.tag === "select") {
      event = event || "onclick";
      if (vnode.props.multiple) {
        handler = (e) => {
          const val = e.target.value;
          if (e.ctrlKey) {
            const idx = model[property].indexOf(val);
            if (idx === -1) {
              model[property].push(val);
            } else {
              model[property].splice(idx, 1);
            }
          } else {
            model[property].splice(0, model[property].length);
            model[property].push(val);
          }
        };
        vnode.children.forEach((child) => {
          if (child.tag === "option") {
            const value2 = "value" in child.props ? child.props.value : child.children.join("").trim();
            child.props.selected = model[property].indexOf(value2) !== -1;
          }
        });
      } else {
        vnode.children.forEach((child) => {
          if (child.tag === "option") {
            const value2 = "value" in child.props ? child.props.value : child.children.join("").trim();
            child.props.selected = value2 === model[property];
          }
        });
      }
    } else if (vnode.tag === "textarea") {
      event = event || "oninput";
      vnode.children = [model[property]];
    }
    const prevHandler = vnode.props[event];
    sharedSetAttribute(
      event,
      (e) => {
        handler(e);
        if (prevHandler) {
          prevHandler(e);
        }
      },
      vnode,
      oldVnode
    );
  },
  // The "v-create" directive is called when a new virtual node is created.
  // The provided callback function is called with the new virtual node as an argument.
  // This directive is only called once per virtual node, when it is first created.
  // eslint-disable-next-line no-unused-vars
  "v-create": (callback, vnode, oldVnode) => {
    if (!oldVnode) {
      const cleanup = callback(vnode);
      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },
  // The "v-update" directive is called when an existing virtual node is updated.
  // The provided callback function is called with the new and old virtual nodes as arguments.
  // This directive is only called once per virtual node update.
  "v-update": (callback, vnode, oldVnode) => {
    if (oldVnode) {
      const cleanup = callback(vnode, oldVnode);
      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },
  // The "v-cleanup" directive is called when the update is cleaned up.
  // The provided callback function is called with the old virtual node as an argument.
  // This directive is only called once per virtual node, when the update is cleaned up.
  "v-cleanup": (callback, vnode, oldVnode) => {
    onCleanup(() => callback(vnode, oldVnode));
  }
};
function directive(name, directive2) {
  const directiveName = `v-${name}`;
  directives[directiveName] = directive2;
  reservedProps[directiveName] = true;
}
function sharedSetAttribute(name, value, newVnode, oldVnode) {
  if (typeof value === "function") {
    if (name in eventListenerNames === false) {
      mainVnode.dom.addEventListener(name.slice(2), eventListener);
      eventListenerNames[name] = true;
    }
    newVnode.dom[`v-${name}`] = value;
    return;
  }
  if (newVnode.isSVG === false && name in newVnode.dom) {
    if (newVnode.dom[name] != value) {
      newVnode.dom[name] = value;
    }
    return;
  }
  if (!oldVnode || value !== oldVnode.props[name]) {
    if (value === false) {
      newVnode.dom.removeAttribute(name);
    } else {
      newVnode.dom.setAttribute(name, value);
    }
  }
}
function setAttribute(name, value, newVnode, oldVnode) {
  if (reservedProps[name]) {
    return;
  }
  newVnode.props[name] = value;
  sharedSetAttribute(name, value, newVnode, oldVnode);
}
function updateAttributes(newVnode, oldVnode) {
  if (oldVnode) {
    for (const name in oldVnode.props) {
      if (!newVnode.props[name] && !eventListenerNames[name] && !reservedProps[name]) {
        if (newVnode.isSVG === false && name in newVnode.dom) {
          newVnode.dom[name] = null;
        } else {
          newVnode.dom.removeAttribute(name);
        }
      }
    }
  }
  for (const name in newVnode.props) {
    if (reservedProps[name]) {
      if (directives[name] && directives[name](newVnode.props[name], newVnode, oldVnode) === false) {
        break;
      }
      continue;
    }
    sharedSetAttribute(name, newVnode.props[name], newVnode, oldVnode);
  }
}
function patch(newVnode, oldVnode) {
  if (newVnode.children.length === 0) {
    newVnode.dom.textContent = "";
    return;
  }
  const newTree = newVnode.children;
  const oldTree = oldVnode?.children || [];
  const oldTreeLength = oldTree.length;
  let newTreeLength = newTree.length;
  current.vnode = newVnode;
  current.oldVnode = oldVnode;
  let i = 0;
  while (i < newTreeLength) {
    const newChild = newTree[i];
    if (newChild instanceof Vnode) {
      if (typeof newChild.tag !== "string") {
        current.component = newChild.tag;
        newTree.splice(
          i,
          1,
          ("view" in newChild.tag ? newChild.tag.view.bind(newChild.tag) : newChild.tag.bind(newChild.tag))(
            newChild.props,
            ...newChild.children
          )
        );
        newTreeLength = newTree.length;
        continue;
      } else {
        i++;
      }
    } else if (Array.isArray(newChild)) {
      newTree.splice(i, 1, ...newChild);
      newTreeLength = newTree.length;
    } else if (newChild == null) {
      newTree.splice(i, 1);
      newTreeLength = newTree.length;
    } else {
      newTree[i] = new Vnode(textTag, {}, [newChild]);
      i++;
    }
  }
  if (newTreeLength === 0) {
    newVnode.dom.textContent = "";
    return;
  }
  if (oldTreeLength > 0 && newTree[0] instanceof Vnode && oldTree[0] instanceof Vnode && "key" in newTree[0].props && "key" in oldTree[0].props) {
    const oldKeyedList = {};
    const newKeyedList = {};
    const childNodes = newVnode.dom.childNodes;
    for (let i2 = 0; i2 < oldTreeLength; i2++) {
      oldKeyedList[oldTree[i2].props.key] = i2;
      if (i2 < newTreeLength) {
        newKeyedList[newTree[i2].props.key] = i2;
      }
    }
    for (let i2 = 0; i2 < newTreeLength; i2++) {
      const newChild = newTree[i2];
      const oldChildIndex = oldKeyedList[newChild.props.key];
      const oldChild = oldTree[oldChildIndex];
      let shouldPatch = true;
      if (oldChild) {
        newChild.dom = oldChild.dom;
        if ("v-keep" in newChild.props && newChild.props["v-keep"] === oldChild.props["v-keep"]) {
          newChild.children = oldChild.children;
          shouldPatch = false;
        } else {
          updateAttributes(newChild, oldChild);
        }
      } else {
        newChild.dom = createDomElement(newChild.tag, newChild.isSVG);
        updateAttributes(newChild);
      }
      const currentNode = childNodes[i2];
      if (!currentNode) {
        newVnode.dom.appendChild(newChild.dom);
      } else if (currentNode !== newChild.dom) {
        newVnode.dom.replaceChild(newChild.dom, currentNode);
      }
      shouldPatch && patch(newChild, oldChild);
    }
    for (let i2 = newTreeLength; i2 < oldTreeLength; i2++) {
      if (!newKeyedList[oldTree[i2].props.key]) {
        const domToRemove = oldTree[i2].dom;
        domToRemove.parentNode && domToRemove.parentNode.removeChild(domToRemove);
      }
    }
    return;
  }
  for (let i2 = 0; i2 < newTreeLength; i2++) {
    const newChild = newTree[i2];
    const oldChild = oldTree[i2];
    const isGreaterThanOldTreeLength = i2 >= oldTreeLength;
    if (newChild.tag === textTag) {
      if (isGreaterThanOldTreeLength || oldChild.tag !== textTag) {
        newChild.dom = document.createTextNode(newChild.children[0]);
        if (isGreaterThanOldTreeLength) {
          newVnode.dom.appendChild(newChild.dom);
        } else {
          newVnode.dom.replaceChild(newChild.dom, oldChild.dom);
        }
      } else {
        newChild.dom = oldChild.dom;
        if (newChild.children[0] !== oldChild.dom.textContent) {
          oldChild.dom.textContent = newChild.children[0];
        }
      }
      continue;
    }
    newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";
    if (isGreaterThanOldTreeLength || newChild.tag !== oldChild.tag) {
      newChild.dom = createDomElement(newChild.tag, newChild.isSVG);
      updateAttributes(newChild);
      if (isGreaterThanOldTreeLength) {
        newVnode.dom.appendChild(newChild.dom);
      } else {
        newVnode.dom.replaceChild(newChild.dom, oldChild.dom);
      }
      patch(newChild);
      continue;
    }
    newChild.dom = oldChild.dom;
    if ("v-keep" in newChild.props && newChild.props["v-keep"] === oldChild.props["v-keep"]) {
      newChild.children = oldChild.children;
      continue;
    }
    updateAttributes(newChild, oldChild);
    patch(newChild, oldChild);
  }
  for (; newTreeLength < oldTreeLength; newTreeLength++) {
    newVnode.dom.removeChild(oldTree[newTreeLength].dom);
  }
}
function update() {
  if (mainVnode) {
    callSet(onCleanupSet);
    const oldMainVnode = mainVnode;
    mainVnode = new Vnode(oldMainVnode.tag, oldMainVnode.props, [mainComponent]);
    mainVnode.dom = oldMainVnode.dom;
    mainVnode.isSVG = oldMainVnode.isSVG;
    patch(mainVnode, oldMainVnode);
    callSet(isMounted ? onUpdateSet : onMountSet);
    isMounted = true;
    current.vnode = null;
    current.oldVnode = null;
    current.component = null;
    if (isNodeJs) {
      return mainVnode.dom.innerHTML;
    }
  }
}
function updateVnode(vnode, oldVnode) {
  callSet(onCleanupSet);
  patch(vnode, oldVnode);
  oldVnode.tag = vnode.tag;
  oldVnode.props = { ...vnode.props };
  oldVnode.children = [...vnode.children];
  oldVnode.dom = vnode.dom;
  oldVnode.isSVG = vnode.isSVG;
  callSet(isMounted ? onUpdateSet : onMountSet);
  isMounted = true;
  current.vnode = null;
  current.oldVnode = null;
  current.component = null;
  if (isNodeJs) {
    return vnode.dom.innerHTML;
  }
}
function unmount() {
  if (mainVnode) {
    mainComponent = new Vnode(() => null, {}, []);
    const result = update();
    callSet(onUnmountSet);
    for (const name in eventListenerNames) {
      mainVnode.dom.removeEventListener(name.slice(2).toLowerCase(), eventListener);
      Reflect.deleteProperty(eventListenerNames, name);
    }
    mainComponent = null;
    mainVnode = null;
    isMounted = false;
    current.vnode = null;
    current.oldVnode = null;
    current.component = null;
    return result;
  }
}
function mount(dom, component) {
  const container = typeof dom === "string" ? isNodeJs ? createDomElement(dom, dom === "svg") : document.querySelectorAll(dom)[0] : dom;
  const vnodeComponent = isVnodeComponent(component) ? component : isComponent(component) ? new Vnode(component, {}, []) : new Vnode(() => component, {}, []);
  if (mainComponent && mainComponent.tag !== vnodeComponent.tag) {
    unmount();
  }
  mainComponent = vnodeComponent;
  mainVnode = domToVnode(container);
  return update();
}
var v = (tagOrComponent, props, ...children) => {
  return new Vnode(tagOrComponent, props || {}, children);
};
v.fragment = (_, ...children) => children;
export {
  Vnode,
  createDomElement,
  current,
  directive,
  directives,
  domToVnode,
  isComponent,
  isNodeJs,
  isVnode,
  isVnodeComponent,
  mount,
  onCleanup,
  onMount,
  onUnmount,
  onUpdate,
  patch,
  reservedProps,
  setAttribute,
  trust,
  unmount,
  update,
  updateAttributes,
  updateVnode,
  v
};
