// lib/index.ts
var isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);
var Vnode = class {
  constructor(tag, props, children, dom, isSVG) {
    this.tag = tag;
    this.props = props;
    this.children = children;
    this.dom = dom;
    this.isSVG = isSVG;
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
    sharedSetAttribute(
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
      vnode.dom.className = value;
    }
  },
  className(value, vnode) {
    directives.class(value, vnode, null);
  },
  id: (value, vnode) => {
    vnode.dom.id = value;
  },
  style: (value, vnode) => {
    if (typeof value === "string") {
      vnode.dom.style = value;
    } else if (typeof value === "object") {
      vnode.dom.style = "";
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
    const oldProps = dom.props;
    if (oldProps && oldProps[name]) {
      oldProps[name](e, dom);
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
  if (name in newVnodeDom) {
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
function updateAttributes(newVnode, oldProps) {
  const vnodeDom = newVnode.dom;
  const vnodeProps = newVnode.props;
  if (oldProps) {
    for (const name in oldProps) {
      if (name in vnodeProps === false && !eventListenerNames.has(name) && !reservedProps.has(name)) {
        if (name in vnodeDom) {
          vnodeDom[name] = null;
        } else {
          vnodeDom.removeAttribute(name);
        }
      }
    }
  }
  for (const name in vnodeProps) {
    if (directives[name]) {
      if (directives[name](vnodeProps[name], newVnode, oldProps) === false) {
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
  if ("v-for" in newVnode.props) {
    const children2 = [];
    const set = newVnode.props["v-for"];
    const l = set.length;
    const callback = newVnode.children[0];
    for (let i2 = 0; i2 < l; i2++) {
      const newChild = callback(set[i2], i2);
      if (newChild instanceof Vnode) {
        newChild.props = newChild.props || {};
        newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";
      }
      children2[i2] = newChild;
    }
    return children2;
  }
  let i = 0;
  const originalChildren = newVnode.children;
  let children = originalChildren;
  while (i < children.length) {
    const newChild = children[i];
    if (newChild == null) {
      if (children === originalChildren) {
        children = [...originalChildren];
      }
      children.splice(i, 1);
      continue;
    }
    if (Array.isArray(newChild)) {
      if (children === originalChildren) {
        children = [...originalChildren];
      }
      children.splice(i, 1, ...newChild);
      continue;
    }
    if (newChild instanceof Vnode) {
      newChild.props = newChild.props || {};
      newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";
      if (typeof newChild.tag !== "string") {
        if (children === originalChildren) {
          children = [...originalChildren];
        }
        const component = current.component = newChild.tag;
        children[i] = (isPOJOComponent(component) ? component.view : component).bind(component)(
          newChild.props,
          newChild.children
        );
        continue;
      }
    }
    i++;
  }
  return children;
}
function createNewElement(newChild, newVnode, oldChild) {
  const dom = createElement(newChild.tag, newChild.isSVG);
  if (oldChild) {
    newVnode.dom.replaceChild(dom, oldChild);
  } else {
    newVnode.dom.appendChild(dom);
  }
  newChild.dom = dom;
  updateAttributes(newChild, null);
  newChild.dom.props = newChild.props;
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
    createNewElement(children[i], newChild, null);
  }
}
function patchKeyed(newVnode, children) {
  const oldTree = [...Array.from(newVnode.dom.childNodes)];
  const childNodes = newVnode.dom.childNodes;
  const oldKeyedList = {};
  const newKeyedList = {};
  for (let i = 0, l = oldTree.length; i < l; i++) {
    const oldProps = oldTree[i].props;
    if (oldProps) {
      oldKeyedList[oldProps.key] = i;
    }
    if (i < children.length && children[i] instanceof Vnode) {
      newKeyedList[children[i].props.key] = i;
    }
  }
  for (let i = 0, l = children.length; i < l; i++) {
    const newChild = children[i];
    const oldChild = oldTree[oldKeyedList[newChild.props.key]];
    if (!oldChild) {
      createNewElement(newChild, newVnode, childNodes[i]);
      continue;
    }
    newChild.dom = oldChild;
    const currentChild = childNodes[i];
    if (!currentChild) {
      newVnode.dom.appendChild(oldChild);
    } else if (currentChild !== oldChild) {
      newVnode.dom.replaceChild(oldChild, currentChild);
    }
    if ("v-keep" in newChild.props === false || oldChild.props["v-keep"] !== newChild.props["v-keep"]) {
      updateAttributes(newChild, oldChild.props);
      oldChild.props = newChild.props;
      if ("v-text" in newChild.props) {
        if (oldChild.textContent != newChild.props["v-text"]) {
          oldChild.textContent = newChild.props["v-text"];
        }
        continue;
      }
      patch(newChild);
    }
  }
  for (let i = children.length, l = childNodes.length; i < l; i++) {
    childNodes[i]?.remove();
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
  const oldDomChildren = dom.childNodes;
  const oldChildrenLength = oldDomChildren.length;
  if (oldChildrenLength > 0) {
    const firstOldProps = oldDomChildren[0].props;
    const firstVnode = children[0];
    if (firstOldProps && firstVnode instanceof Vnode && "key" in firstVnode.props && "key" in firstOldProps) {
      patchKeyed(newVnode, children);
      return;
    }
  }
  const childrenLength = children.length;
  if (oldChildrenLength === 0) {
    for (let i = 0; i < childrenLength; i++) {
      if (children[i] instanceof Vnode === false) {
        dom.appendChild(document.createTextNode(children[i]));
        continue;
      }
      createNewElement(children[i], newVnode, null);
    }
    return;
  }
  for (let i = 0; i < childrenLength; i++) {
    const newChild = children[i];
    const isText = newChild instanceof Vnode === false;
    const oldChild = oldDomChildren[i];
    if (!oldChild) {
      if (isText) {
        newVnode.dom.appendChild(document.createTextNode(newChild));
        continue;
      }
      createNewElement(newChild, newVnode, null);
      continue;
    }
    if (isText) {
      if (oldChild.nodeType !== 3) {
        newVnode.dom.replaceChild(document.createTextNode(newChild), oldChild);
        continue;
      }
      if (oldChild.nodeValue != newChild) {
        oldChild.nodeValue = newChild;
      }
      continue;
    }
    if ("v-keep" in newChild.props) {
      if (oldChild.props && oldChild.props["v-keep"] === newChild.props["v-keep"]) {
        continue;
      }
      const nextOldChild = oldDomChildren[i + 1];
      if (nextOldChild && nextOldChild.props && nextOldChild.props["v-keep"] === newChild.props["v-keep"]) {
        oldChild.remove();
        continue;
      }
    }
    if (newChild.tag !== oldChild.nodeName.toLowerCase()) {
      createNewElement(newChild, newVnode, oldChild);
      continue;
    }
    newChild.dom = oldChild;
    updateAttributes(newChild, oldChild.props || null);
    oldChild.props = newChild.props;
    if ("v-text" in newChild.props) {
      if (newChild.dom.textContent != newChild.props["v-text"]) {
        newChild.dom.textContent = newChild.props["v-text"];
      }
      continue;
    }
    patch(newChild);
  }
  for (let i = childrenLength, l = oldDomChildren.length; i < l; i++) {
    oldDomChildren[i]?.remove();
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
}
var debouncedUpdateTimeout;
var clearDebouncedUpdateMethod = isNodeJs ? clearTimeout : cancelAnimationFrame;
var setDebouncedUpdateMethod = isNodeJs ? () => setTimeout(update, 5) : () => requestAnimationFrame(update);
function debouncedUpdate() {
  clearDebouncedUpdateMethod(debouncedUpdateTimeout);
  debouncedUpdateTimeout = setDebouncedUpdateMethod();
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
