// lib/index.ts
var isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);
var Vnode = class {
  constructor(tag, props, children, dom, isSVG, hasKeys) {
    this.tag = tag;
    this.props = props;
    this.children = children;
    this.dom = dom;
    this.isSVG = isSVG;
    this.hasKeys = hasKeys;
  }
};
var isPOJOComponent = (component) => Boolean(component && typeof component === "object" && "view" in component);
var isComponent = (component) => Boolean(typeof component === "function" || isPOJOComponent(component));
var isVnode = (object) => object instanceof Vnode;
var isVnodeComponent = (object) => {
  return isVnode(object) && isComponent(object.tag);
};
function v(tagOrComponent, props, ...children) {
  return new Vnode(tagOrComponent, props, children);
}
v.fragment = (_, ...children) => children;
function hidrateDomToVnode(dom) {
  if (dom.nodeType === 3) {
    return dom.nodeValue;
  }
  if (dom.nodeType === 1) {
    const tag = dom.nodeName.toLowerCase();
    const props = {};
    const children = [];
    for (let i = 0, l = dom.childNodes.length; i < l; i++) {
      const childDom = dom.childNodes[i];
      if (childDom.nodeType === 3) {
        children.push(childDom.nodeValue);
      } else if (childDom.nodeType === 1) {
        const childVnode = hidrateDomToVnode(childDom);
        children.push(childVnode);
      }
    }
    const attributes = dom.attributes;
    for (let i = 0, l = attributes.length; i < l; i++) {
      const attr = attributes[i];
      props[attr.nodeName] = attr.nodeValue;
    }
    const vnode = new Vnode(tag, props, children);
    vnode.dom = dom;
    dom.vnode = vnode;
    vnode.isSVG = tag === "svg";
    return vnode;
  }
}
function trust(htmlString) {
  const div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  return Array.from(div.childNodes).map(hidrateDomToVnode);
}
var mainComponent = null;
var mainVnode = null;
var isMounted = false;
var current = {
  vnode: null,
  component: null,
  event: null
};
var reservedProps = /* @__PURE__ */ new Set([
  "key",
  "state",
  "v-keep",
  "v-text",
  "v-if",
  "v-for",
  "v-show",
  "v-class",
  "v-html",
  "v-model",
  "v-create",
  "v-update",
  "v-cleanup"
]);
var onCleanupSet = /* @__PURE__ */ new Set();
var onMountSet = /* @__PURE__ */ new Set();
var onUpdateSet = /* @__PURE__ */ new Set();
var onUnmountSet = /* @__PURE__ */ new Set();
var onMount = (callback) => !isMounted && onMountSet.add(callback);
var onUpdate = (callback) => onUpdateSet.add(callback);
var onCleanup = (callback) => onCleanupSet.add(callback);
var onUnmount = (callback) => !isMounted && onUnmountSet.add(callback);
var callSet = (set) => {
  for (const callback of set) {
    callback();
  }
  set.clear();
};
var directives = {
  "v-if": (value, vnode) => {
    if (!Boolean(value)) {
      const parentNode = vnode.dom?.parentNode;
      if (parentNode) {
        parentNode.replaceChild(document.createTextNode(""), vnode.dom);
      }
      return false;
    }
  },
  "v-show": (value, vnode) => {
    const bool = Boolean(value);
    vnode.dom.style.display = bool ? "" : "none";
  },
  "v-html": (value, vnode) => {
    vnode.children = trust(value);
  },
  // The "v-model" directive binds the value of an input element to a model property
  "v-model": (model, vnode) => {
    if ("name" in vnode.props === false) {
      return;
    }
    let value;
    const property = vnode.props.name;
    let event = "oninput";
    let handler = (e) => model[property] = e.target.value;
    if (vnode.tag === "input") {
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
          setAttribute("checked", value, vnode);
          break;
        }
        case "radio": {
          setAttribute("checked", model[property] === vnode.dom.value, vnode);
          break;
        }
        default: {
          setAttribute("value", model[property], vnode);
        }
      }
    } else if (vnode.tag === "select") {
      event = "onclick";
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
      vnode.children = [model[property]];
    }
    const prevHandler = vnode.props[event];
    setAttribute(
      event,
      (e) => {
        handler(e);
        if (prevHandler) {
          prevHandler(e);
        }
      },
      vnode
    );
  },
  "v-create": (callback, vnode, oldProps) => {
    if (!oldProps) {
      const cleanup = callback(vnode);
      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },
  "v-update": (callback, vnode, oldProps) => {
    if (oldProps) {
      const cleanup = callback(vnode, oldProps);
      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },
  "v-cleanup": (callback, vnode) => {
    onCleanup(() => callback(vnode));
  },
  "v-class": (value, vnode) => {
    if (typeof value === "string") {
      vnode.dom.className = value;
    } else if (Array.isArray(value)) {
      vnode.dom.className = value.join(" ");
    } else if (typeof value === "object") {
      const classList = vnode.dom.classList;
      for (const name in value) {
        const val = typeof value[name] === "function" ? value[name]() : value[name];
        classList.toggle(name, val);
      }
    }
  },
  // Frequent used properties
  class(value, vnode) {
    if (vnode.dom.className !== value) {
      if (vnode.isSVG) {
        vnode.dom.setAttribute("class", value);
        return;
      }
      vnode.dom.className = value;
    }
  },
  className(value, vnode) {
    directives.class(value, vnode);
  },
  id: (value, vnode) => {
    if (vnode.dom.id !== value) {
      if (vnode.isSVG) {
        vnode.dom.setAttribute("id", value);
        return;
      }
      vnode.dom.id = value;
    }
  },
  style: (value, vnode) => {
    if (typeof value === "string") {
      if (vnode.isSVG) {
        vnode.dom.setAttribute("style", value);
        return;
      }
      vnode.dom.style = value;
    } else if (typeof value === "object") {
      if (vnode.isSVG) {
        vnode.dom.setAttribute("style", "");
      } else {
        vnode.dom.style = "";
      }
      const domStyle = vnode.dom.style;
      for (const name in value) {
        domStyle[name] = value[name];
      }
    }
  }
};
function directive(name, directive2) {
  const directiveName = `v-${name}`;
  directives[directiveName] = directive2;
  reservedProps.add(directiveName);
}
function setPropNameReserved(name) {
  reservedProps.add(name);
}
var eventListenerNames = /* @__PURE__ */ new Set();
function eventListener(e) {
  current.event = e;
  let dom = e.target;
  const name = `on${e.type}`;
  while (dom) {
    const oldVnode = dom.vnode;
    if (oldVnode && oldVnode.props[name]) {
      oldVnode.props[name](e, oldVnode);
      if (!e.defaultPrevented) {
        update();
      }
      return;
    }
    dom = dom.parentNode;
  }
  current.event = null;
}
function sharedSetAttribute(name, value, newVnode) {
  const newVnodeDom = newVnode.dom;
  if (typeof value === "function") {
    if (!eventListenerNames.has(name)) {
      mainVnode.dom.addEventListener(name.slice(2), eventListener);
      eventListenerNames.add(name);
    }
    return;
  }
  if (!newVnode.isSVG && name in newVnodeDom) {
    newVnodeDom[name] = value;
    return;
  }
  if (value === false) {
    newVnodeDom.removeAttribute(name);
  } else {
    newVnodeDom.setAttribute(name, value);
  }
}
function setAttribute(name, value, newVnode) {
  if (!reservedProps.has(name)) {
    newVnode.props[name] = value;
    sharedSetAttribute(name, value, newVnode);
  }
}
function updateAttributes(newVnode, oldVnode) {
  const vnodeDom = newVnode.dom;
  const vnodeProps = newVnode.props;
  vnodeDom.vnode = newVnode;
  if (oldVnode) {
    for (const name in oldVnode.props) {
      if (name in vnodeProps === false && !eventListenerNames.has(name) && !reservedProps.has(name)) {
        if (!newVnode.isSVG && name in vnodeDom) {
          vnodeDom[name] = null;
        } else {
          vnodeDom.removeAttribute(name);
        }
      }
    }
  }
  for (const name in vnodeProps) {
    if (directives[name]) {
      if (directives[name](vnodeProps[name], newVnode, oldVnode?.props) === false) {
        break;
      }
      continue;
    }
    if (!reservedProps.has(name)) {
      sharedSetAttribute(name, vnodeProps[name], newVnode);
    }
  }
}
function createElement(tag, isSVG) {
  return isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
}
function flatTree(newVnode) {
  current.vnode = newVnode;
  let i = 0;
  let children;
  if ("v-for" in newVnode.props === false) {
    children = [...newVnode.children];
  } else {
    children = [];
    const set = newVnode.props["v-for"];
    const l = set.length;
    const callback = newVnode.children[0];
    if (typeof callback !== "function") {
      console.warn("v-for directive must have a callback function as children");
      return children;
    }
    for (let i2 = 0; i2 < l; i2++) {
      children[i2] = callback(set[i2], i2);
    }
  }
  while (i < children.length) {
    const newChild = children[i];
    if (newChild == null) {
      children.splice(i, 1);
      continue;
    }
    if (Array.isArray(newChild)) {
      children.splice(i, 1, ...newChild);
      continue;
    }
    if (newChild instanceof Vnode) {
      newChild.props = newChild.props || {};
      newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";
      if (typeof newChild.tag !== "string") {
        const component = current.component = newChild.tag;
        children[i] = (isPOJOComponent(component) ? component.view : component).bind(component)(
          newChild.props,
          newChild.children
        );
        continue;
      }
      newVnode.hasKeys = newVnode.hasKeys || "key" in newChild.props;
    }
    i++;
  }
  return children;
}
function processNewChild(newChild, parentVnode, oldDom) {
  if (oldDom) {
    newChild.dom = createElement(newChild.tag, newChild.isSVG);
    parentVnode.dom.replaceChild(newChild.dom, oldDom);
  } else {
    newChild.dom = parentVnode.dom.appendChild(createElement(newChild.tag, newChild.isSVG));
  }
  updateAttributes(newChild);
  if ("v-text" in newChild.props) {
    newChild.dom.textContent = newChild.props["v-text"];
    return;
  }
  const children = flatTree(newChild);
  if (children.length === 0) {
    newChild.dom.textContent = "";
    return;
  }
  for (let i = 0, l = children.length; i < l; i++) {
    if (children[i] instanceof Vnode === false) {
      newChild.dom.appendChild(document.createTextNode(children[i]));
      continue;
    }
    processNewChild(children[i], newChild);
  }
}
function patch(newVnode) {
  const children = flatTree(newVnode);
  const dom = newVnode.dom;
  if (children.length === 0) {
    if (dom.childNodes.length) {
      dom.textContent = "";
    }
    return;
  }
  const childNodes = dom.childNodes;
  const oldChildrenLength = childNodes.length;
  const childrenLength = children.length;
  if (oldChildrenLength === 0) {
    for (let i = 0; i < childrenLength; i++) {
      const newChild = children[i];
      if (newChild instanceof Vnode === false) {
        dom.appendChild(document.createTextNode(newChild));
        continue;
      }
      processNewChild(newChild, newVnode);
    }
    return;
  }
  const oldTree = [...Array.from(childNodes)];
  const oldKeyedList = {};
  if (newVnode.hasKeys) {
    for (let i = 0, l = oldTree.length; i < l; i++) {
      const oldVnode = oldTree[i].vnode;
      oldKeyedList[!oldVnode || "key" in oldVnode.props === false ? i : oldVnode.props.key] = i;
    }
  }
  for (let i = 0, l = children.length; i < l; i++) {
    const newChild = children[i];
    if (newChild instanceof Vnode === false) {
      const oldChild2 = oldTree[i];
      if (!oldChild2) {
        dom.appendChild(document.createTextNode(newChild));
        continue;
      }
      if (oldChild2.nodeType !== 3) {
        dom.replaceChild(document.createTextNode(newChild), oldChild2);
        continue;
      }
      if (oldChild2.nodeValue != newChild) {
        oldChild2.nodeValue = newChild;
      }
      continue;
    }
    const oldChild = oldTree[newVnode.hasKeys ? oldKeyedList[newChild.props.key || i] : i];
    if (!oldChild || newChild.tag !== oldChild.nodeName.toLowerCase()) {
      processNewChild(newChild, newVnode, childNodes[i]);
      continue;
    }
    newChild.dom = oldChild;
    const currentChild = childNodes[i];
    if (!currentChild) {
      dom.appendChild(oldChild);
    } else if (currentChild !== oldChild) {
      dom.replaceChild(oldChild, currentChild);
    }
    if ("v-keep" in newChild.props && oldChild.vnode) {
      if (oldChild.vnode.props["v-keep"] === newChild.props["v-keep"]) {
        continue;
      }
      const oldProps = childNodes[i + 1]?.vnode?.props;
      if (oldProps && "key" in oldProps === false && oldProps["v-keep"] === newChild.props["v-keep"]) {
        oldChild.remove();
        oldTree.splice(i, 1);
        continue;
      }
    }
    updateAttributes(newChild, oldChild.vnode);
    if ("v-text" in newChild.props) {
      if (oldChild.textContent != newChild.props["v-text"]) {
        oldChild.textContent = newChild.props["v-text"];
      }
      continue;
    }
    patch(newChild);
  }
  for (let i = childNodes.length, l = children.length; i > l; i--) {
    childNodes[i - 1].remove();
  }
}
function updateVnode(vnode) {
  callSet(onCleanupSet);
  vnode.props = vnode.props || {};
  patch(vnode);
  callSet(isMounted ? onUpdateSet : onMountSet);
  isMounted = true;
  current.vnode = null;
  current.component = null;
}
function update() {
  if (mainVnode) {
    mainVnode.children = [mainComponent];
    updateVnode(mainVnode);
    if (isNodeJs) {
      return mainVnode.dom.innerHTML;
    }
  }
  return "";
}
var debouncedUpdateTimeout;
var debouncedUpdateMethod = isNodeJs ? update : () => requestAnimationFrame(update);
function debouncedUpdate(timeout = 42) {
  if (current.event) {
    current.event.preventDefault();
  }
  clearTimeout(debouncedUpdateTimeout);
  debouncedUpdateTimeout = setTimeout(debouncedUpdateMethod, timeout);
}
function unmount() {
  if (mainVnode) {
    mainComponent = v(() => null, {});
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
    current.component = null;
    current.event = null;
    return result;
  }
  return "";
}
function mount(dom, component) {
  const container = typeof dom === "string" ? isNodeJs ? createElement(dom, dom === "svg") : document.querySelector(dom) : dom;
  if (isComponent(component)) {
    mainComponent = v(component, {}, []);
  } else if (isVnodeComponent(component)) {
    mainComponent = component;
  } else {
    mainComponent = v(() => component, {}, []);
  }
  mainVnode = hidrateDomToVnode(container);
  return update();
}
export {
  Vnode,
  createElement,
  current,
  debouncedUpdate,
  directive,
  directives,
  hidrateDomToVnode,
  isComponent,
  isNodeJs,
  isPOJOComponent,
  isVnode,
  isVnodeComponent,
  mount,
  onCleanup,
  onMount,
  onUnmount,
  onUpdate,
  reservedProps,
  setAttribute,
  setPropNameReserved,
  trust,
  unmount,
  update,
  updateAttributes,
  updateVnode,
  v
};
