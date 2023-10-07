"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/index.ts
var lib_exports = {};
__export(lib_exports, {
  Vnode: () => Vnode,
  current: () => current,
  directive: () => directive,
  directives: () => directives,
  domToVnode: () => domToVnode,
  isComponent: () => isComponent,
  isNodeJs: () => isNodeJs,
  isVnode: () => isVnode,
  isVnodeComponent: () => isVnodeComponent,
  mount: () => mount,
  onCleanup: () => onCleanup,
  onMount: () => onMount,
  onUnmount: () => onUnmount,
  onUpdate: () => onUpdate,
  patch: () => patch,
  reservedProps: () => reservedProps,
  setAttribute: () => setAttribute,
  trust: () => trust,
  unmount: () => unmount,
  update: () => update,
  updateAttributes: () => updateAttributes,
  updateVnode: () => updateVnode,
  v: () => v
});
module.exports = __toCommonJS(lib_exports);
var isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);
var byStringMatcherCache = {};
var byStringMatcherRegex = /^([^.#]*)?#?([^.]*)?(.*)?$/;
function byStringMatcher(string) {
  if (!byStringMatcherCache[string]) {
    const match = byStringMatcherRegex.exec(string);
    const tag = match[1];
    const id = match[2];
    const classes = match[3] ? match[3].split(".").splice(1) : null;
    let matcher = (vnode) => vnode instanceof Vnode;
    if (tag) {
      const previousMatcher = matcher;
      matcher = (vnode) => previousMatcher(vnode) && vnode.tag === tag;
    }
    if (id) {
      const previousMatcher = matcher;
      matcher = (vnode) => previousMatcher(vnode) && vnode.dom.id === id;
    }
    if (classes) {
      const previousMatcher = matcher;
      matcher = (vnode) => {
        if (!previousMatcher(vnode)) {
          return false;
        }
        for (const className of classes) {
          if (!vnode.dom.classList.contains(className)) {
            return false;
          }
        }
        return true;
      };
    }
    byStringMatcherCache[string] = matcher;
  }
  return byStringMatcherCache[string];
}
var Vnode = class _Vnode {
  constructor(tag, props, children, dom, processed, isSVG, _parent) {
    this.tag = tag;
    this.props = props;
    this.children = children;
    this.dom = dom;
    this.processed = processed;
    this.isSVG = isSVG;
    this._parent = _parent;
  }
  parent(matcher) {
    if (!matcher) {
      return this._parent;
    }
    const finalMatcher = typeof matcher === "string" ? byStringMatcher(matcher) : matcher;
    let parent = this._parent;
    while (parent) {
      if (finalMatcher(parent)) {
        return parent;
      }
      parent = parent._parent;
    }
  }
  findChild(filter) {
    const finalFilter = typeof filter === "string" ? byStringMatcher(filter) : (vnode) => vnode instanceof _Vnode && filter(vnode);
    for (let i = 0, l = this.children.length; i < l; i++) {
      const child = this.children[i];
      if (finalFilter(child)) {
        return child;
      }
    }
    for (let i = 0, l = this.children.length; i < l; i++) {
      const child = this.children[i];
      if (child instanceof _Vnode) {
        const result = child.findChild(finalFilter);
        if (result) {
          return result;
        }
      }
    }
  }
  filterChildren(filter) {
    const finalFilter = typeof filter === "string" ? byStringMatcher(filter) : (vnode, i) => vnode instanceof _Vnode && filter(vnode, i);
    const result = [];
    for (let i = 0, l = this.children.length; i < l; i++) {
      const child = this.children[i];
      if (finalFilter(child, i)) {
        result.push(child);
      }
    }
    return result;
  }
  get(index) {
    return this.children[index];
  }
  remove() {
    this.dom.remove();
    cleanupVnodeChildren(this);
    domToVnodeWeakMap.delete(this.dom);
    this._parent.children.splice(this._parent.children.indexOf(this), 1);
  }
  replace(newChild) {
    this._parent.children.splice(this._parent.children.indexOf(this), 1, newChild);
    processVnode(this._parent, newChild, this.dom);
    cleanupVnodeChildren(this);
    domToVnodeWeakMap.delete(this.dom);
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
  domToVnodeWeakMap.set(dom, vnode);
  for (let i = 0, l = dom.childNodes.length; i < l; i++) {
    const childDom = dom.childNodes[i];
    if (childDom.nodeType === 3) {
      vnode.children.push(childDom.nodeValue);
    } else if (childDom.nodeType === 1) {
      const childVnode = domToVnode(childDom);
      childVnode._parent = vnode;
      vnode.children.push();
    }
  }
  for (let i = 0, l = dom.attributes.length; i < l; i++) {
    const attr = dom.attributes[i];
    vnode.props[attr.nodeName] = attr.nodeValue;
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
var reservedProps = {
  key: true,
  state: true,
  "v-keep": true,
  // Used to keep the element when the parent is updated
  "v-text": true,
  // Used to set the text content of an element
  // Built in directives
  "v-if": true,
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
  "v-for": (vnode) => {
    const [set, callback] = vnode.props["v-for"];
    for (let i = 0, l = set.length; i < l; i++) {
      vnode.children.push(callback(set[i], i));
    }
  },
  "v-show": (vnode) => {
    const bool = Boolean(vnode.props["v-show"]);
    vnode.dom.style.display = bool ? "" : "none";
  },
  "v-class": (vnode) => {
    const classes = vnode.props["v-class"];
    const classList = vnode.dom.classList;
    for (const name in classes) {
      const value = typeof classes[name] === "function" ? classes[name]() : classes[name];
      classList.toggle(name, value);
    }
  },
  "v-html": (vnode) => {
    vnode.children = [trust(vnode.props["v-html"])];
  },
  "v-create": (vnode, oldVnode) => {
    if (!oldVnode) {
      const callback = vnode.props["v-create"];
      const cleanup = callback(vnode);
      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },
  "v-update": (vnode, oldVnode) => {
    if (oldVnode) {
      const callback = vnode.props["v-update"];
      const cleanup = callback(vnode, oldVnode);
      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },
  "v-cleanup": (vnode) => {
    const callback = vnode.props["v-cleanup"];
    onCleanup(() => callback(vnode));
  }
};
function directive(name, directive2) {
  const directiveName = `v-${name}`;
  directives[directiveName] = directive2;
  reservedProps[directiveName] = true;
}
var eventListenerNames = {};
function eventListener(e) {
  current.event = e;
  let dom = e.target;
  const name = `on${e.type}`;
  while (dom) {
    const oldVnode = domToVnodeWeakMap.get(dom);
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
function sharedSetAttribute(name, value, newVnode, oldVnode) {
  if (typeof value === "function") {
    if (name in eventListenerNames === false) {
      mainVnode.dom.addEventListener(name.slice(2), eventListener);
      eventListenerNames[name] = true;
    }
    return;
  }
  if (name === "style" && typeof value === "object") {
    for (const styleKey in value) {
      if (value.hasOwnProperty(styleKey)) {
        newVnode.dom.style[styleKey] = value[styleKey];
      }
    }
    return;
  }
  if (name in newVnode.dom) {
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
  if (!reservedProps[name]) {
    newVnode.props[name] = value;
    sharedSetAttribute(name, value, newVnode, oldVnode);
  }
}
function removeAttributes(vnode, oldVnode) {
  if (oldVnode) {
    for (const name in oldVnode.props) {
      if (!vnode.props[name] && !eventListenerNames[name] && !reservedProps[name]) {
        if (name in vnode.dom) {
          vnode.dom[name] = null;
        } else {
          vnode.dom.removeAttribute(name);
        }
      }
    }
  }
}
function addProperties(vnode, oldVnode) {
  for (const name in vnode.props) {
    if (reservedProps[name]) {
      if (directives[name] && directives[name](vnode, oldVnode) === false) {
        break;
      }
      continue;
    }
    sharedSetAttribute(name, vnode.props[name], vnode, oldVnode);
  }
}
function updateAttributes(newVnode, oldVnode) {
  removeAttributes(newVnode, oldVnode);
  addProperties(newVnode, oldVnode);
}
var domToVnodeWeakMap = /* @__PURE__ */ new WeakMap();
function createElement(tag, isSVG) {
  return isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
}
function createNewElement(vnode, parentVnode) {
  if (vnode instanceof Vnode === false) {
    return document.createTextNode(vnode);
  }
  vnode._parent = parentVnode;
  const dom = createElement(vnode.tag, vnode.isSVG);
  vnode.dom = dom;
  domToVnodeWeakMap.set(dom, vnode);
  addProperties(vnode, null);
  if ("v-text" in vnode.props) {
    dom.textContent = vnode.props["v-text"];
    return dom;
  }
  flatTree(vnode);
  if (vnode.children.length === 0) {
    return dom;
  }
  for (let i = 0, l = vnode.children.length; i < l; i++) {
    const childVnode = vnode.children[i];
    const childEl = createNewElement(childVnode, vnode);
    dom.appendChild(childEl);
  }
  return dom;
}
function cleanupVnodeChildren(vnode) {
  for (let i = 0, l = vnode.dom.childNodes.length; i < l; i++) {
    const child = vnode.dom.childNodes[i];
    if (domToVnodeWeakMap.has(child)) {
      const oldVnode = domToVnodeWeakMap.get(child);
      cleanupVnodeChildren(oldVnode);
      domToVnodeWeakMap.delete(child);
    }
  }
}
function processVnode(newVnode, newChild, oldChild) {
  newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";
  if (!oldChild || newChild.tag !== oldChild.nodeName.toLowerCase()) {
    newChild.dom = createNewElement(newChild, newVnode);
    if (oldChild) {
      newVnode.dom.replaceChild(newChild.dom, oldChild);
    } else {
      newVnode.dom.appendChild(newChild.dom);
    }
    return;
  }
  newChild._parent = newVnode;
  const oldVnode = domToVnodeWeakMap.get(oldChild);
  newChild.dom = oldChild;
  domToVnodeWeakMap.set(oldChild, newChild);
  if (oldVnode && "v-keep" in newChild.props && newChild.props["v-keep"] === oldVnode.props["v-keep"]) {
    newChild.children = oldVnode.children;
    return;
  }
  updateAttributes(newChild, oldVnode || null);
  if ("v-text" in newChild.props) {
    if (newChild.dom.textContent != newChild.props["v-text"]) {
      newChild.dom.textContent = newChild.props["v-text"];
    }
    return;
  }
  if (newChild.children.length === 0) {
    if (newChild.dom.childNodes.length > 0) {
      newChild.dom.textContent = "";
      cleanupVnodeChildren(newChild);
    }
    return;
  }
  patch(newChild);
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
    if (newChild instanceof Vnode && typeof newChild.tag !== "string") {
      const component = ("view" in newChild.tag ? newChild.tag.view : newChild.tag).bind(newChild.tag);
      current.component = component;
      children[i] = component(newChild.props, newChild.children);
    }
    i++;
  }
}
function patch(newVnode) {
  flatTree(newVnode);
  const { dom, children } = newVnode;
  const newTreeLength = children.length;
  if (newTreeLength === 0) {
    dom.textContent = "";
    cleanupVnodeChildren(newVnode);
    return;
  }
  const oldTree = dom.childNodes;
  const oldTreeLength = oldTree.length;
  const firstOldVnode = oldTree[0] && domToVnodeWeakMap.get(oldTree[0]);
  if (firstOldVnode && children[0] instanceof Vnode && "key" in children[0].props && "key" in firstOldVnode.props) {
    const oldKeyedList = {};
    const newKeyedList = {};
    const childNodes = newVnode.dom.childNodes;
    for (let i = 0; i < oldTreeLength; i++) {
      const oldVnode = domToVnodeWeakMap.get(oldTree[i]);
      oldKeyedList[oldVnode?.props.key] = i;
      if (i < newTreeLength) {
        newKeyedList[children[i].props.key] = i;
      }
    }
    for (let i = 0; i < newTreeLength; i++) {
      const newChild = children[i];
      newChild._parent = newVnode;
      newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";
      const oldChildIndex = oldKeyedList[newChild.props.key];
      const oldChild = oldTree[oldChildIndex];
      let shouldPatch = true;
      if (oldChild) {
        newChild.dom = oldChild;
        const oldVnode = domToVnodeWeakMap.get(oldChild);
        newChild.dom = oldChild;
        domToVnodeWeakMap.set(oldChild, newChild);
        if (oldVnode && "v-keep" in newChild.props && newChild.props["v-keep"] === oldVnode.props["v-keep"]) {
          newChild.children = oldVnode.children;
          shouldPatch = false;
        } else {
          updateAttributes(newChild, oldVnode);
          if ("v-text" in newChild.props) {
            if (newChild.dom.textContent != newChild.props["v-text"]) {
              newChild.dom.textContent = newChild.props["v-text"];
            }
            shouldPatch = false;
          } else if (newChild.children.length === 0) {
            if (newChild.dom.childNodes.length > 0) {
              newChild.dom.textContent = "";
              cleanupVnodeChildren(newChild);
            }
            shouldPatch = false;
          }
        }
      } else {
        newChild.dom = createNewElement(newChild, newVnode);
        shouldPatch = false;
      }
      const currentNode = childNodes[i];
      if (!currentNode) {
        newVnode.dom.appendChild(newChild.dom);
      } else if (currentNode !== newChild.dom) {
        newVnode.dom.replaceChild(newChild.dom, currentNode);
      }
      shouldPatch && patch(newChild);
    }
    for (let i = newTreeLength; i < oldTreeLength; i++) {
      const oldVnode = domToVnodeWeakMap.get(oldTree[i]);
      if (oldVnode && !newKeyedList[oldVnode.props.key]) {
        const domToRemove = oldTree[i];
        domToRemove.parentNode && domToRemove.remove();
        cleanupVnodeChildren(oldVnode);
      }
    }
    return;
  }
  const maxLen = Math.max(newTreeLength, oldTreeLength);
  for (let i = 0; i < maxLen; i++) {
    const newChild = children[i];
    const oldChild = oldTree[i];
    const oldVnode = domToVnodeWeakMap.get(oldChild);
    if (newChild === oldVnode) {
      continue;
    }
    if (!oldChild) {
      newVnode.dom.appendChild(createNewElement(newChild, newVnode));
      continue;
    }
    if (!newChild) {
      oldChild.remove();
      oldVnode && cleanupVnodeChildren(oldVnode);
      continue;
    }
    if (newChild instanceof Vnode === false) {
      if (oldChild.nodeType !== 3) {
        const textDom = document.createTextNode(newChild);
        newVnode.dom.replaceChild(textDom, oldChild);
        if (domToVnodeWeakMap.has(oldChild)) {
          oldVnode && cleanupVnodeChildren(oldVnode);
          domToVnodeWeakMap.delete(oldChild);
        }
      } else if (oldChild.nodeValue != newChild) {
        oldChild.nodeValue = newChild;
      }
      continue;
    }
    processVnode(newVnode, newChild, oldChild);
  }
}
function update() {
  if (mainVnode) {
    callSet(onCleanupSet);
    mainVnode.children = [mainComponent];
    patch(mainVnode);
    callSet(isMounted ? onUpdateSet : onMountSet);
    isMounted = true;
    current.vnode = null;
    current.component = null;
    if (isNodeJs) {
      return mainVnode.dom.innerHTML;
    }
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
  return new Vnode(tagOrComponent, props || {}, children);
}
v.fragment = (_, ...children) => children;
