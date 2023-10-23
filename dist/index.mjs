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
var isComponent = (component) => typeof component === "function";
var isVnode = (object) => object instanceof Vnode;
var isVnodeComponent = (object) => {
  return isVnode(object) && isComponent(object.tag);
};
function domToVnode(dom) {
  if (dom.nodeType === 3) {
    return dom.nodeValue;
  }
  const vnode = new Vnode(dom.nodeName.toLowerCase(), {}, []);
  vnode.dom = dom;
  dom.props = vnode.props;
  for (let i = 0, l = dom.childNodes.length; i < l; i++) {
    const childDom = dom.childNodes[i];
    if (childDom.nodeType === 3) {
      vnode.children.push(childDom.nodeValue);
    } else if (childDom.nodeType === 1) {
      const childVnode = domToVnode(childDom);
      vnode.children.push(childVnode);
    }
  }
  const props = vnode.props;
  for (let i = 0, l = dom.attributes.length; i < l; i++) {
    const attr = dom.attributes[i];
    props[attr.nodeName] = attr.nodeValue;
  }
  return vnode;
}
function trust(htmlString) {
  const div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  return Array.from(div.childNodes).map(domToVnode);
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
  "v-for"(vnode) {
    const set = vnode.props["v-for"];
    const children = vnode.children;
    const callback = children[0];
    children.length = set.length;
    for (let i = 0, l = set.length; i < l; i++) {
      children[i] = callback(set[i], i);
    }
  },
  "v-if": (vnode) => {
    const bool = Boolean(vnode.props["v-if"]);
    if (bool) {
      const parentNode = vnode.dom?.parentNode;
      if (parentNode) {
        const newdom = document.createTextNode("");
        parentNode.replaceChild(newdom, vnode.dom);
      }
      return false;
    }
  },
  "v-show": (vnode) => {
    const bool = Boolean(vnode.props["v-show"]);
    vnode.dom.style.display = bool ? "" : "none";
  },
  "v-html": (vnode) => {
    vnode.children = [trust(vnode.props["v-html"])];
  },
  // The "v-model" directive binds the value of an input element to a model property
  "v-model": (vnode) => {
    let [model, property, event] = vnode.props["v-model"];
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
      vnode
    );
  },
  "v-create": (vnode, oldProps) => {
    if (!oldProps) {
      const callback = vnode.props["v-create"];
      const cleanup = callback(vnode);
      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },
  "v-update": (vnode, oldProps) => {
    if (oldProps) {
      const callback = vnode.props["v-update"];
      const cleanup = callback(vnode, oldProps);
      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },
  "v-cleanup": (vnode) => {
    const callback = vnode.props["v-cleanup"];
    onCleanup(() => callback(vnode));
  },
  // Frequent used properties
  class: (vnode) => {
    const value = vnode.props.class;
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
  id: (vnode) => {
    vnode.dom.id = vnode.props.id;
  },
  style: (vnode) => {
    const value = vnode.props.style;
    if (typeof value === "string") {
      vnode.dom.style.cssText = value;
    } else if (typeof value === "object") {
      const domStyle = vnode.dom.style;
      domStyle.cssText = "";
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
function removeAttributes(vnode, oldProps) {
  if (!oldProps) {
    return;
  }
  const vnodeDom = vnode.dom;
  const vnodeProps = vnode.props;
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
function addProperties(vnode, oldProps) {
  const vnodeProps = vnode.props;
  for (const name in vnodeProps) {
    if (directives[name]) {
      if (directives[name](vnode, oldProps) === false) {
        break;
      }
      continue;
    }
    if (reservedProps.has(name)) {
      continue;
    }
    sharedSetAttribute(name, vnodeProps[name], vnode);
  }
}
function updateAttributes(newVnode, oldProps) {
  removeAttributes(newVnode, oldProps);
  addProperties(newVnode, oldProps);
}
function createElement(tag, isSVG) {
  return isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
}
function flatTree(newVnode) {
  current.vnode = newVnode;
  const { children } = newVnode;
  let i = 0;
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
      if (newChild.props === null) {
        newChild.props = {};
      }
      if (typeof newChild.tag !== "string") {
        const component = ("view" in newChild.tag ? newChild.tag.view : newChild.tag).bind(newChild.tag);
        current.component = component;
        children[i] = component(newChild.props, newChild.children);
        continue;
      } else {
        newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";
      }
    }
    i++;
  }
}
function createNewElement(newChild, newVnode, oldChild) {
  if (newChild instanceof Vnode === false) {
    const dom2 = document.createTextNode(newChild);
    if (oldChild) {
      newVnode.dom.replaceChild(dom2, oldChild);
    } else {
      newVnode.dom.appendChild(dom2);
    }
    return;
  }
  const dom = createElement(newChild.tag, newChild.isSVG);
  if (oldChild) {
    newVnode.dom.replaceChild(dom, oldChild);
  } else {
    newVnode.dom.appendChild(dom);
  }
  newChild.dom = dom;
  addProperties(newChild, null);
  newChild.dom.props = newChild.props;
  flatTree(newChild);
  const children = newChild.children;
  if (children.length === 0) {
    newChild.dom.textContent = "";
    return;
  }
  for (let i = 0, l = children.length; i < l; i++) {
    createNewElement(children[i], newChild, null);
  }
  children.length = 0;
}
function patchKeyed(newVnode) {
  const oldTree = newVnode.dom.childNodes;
  const oldKeyedList = {};
  const newKeyedList = {};
  const children = newVnode.children;
  for (let i = 0, l = oldTree.length; i < l; i++) {
    const oldChild = oldTree[i];
    const oldProps = oldChild.props;
    if (oldProps) {
      oldKeyedList[oldProps.key] = i;
    }
    if (i < children.length && children[i] instanceof Vnode) {
      newKeyedList[children[i].props.key] = i;
    }
  }
  for (let i = 0, l = children.length; i < l; i++) {
    const newChild = children[i];
    const oldIndex = oldKeyedList[newChild.props.key];
    const oldChild = oldTree[oldIndex];
    if (!oldChild) {
      createNewElement(newChild, newVnode, null);
      continue;
    }
    newChild.dom = oldChild;
    if (newVnode.dom.childNodes[i] !== newChild.dom) {
      newVnode.dom.insertBefore(newChild.dom, newVnode.dom.childNodes[i]);
    }
    const oldProps = oldChild.props;
    newChild.dom = oldChild;
    oldChild.props = newChild.props;
    if (oldProps && "v-keep" in newChild.props && newChild.props["v-keep"] === oldProps["v-keep"]) {
      continue;
    }
    updateAttributes(newChild, oldProps || null);
    patch(newChild);
  }
  for (let i = 0, l = oldTree.length; i < l; i++) {
    const oldChild = oldTree[i];
    const oldProps = oldChild.props;
    if (oldProps && !newKeyedList[oldProps.key]) {
      oldChild.remove();
    }
  }
}
function patch(newVnode) {
  flatTree(newVnode);
  const children = newVnode.children;
  if (children.length === 0) {
    newVnode.dom.textContent = "";
    return;
  }
  const oldDomChildren = newVnode.dom.childNodes;
  const oldChildrenLength = oldDomChildren.length;
  if (oldChildrenLength > 0) {
    const firstOldProps = oldDomChildren[0].props;
    const firstVnode = children[0];
    if (firstOldProps && firstVnode instanceof Vnode && "key" in firstVnode.props && "key" in firstOldProps) {
      patchKeyed(newVnode);
      children.length = 0;
      return;
    }
  }
  const childrenLength = children.length;
  if (oldChildrenLength === 0) {
    for (let i = 0; i < childrenLength; i++) {
      createNewElement(children[i], newVnode, null);
    }
    children.length = 0;
    return;
  }
  for (let i = 0; i < childrenLength; i++) {
    const oldChild = oldDomChildren[i];
    const newChild = children[i];
    if (!oldChild) {
      createNewElement(newChild, newVnode, null);
      continue;
    }
    if (newChild instanceof Vnode === false) {
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
    patch(newChild);
  }
  for (let i = childrenLength, l = oldDomChildren.length; i < l; i++) {
    oldDomChildren[i]?.remove();
  }
  children.length = 0;
}
function update() {
  if (mainVnode) {
    mainVnode.children = [mainComponent];
    return updateVnode(mainVnode);
  }
}
function updateVnode(vnode) {
  callSet(onCleanupSet);
  patch(vnode);
  callSet(isMounted ? onUpdateSet : onMountSet);
  isMounted = true;
  current.vnode = null;
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
    current.component = null;
    return result;
  }
}
function mount(dom, component) {
  const container = typeof dom === "string" ? isNodeJs ? createElement(dom, dom === "svg") : document.querySelector(dom) : dom;
  const vnodeComponent = isVnodeComponent(component) ? component : isComponent(component) ? new Vnode(component, {}, []) : new Vnode(() => component, {}, []);
  if (mainComponent && mainComponent.tag !== vnodeComponent.tag) {
    unmount();
  }
  mainComponent = vnodeComponent;
  mainVnode = domToVnode(container);
  return update();
}
function v(tagOrComponent, props, ...children) {
  return new Vnode(tagOrComponent, props, children);
}
v.fragment = (_, ...children) => children;
export {
  Vnode,
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
  updateVnode,
  v
};
