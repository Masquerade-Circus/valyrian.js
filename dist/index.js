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
var index_exports = {};
__export(index_exports, {
  Vnode: () => Vnode,
  createElement: () => createElement,
  current: () => current,
  debouncedUpdate: () => debouncedUpdate,
  directive: () => directive,
  directives: () => directives,
  fragment: () => fragment,
  hydrateDomToVnode: () => hydrateDomToVnode,
  isComponent: () => isComponent,
  isNodeJs: () => isNodeJs,
  isPOJOComponent: () => isPOJOComponent,
  isVnode: () => isVnode,
  isVnodeComponent: () => isVnodeComponent,
  mount: () => mount,
  onCleanup: () => onCleanup,
  onCreate: () => onCreate,
  onRemove: () => onRemove,
  onUpdate: () => onUpdate,
  preventUpdate: () => preventUpdate,
  reservedProps: () => reservedProps,
  setAttribute: () => setAttribute,
  setPropNameReserved: () => setPropNameReserved,
  trust: () => trust,
  unmount: () => unmount,
  update: () => update,
  updateAttributes: () => updateAttributes,
  updateVnode: () => updateVnode,
  v: () => v
});
module.exports = __toCommonJS(index_exports);
var isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);
var fragment = /* @__PURE__ */ Symbol.for("valyrian.fragment");
var OLD_CHILD_COMPONENTS = /* @__PURE__ */ Symbol("oldChildComponents");
var CHILD_COMPONENTS = /* @__PURE__ */ Symbol("childComponents");
var HAS_KEYS = /* @__PURE__ */ Symbol("hasKeys");
var IS_SVG = /* @__PURE__ */ Symbol("isSVG");
var ON_CREATE = /* @__PURE__ */ Symbol("oncreate");
var ON_UPDATE = /* @__PURE__ */ Symbol("onupdate");
var ON_CLEANUP = /* @__PURE__ */ Symbol("oncleanup");
var ON_REMOVE = /* @__PURE__ */ Symbol("onremove");
var Vnode = class {
  constructor(tag, props, children, key, dom, isSVG, oldChildComponents, childComponents, hasKeys, oncreate, oncleanup, onupdate, onremove) {
    this.tag = tag;
    this.props = props;
    this.children = children;
    this.key = key;
    this.dom = dom;
    this[IS_SVG] = isSVG;
    this[OLD_CHILD_COMPONENTS] = oldChildComponents;
    this[CHILD_COMPONENTS] = childComponents;
    this[HAS_KEYS] = hasKeys;
    this[ON_CREATE] = oncreate;
    this[ON_CLEANUP] = oncleanup;
    this[ON_UPDATE] = onupdate;
    this[ON_REMOVE] = onremove;
  }
  tag;
  props;
  children;
  key;
  dom;
};
var isPOJOComponent = (component) => Boolean(component && typeof component === "object" && "view" in component);
var isComponent = (component) => Boolean(typeof component === "function" || isPOJOComponent(component));
var isVnode = (object) => object instanceof Vnode;
var isVnodeComponent = (object) => {
  return isVnode(object) && isComponent(object.tag);
};
function v(tagOrComponent, props, ...children) {
  const key = props?.key;
  if (typeof key !== "undefined") {
    Reflect.deleteProperty(props, "key");
  }
  return new Vnode(tagOrComponent, props, children, key);
}
v.fragment = (_, ...children) => children;
var DOM_SNAPSHOT = /* @__PURE__ */ Symbol("valyrian.domSnapshot");
function hydrateDomToVnode(dom) {
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
        const childVnode = hydrateDomToVnode(childDom);
        children.push(childVnode);
      }
    }
    const attributes = dom.attributes;
    for (let i = 0, l = attributes.length; i < l; i++) {
      const attr = attributes[i];
      props[attr.nodeName] = attr.nodeValue;
    }
    const vnode = new Vnode(tag, props, children);
    Object.defineProperty(vnode, DOM_SNAPSHOT, { value: true });
    vnode.dom = dom;
    dom.vnode = vnode;
    vnode[IS_SVG] = tag === "svg";
    return vnode;
  }
}
function trust(htmlString) {
  const div = createElement("div");
  div.innerHTML = htmlString.trim();
  return Array.from(div.childNodes).map(hydrateDomToVnode);
}
var rendererStateKey = /* @__PURE__ */ Symbol.for("valyrian.rendererState");
function createRendererState() {
  return {
    mainComponent: null,
    mainVnode: null,
    isMounted: false,
    current: { oldVnode: null, vnode: null, component: null, event: null },
    commitQueue: null,
    isFlushingCommit: false,
    pendingUpdateAfterCommit: false,
    eventListenerNames: /* @__PURE__ */ new Set(),
    debouncedUpdateTimeout: null
  };
}
var rendererState = createRendererState();
function getRendererState() {
  if (isNodeJs && typeof sessionStorage !== "undefined") {
    const storage = sessionStorage;
    const store = storage.store;
    if (store) {
      let state = store[rendererStateKey];
      if (!state) {
        state = createRendererState();
        store[rendererStateKey] = state;
      }
      return state;
    }
  }
  return rendererState;
}
var current = isNodeJs ? new Proxy(rendererState.current, {
  get(_target, property) {
    return Reflect.get(getRendererState().current, property);
  },
  set(_target, property, value) {
    return Reflect.set(getRendererState().current, property, value);
  }
}) : rendererState.current;
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
  "v-cleanup",
  "v-remove",
  "v-ref",
  // Just for security reasons avoid to use this properties
  "innerHTML",
  "outerHTML",
  "srcdoc"
]);
var SUBTREE_LC = /* @__PURE__ */ Symbol.for("valyrian.subtreeLifecycle");
function markSubtreeLifecycle(dom) {
  let node = dom;
  while (node && node.nodeType === 1 && !node[SUBTREE_LC]) {
    node[SUBTREE_LC] = true;
    node = node.parentElement;
  }
}
function registerCleanup(cleanup, vnode) {
  (vnode[ON_CLEANUP] ||= /* @__PURE__ */ new Set()).add(cleanup);
  if (vnode.dom) {
    markSubtreeLifecycle(vnode.dom);
  }
}
function addCallbackToSet(callback, setType, vnode) {
  const callbacks = vnode[setType] ||= /* @__PURE__ */ new Set();
  if (vnode.dom && (setType === ON_CLEANUP || setType === ON_REMOVE)) {
    markSubtreeLifecycle(vnode.dom);
  }
  callbacks.add(() => {
    const cleanup = callback();
    if (typeof cleanup === "function") {
      registerCleanup(cleanup, vnode);
    }
  });
}
function getCurrentComponentState() {
  const currentState = getRendererState().current;
  if (!currentState.vnode) {
    throw new Error("This function must be called inside a component");
  }
  return currentState;
}
var onCreate = (callback) => {
  const currentState = getCurrentComponentState();
  const parentVnode = currentState.vnode;
  const component = currentState.component;
  const hasComponentAsOldChild = parentVnode[OLD_CHILD_COMPONENTS]?.has(component);
  if (!hasComponentAsOldChild) {
    (parentVnode[ON_CREATE] ||= /* @__PURE__ */ new Set()).add(() => {
      const state = getRendererState();
      const mainVnode = state.mainVnode;
      const cleanup = callback();
      if (typeof cleanup === "function") {
        registerCleanup(cleanup, parentVnode);
        return;
      }
      if (isThenable(cleanup)) {
        Promise.resolve(cleanup).then(() => void 0).catch((error) => {
          console.error("Error in onCreate:", error);
        }).finally(() => {
          if (mainVnode !== null && state.mainVnode === mainVnode) {
            debouncedUpdate();
          }
        });
      }
    });
  }
};
var onUpdate = (callback) => {
  const currentState = getCurrentComponentState();
  const parentVnode = currentState.vnode;
  const component = currentState.component;
  const hasComponentAsChild = parentVnode[CHILD_COMPONENTS]?.has(component);
  if (hasComponentAsChild) {
    addCallbackToSet(callback, ON_UPDATE, parentVnode);
  }
};
var onCleanup = (callback) => {
  const currentState = getCurrentComponentState();
  addCallbackToSet(callback, ON_CLEANUP, currentState.vnode);
};
var onRemove = (callback) => {
  const currentState = getCurrentComponentState();
  const parentVnode = currentState.vnode;
  const component = currentState.component;
  let removed = false;
  function removeCallback() {
    const hasComponentAsChild = parentVnode[CHILD_COMPONENTS]?.has(component);
    if (hasComponentAsChild || removed) {
      return;
    }
    removed = true;
    callback();
  }
  addCallbackToSet(removeCallback, ON_REMOVE, parentVnode);
};
var callSet = (set) => {
  if (!set) {
    return;
  }
  for (const callback of set) {
    callback();
  }
  set.clear();
};
var commitSet = (set) => {
  if (!set || set.size === 0) {
    return;
  }
  const callbacks = Array.from(set);
  set.clear();
  const state = getRendererState();
  if (!state.commitQueue) {
    state.commitQueue = [];
  }
  state.commitQueue.push(() => {
    for (let i = 0; i < callbacks.length; i++) {
      callbacks[i]();
    }
  });
};
function collectVnodesPostOrder(dom, out) {
  const childNodes = dom.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i];
    if (!child || child.nodeType !== 1) {
      continue;
    }
    collectVnodesPostOrder(child, out);
  }
  const vnode = dom.vnode;
  if (vnode) {
    out.push(vnode);
  }
}
function callCleanupOnVnodes(vnodes) {
  for (let i = 0; i < vnodes.length; i++) {
    const callbacks = vnodes[i][ON_CLEANUP];
    if (callbacks?.size) {
      callSet(callbacks);
    }
  }
}
function callRemoveOnVnodes(vnodes) {
  for (let i = 0; i < vnodes.length; i++) {
    const callbacks = vnodes[i][ON_REMOVE];
    if (callbacks?.size) {
      callSet(callbacks);
    }
  }
}
function strictRemoveNode(dom) {
  if (!dom || dom.nodeType !== 1) {
    return;
  }
  if (!dom[SUBTREE_LC]) {
    dom.remove();
    return;
  }
  const vnodes = [];
  collectVnodesPostOrder(dom, vnodes);
  callCleanupOnVnodes(vnodes);
  dom.remove();
  callRemoveOnVnodes(vnodes);
}
function strictReplaceChild(parent, newNode, oldNode) {
  let vnodes = null;
  if (oldNode && oldNode.nodeType === 1 && oldNode[SUBTREE_LC]) {
    vnodes = [];
    collectVnodesPostOrder(oldNode, vnodes);
    callCleanupOnVnodes(vnodes);
  }
  parent.replaceChild(newNode, oldNode);
  if (vnodes) {
    callRemoveOnVnodes(vnodes);
  }
}
var directives = {
  "v-create": (callback, vnode, oldProps) => {
    if (oldProps) {
      return;
    }
    addCallbackToSet(() => callback(vnode), ON_CREATE, vnode);
  },
  "v-update": (callback, vnode, oldProps) => {
    if (!oldProps) {
      return;
    }
    addCallbackToSet(() => callback(vnode, oldProps), ON_UPDATE, vnode);
  },
  "v-cleanup": (callback, vnode) => {
    (vnode[ON_CLEANUP] ||= /* @__PURE__ */ new Set()).add(() => callback(vnode));
    markSubtreeLifecycle(vnode.dom);
  },
  "v-remove": (callback, vnode) => {
    (vnode[ON_REMOVE] ||= /* @__PURE__ */ new Set()).add(() => callback(vnode));
    markSubtreeLifecycle(vnode.dom);
  },
  "v-ref": (ref, vnode) => {
    if (typeof ref === "function") {
      const cleanup = ref(vnode.dom, vnode);
      registerCleanup(() => {
        ref(null, vnode);
        if (typeof cleanup === "function") {
          cleanup();
        }
      }, vnode);
      return;
    }
    if (ref && typeof ref === "object") {
      ref.current = vnode.dom;
      registerCleanup(() => {
        if (ref.current === vnode.dom) {
          ref.current = null;
        }
      }, vnode);
    }
  },
  "v-if": (value, vnode) => {
    if (!Boolean(value)) {
      const parentNode = vnode.dom?.parentNode;
      if (parentNode) {
        strictReplaceChild(parentNode, document.createTextNode(""), vnode.dom);
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
    if (property === "__proto__" || property === "constructor" || property === "prototype") {
      return;
    }
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
          vnode.props.checked = value;
          vnode.dom.checked = value;
          break;
        }
        case "radio": {
          const isChecked = model[property] === vnode.dom.value;
          vnode.props.checked = isChecked;
          vnode.dom.checked = isChecked;
          break;
        }
        default: {
          vnode.props.value = model[property];
          vnode.dom.value = model[property];
        }
      }
    } else if (vnode.tag === "select") {
      event = "onclick";
      const isMultiple = Boolean(vnode.props.multiple);
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
      }
      for (let i = 0; i < vnode.children.length; i++) {
        const child = vnode.children[i];
        if (child.tag === "option") {
          const optionValue = "value" in child.props ? child.props.value : child.children.join("").trim();
          child.props.selected = isMultiple ? model[property].indexOf(optionValue) !== -1 : optionValue === model[property];
        }
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
  // Frequent properties are handled directly in updateAttributes.
  style: (value, newVnode) => {
    const vnodeDom = newVnode.dom;
    if (typeof value === "string") {
      if (newVnode[IS_SVG]) {
        vnodeDom.setAttribute("style", value);
        return;
      }
      vnodeDom.style = value;
      return;
    }
    if (typeof value === "object") {
      if (newVnode[IS_SVG]) {
        vnodeDom.setAttribute("style", "");
      } else {
        vnodeDom.style = "";
      }
      const domStyle = vnodeDom.style;
      for (const styleName in value) {
        domStyle[styleName] = value[styleName];
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
var preventedUpdates = /* @__PURE__ */ new WeakMap();
function preventUpdate() {
  const event = getRendererState().current.event;
  if (!event) {
    return;
  }
  preventedUpdates.set(event, true);
}
function sharedSetAttribute(name, value, newVnode) {
  if (typeof value === "function") {
    const state = getRendererState();
    if (!state.eventListenerNames.has(name)) {
      state.mainVnode.dom.addEventListener(name.slice(2), eventListener);
      state.eventListenerNames.add(name);
    }
    return;
  }
  const newVnodeDom = newVnode.dom;
  if (!newVnode[IS_SVG] && name in newVnodeDom) {
    newVnodeDom[name] = value;
    return;
  }
  if (value === false) {
    newVnodeDom.removeAttribute(name);
  } else {
    newVnodeDom.setAttribute(name, value);
  }
}
function isThenable(value) {
  return value !== null && (typeof value === "object" || typeof value === "function") && typeof Reflect.get(value, "then") === "function";
}
function eventListener(e) {
  const currentState = getRendererState().current;
  const previousEvent = currentState.event;
  currentState.event = e;
  let dom = e.target;
  const name = `on${e.type}`;
  while (dom) {
    const oldVnode = dom.vnode;
    if (oldVnode && oldVnode.props[name]) {
      let result;
      try {
        result = oldVnode.props[name](e, oldVnode);
      } finally {
        currentState.event = previousEvent;
      }
      if (preventedUpdates.get(e) !== true) {
        update();
      }
      if (isThenable(result)) {
        Promise.resolve(result).finally(() => {
          if (preventedUpdates.get(e) !== true) {
            update();
          }
        });
      }
      return;
    }
    dom = dom.parentNode;
  }
  currentState.event = previousEvent;
}
function setAttribute(name, value, newVnode) {
  if (!reservedProps.has(name)) {
    newVnode.props[name] = value;
    sharedSetAttribute(name, value, newVnode);
  }
}
function updateSVGAttributes(newVnode, oldVnode) {
  const vnodeDom = newVnode.dom;
  const vnodeProps = newVnode.props;
  const oldVnodeProps = oldVnode?.props;
  let oldDirectiveProps = null;
  vnodeDom.vnode = newVnode;
  if (oldVnodeProps) {
    const eventListenerNames = getRendererState().eventListenerNames;
    for (const name in oldVnodeProps) {
      if (name in vnodeProps === false && !eventListenerNames.has(name) && !reservedProps.has(name)) {
        vnodeDom.removeAttribute(name);
      }
    }
  }
  for (const name in vnodeProps) {
    const value = vnodeProps[name];
    if (name === "class") {
      if (oldVnodeProps && oldVnodeProps[name] === value) {
        continue;
      }
      if (vnodeDom.className !== value) {
        vnodeDom.setAttribute("class", value);
      }
      continue;
    }
    if (name === "id") {
      if (oldVnodeProps && oldVnodeProps[name] === value) {
        continue;
      }
      if (vnodeDom.id !== value) {
        vnodeDom.setAttribute("id", value);
      }
      continue;
    }
    if (name in directives) {
      if (oldDirectiveProps === null) {
        oldDirectiveProps = oldVnode?.[DOM_SNAPSHOT] ? void 0 : oldVnodeProps;
      }
      const runDirective = directives[name];
      const result = runDirective(value, newVnode, oldDirectiveProps);
      if (result === false) {
        return;
      }
      continue;
    }
    if (!reservedProps.has(name)) {
      if (oldVnodeProps && oldVnodeProps[name] === value) {
        continue;
      }
      sharedSetAttribute(name, value, newVnode);
    }
  }
}
function updateDomAttributes(newVnode, oldVnode) {
  const vnodeDom = newVnode.dom;
  const vnodeProps = newVnode.props;
  const oldVnodeProps = oldVnode?.props;
  let oldDirectiveProps = null;
  vnodeDom.vnode = newVnode;
  if (oldVnodeProps) {
    const eventListenerNames = getRendererState().eventListenerNames;
    for (const name in oldVnodeProps) {
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
    const value = vnodeProps[name];
    if (name === "class") {
      if (oldVnodeProps && oldVnodeProps[name] === value) {
        continue;
      }
      if (vnodeDom.className !== value) {
        vnodeDom.className = value;
      }
      continue;
    }
    if (name === "id") {
      if (oldVnodeProps && oldVnodeProps[name] === value) {
        continue;
      }
      if (vnodeDom.id !== value) {
        vnodeDom.id = value;
      }
      continue;
    }
    if (name in directives) {
      if (oldDirectiveProps === null) {
        oldDirectiveProps = oldVnode?.[DOM_SNAPSHOT] ? void 0 : oldVnodeProps;
      }
      const runDirective = directives[name];
      const result = runDirective(value, newVnode, oldDirectiveProps);
      if (result === false) {
        return;
      }
      continue;
    }
    if (!reservedProps.has(name)) {
      if (oldVnodeProps && oldVnodeProps[name] === value) {
        continue;
      }
      sharedSetAttribute(name, value, newVnode);
    }
  }
}
function updateAttributes(newVnode, oldVnode) {
  return newVnode[IS_SVG] ? updateSVGAttributes(newVnode, oldVnode) : updateDomAttributes(newVnode, oldVnode);
}
var SvgElementNS = "http://www.w3.org/2000/svg";
function createElement(tag, isSVG) {
  return isSVG ? document.createElementNS(SvgElementNS, tag) : document.createElement(tag);
}
function flatTree(newVnode, mounting = false) {
  let children;
  const newChildren = newVnode.children;
  const parentIsSVG = newVnode[IS_SVG];
  newVnode[HAS_KEYS] = false;
  newVnode[OLD_CHILD_COMPONENTS] = newVnode[CHILD_COMPONENTS];
  newVnode[CHILD_COMPONENTS] = void 0;
  if ("v-for" in newVnode.props) {
    const callback = newVnode.children[0];
    if (typeof callback !== "function") {
      console.warn("v-for directive must have a callback function as children");
      return [];
    }
    const set = newVnode.props["v-for"];
    const setLength = set.length;
    const simpleChildren = new Array(setLength);
    let fallbackChildren = null;
    for (let i = 0; i < setLength; i++) {
      const newChild = callback(set[i], i);
      if (fallbackChildren === null && newChild instanceof Vnode && typeof newChild.tag === "string") {
        newChild.props = newChild.props || {};
        newChild[IS_SVG] = parentIsSVG || newChild.tag === "svg";
        newVnode[HAS_KEYS] = newVnode[HAS_KEYS] || typeof newChild.key !== "undefined";
        simpleChildren[i] = newChild;
        continue;
      }
      if (fallbackChildren === null) {
        fallbackChildren = new Array(setLength);
        for (let j = 0; j < i; j++) {
          fallbackChildren[setLength - 1 - j] = simpleChildren[j];
        }
      }
      fallbackChildren[setLength - 1 - i] = newChild;
    }
    if (fallbackChildren === null) {
      return simpleChildren;
    }
    children = fallbackChildren;
  } else {
    const newChildrenLength = newChildren.length;
    if (newChildrenLength === 0 && mounting) {
      return [];
    }
    children = new Array(newChildrenLength);
    for (let i = newChildrenLength - 1, l = 0; i >= 0; i--, l++) {
      children[l] = newChildren[i];
    }
  }
  const out = [];
  while (children.length) {
    const newChild = children.pop();
    if (newChild == null) {
      continue;
    }
    if (Array.isArray(newChild)) {
      for (let l = newChild.length - 1; l >= 0; l--) {
        children.push(newChild[l]);
      }
      continue;
    }
    if (newChild instanceof Vnode) {
      newChild.props = newChild.props || {};
      newChild[IS_SVG] = parentIsSVG || newChild.tag === "svg";
      if (newChild.tag === fragment) {
        for (let l = newChild.children.length - 1; l >= 0; l--) {
          children.push(newChild.children[l]);
        }
        continue;
      }
      if (typeof newChild.tag !== "string") {
        const component = current.component = newChild.tag;
        (newVnode[CHILD_COMPONENTS] ||= /* @__PURE__ */ new Set()).add(component);
        children.push(
          (typeof component === "function" ? component : component.view).call(
            component,
            newChild.props,
            newChild.children
          )
        );
        continue;
      }
      newVnode[HAS_KEYS] = newVnode[HAS_KEYS] || typeof newChild.key !== "undefined";
      out.push(newChild);
      continue;
    }
    out.push(newChild);
  }
  return out;
}
function processNewChild(newChild, parentVnode, oldDom, appendTarget, before) {
  const dom = createElement(newChild.tag, newChild[IS_SVG]);
  if (oldDom) {
    newChild.dom = dom;
    strictReplaceChild(parentVnode.dom, newChild.dom, oldDom);
  } else if (before) {
    newChild.dom = parentVnode.dom.insertBefore(dom, before);
  } else {
    newChild.dom = (appendTarget || parentVnode.dom).appendChild(dom);
  }
  newChild[IS_SVG] ? updateSVGAttributes(newChild) : updateDomAttributes(newChild);
  if ("v-text" in newChild.props) {
    newChild.dom.textContent = newChild.props["v-text"];
  } else {
    const currentState = getRendererState().current;
    currentState.oldVnode = null;
    currentState.vnode = newChild;
    const children = flatTree(newChild, true);
    if (children.length === 0) {
      newChild.dom.textContent = "";
    } else {
      appendNewChildren({ parentVnode: newChild, children, start: 0, target: newChild.dom });
    }
  }
  if (newChild[ON_CREATE]?.size) {
    commitSet(newChild[ON_CREATE]);
  }
}
function appendNewChildren({
  parentVnode,
  children,
  start,
  target
}) {
  const dom = parentVnode.dom;
  const useFragment = target !== dom;
  let hasFragmentLifecycle = false;
  for (let i = start, length = children.length; i < length; i++) {
    const child = children[i];
    if (child instanceof Vnode === false) {
      target.appendChild(document.createTextNode(child));
      continue;
    }
    processNewChild(child, parentVnode, void 0, target);
    if (useFragment && child.dom[SUBTREE_LC]) {
      hasFragmentLifecycle = true;
    }
  }
  if (useFragment) {
    dom.appendChild(target);
    if (hasFragmentLifecycle) {
      markSubtreeLifecycle(dom);
    }
  }
}
function stableKeyedPositions({ positions, focusedIndex }) {
  const tails = [];
  const previous = [];
  const focusedPosition = positions[focusedIndex];
  for (let i = 0; i < positions.length; i++) {
    const position = positions[i];
    if (position === -1) {
      continue;
    }
    if (focusedIndex >= 0 && i !== focusedIndex && i < focusedIndex !== position < focusedPosition) {
      continue;
    }
    let low = tails.length;
    if (low > 0 && positions[tails[low - 1]] >= position) {
      let high = low - 1;
      low = 0;
      while (low < high) {
        const mid = low + high >>> 1;
        if (positions[tails[mid]] < position) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
    }
    previous[i] = low > 0 ? tails[low - 1] : -1;
    tails[low] = i;
  }
  const stable = /* @__PURE__ */ new Set();
  for (let i = tails[tails.length - 1]; i >= 0; i = previous[i]) {
    stable.add(i);
  }
  return stable;
}
function reconcileKeyedRange({
  dom,
  childNodes,
  children,
  start
}) {
  const oldKeys = /* @__PURE__ */ new Map();
  for (let i = start; i < childNodes.length; i++) {
    const key = childNodes[i].vnode?.key;
    if (key != null) {
      oldKeys.set(key, i);
    }
  }
  const matches = [];
  const positions = [];
  const retained = [];
  let lastPosition = -1;
  let reordered = false;
  for (let i = start; i < children.length; i++) {
    const child = children[i];
    const key = child instanceof Vnode ? child.key : null;
    const position = key == null ? i : oldKeys.get(key);
    const candidate = position == null ? null : childNodes[position];
    const match = candidate && (key != null || candidate.vnode?.key == null) && (child instanceof Vnode ? child.tag === (candidate.vnode?.tag || candidate.nodeName.toLowerCase()) : candidate.nodeType === 3);
    if (!match || position == null || retained[position]) {
      matches.push(null);
      positions.push(-1);
      continue;
    }
    matches.push(candidate);
    positions.push(position);
    retained[position] = true;
    reordered = reordered || position < lastPosition;
    lastPosition = position;
  }
  const removals = [];
  for (let i = childNodes.length - 1; i >= start; i--) {
    if (!retained[i]) {
      removals.push(childNodes[i]);
    }
  }
  if (reordered) {
    let focusedIndex = -1;
    if (dom.ownerDocument) {
      let focused = dom.getRootNode().activeElement ?? null;
      while (focused && focused !== dom && focused.parentNode !== dom) {
        focused = focused.parentNode;
      }
      if (focused?.parentNode === dom) {
        focusedIndex = matches.indexOf(focused);
      }
    }
    const stable = stableKeyedPositions({ positions, focusedIndex });
    let before = null;
    for (let i = matches.length - 1; i >= 0; i--) {
      const child = matches[i];
      if (child) {
        if (!stable.has(i)) {
          dom.insertBefore(child, before);
        }
        before = child;
      }
    }
  }
  return { matches, removals };
}
function patch(newVnode, oldVnode) {
  const currentState = getRendererState().current;
  currentState.oldVnode = oldVnode;
  currentState.vnode = newVnode;
  const hydrating = typeof (oldVnode || newVnode)[HAS_KEYS] === "undefined";
  const children = flatTree(newVnode);
  const dom = newVnode.dom;
  if (children.length === 0) {
    if (dom.childNodes.length !== 0) {
      if (!dom[SUBTREE_LC]) {
        dom.textContent = "";
      } else {
        const childNodes2 = Array.from(dom.childNodes);
        for (let i = childNodes2.length - 1; i >= 0; i--) {
          const child = childNodes2[i];
          if (child && child.nodeType === 1) {
            strictRemoveNode(child);
          } else {
            child?.remove?.();
          }
        }
      }
    }
    if (newVnode[ON_CREATE]?.size) {
      commitSet(newVnode[ON_CREATE]);
    }
    if (newVnode[ON_UPDATE]?.size) {
      commitSet(newVnode[ON_UPDATE]);
    }
    return;
  }
  const childNodes = dom.childNodes;
  const oldChildrenLength = childNodes.length;
  const childrenLength = children.length;
  if (oldChildrenLength === 0) {
    const target = childrenLength > 1 ? document.createDocumentFragment() : dom;
    appendNewChildren({ parentVnode: newVnode, children, start: 0, target });
    if (newVnode[ON_CREATE]?.size) {
      commitSet(newVnode[ON_CREATE]);
    }
    return;
  }
  let keyedStart = 0;
  let keyedChildren = null;
  let nextMatch = 0;
  for (let i = 0; i < childrenLength; i++) {
    const newChild = children[i];
    const currentChild = childNodes[i];
    if (newVnode[HAS_KEYS] && !hydrating && !keyedChildren && currentChild) {
      const key = newChild instanceof Vnode ? newChild.key : null;
      if ((key ?? null) !== (currentChild.vnode?.key ?? null)) {
        keyedStart = i;
        keyedChildren = reconcileKeyedRange({ dom, childNodes, children, start: i });
      }
    }
    const offset = i - keyedStart;
    const oldChild = keyedChildren ? keyedChildren.matches[offset] : currentChild;
    let before = null;
    if (keyedChildren && !oldChild) {
      const { matches } = keyedChildren;
      nextMatch = Math.max(nextMatch, offset + 1);
      while (nextMatch < matches.length && !matches[nextMatch]) {
        nextMatch++;
      }
      before = matches[nextMatch] ?? null;
    }
    if (!oldChild && !keyedChildren) {
      const target = newVnode[HAS_KEYS] ? dom : document.createDocumentFragment();
      appendNewChildren({ parentVnode: newVnode, children, start: i, target });
      break;
    }
    if (newChild instanceof Vnode === false) {
      if (!oldChild) {
        dom.insertBefore(document.createTextNode(newChild), before);
        continue;
      }
      if (oldChild.nodeType !== 3) {
        strictReplaceChild(dom, document.createTextNode(newChild), oldChild);
        continue;
      }
      if (oldChild.nodeValue != newChild) {
        oldChild.nodeValue = newChild;
      }
      continue;
    }
    if (!oldChild || newChild.tag !== (oldChild.vnode?.tag || oldChild.nodeName.toLowerCase())) {
      if (keyedChildren) {
        processNewChild(newChild, newVnode, void 0, void 0, before ?? void 0);
      } else {
        processNewChild(newChild, newVnode, oldChild ?? void 0);
      }
      continue;
    }
    newChild.dom = oldChild;
    const oldChildVnode = oldChild.vnode;
    if ("v-keep" in newChild.props && oldChildVnode) {
      if (oldChildVnode.props["v-keep"] === newChild.props["v-keep"]) {
        continue;
      }
      if (!keyedChildren && typeof newChild.key === "undefined") {
        const nextOldVnode = childNodes[i + 1]?.vnode;
        if (nextOldVnode?.props && typeof nextOldVnode.key === "undefined" && nextOldVnode.props["v-keep"] === newChild.props["v-keep"]) {
          strictRemoveNode(oldChild);
          continue;
        }
      }
    }
    const cleanup = oldChildVnode?.[ON_CLEANUP];
    if (cleanup?.size) {
      callSet(cleanup);
    }
    newChild[IS_SVG] ? updateSVGAttributes(newChild, oldChildVnode) : updateDomAttributes(newChild, oldChildVnode);
    if ("v-text" in newChild.props) {
      if (oldChild.textContent != newChild.props["v-text"]) {
        oldChild.textContent = newChild.props["v-text"];
      }
      if (newChild[ON_CREATE]?.size) {
        commitSet(newChild[ON_CREATE]);
      }
      if (newChild[ON_UPDATE]?.size) {
        commitSet(newChild[ON_UPDATE]);
      }
      continue;
    }
    patch(newChild, oldChildVnode || null);
  }
  const removals = keyedChildren?.removals;
  const removalCount = removals ? removals.length : childNodes.length - childrenLength;
  for (let i = 0; i < removalCount; i++) {
    const toRemove = removals ? removals[i] : childNodes[childNodes.length - 1];
    if (toRemove && toRemove.nodeType === 1) {
      strictRemoveNode(toRemove);
    } else {
      toRemove?.remove();
    }
  }
  if (newVnode[ON_CREATE]?.size) {
    commitSet(newVnode[ON_CREATE]);
  }
  if (newVnode[ON_UPDATE]?.size) {
    commitSet(newVnode[ON_UPDATE]);
  }
}
function updateVnode(vnode, shouldCleanup = true) {
  const state = getRendererState();
  const currentState = state.current;
  vnode.props = vnode.props || {};
  const previousCommitQueue = state.commitQueue;
  state.commitQueue = null;
  const cleanup = vnode[ON_CLEANUP];
  if (shouldCleanup && cleanup?.size) {
    callSet(cleanup);
  }
  const oldOnRemoveSet = vnode[ON_REMOVE]?.size ? new Set(vnode[ON_REMOVE]) : null;
  currentState.vnode = vnode;
  try {
    patch(vnode, shouldCleanup ? vnode : null);
    if (oldOnRemoveSet?.size) {
      callSet(oldOnRemoveSet);
    }
    const nextCommitQueue = state.commitQueue;
    if (nextCommitQueue) {
      const previousIsFlushingCommit = state.isFlushingCommit;
      state.isFlushingCommit = true;
      try {
        for (let i = 0; i < nextCommitQueue.length; i++) {
          nextCommitQueue[i]();
        }
      } finally {
        state.isFlushingCommit = previousIsFlushingCommit;
      }
    }
    if (state.pendingUpdateAfterCommit) {
      state.pendingUpdateAfterCommit = false;
      updateVnode(vnode, true);
    }
    state.isMounted = true;
    currentState.oldVnode = null;
    currentState.vnode = null;
    currentState.component = null;
  } finally {
    state.commitQueue = previousCommitQueue;
  }
}
function update() {
  const state = getRendererState();
  if (state.mainVnode) {
    if (state.isFlushingCommit) {
      state.pendingUpdateAfterCommit = true;
      if (isNodeJs) {
        return state.mainVnode.dom.innerHTML;
      }
      return "";
    }
    state.mainVnode.children = [state.mainComponent];
    updateVnode(state.mainVnode, state.isMounted);
    if (isNodeJs) {
      return state.mainVnode.dom.innerHTML;
    }
  }
  return "";
}
function debouncedUpdate(timeout = 42) {
  preventUpdate();
  const state = getRendererState();
  const mainVnode = state.mainVnode;
  clearTimeout(state.debouncedUpdateTimeout);
  state.debouncedUpdateTimeout = setTimeout(() => {
    if (mainVnode !== null && state.mainVnode === mainVnode) {
      if (isNodeJs) {
        update();
        return;
      }
      requestAnimationFrame(() => {
        if (mainVnode !== null && state.mainVnode === mainVnode) {
          update();
        }
      });
    }
  }, timeout);
}
function removeEventListeners(state) {
  if (!state.mainVnode) {
    return;
  }
  for (const name of state.eventListenerNames) {
    state.mainVnode.dom.removeEventListener(name.slice(2), eventListener);
  }
  state.eventListenerNames.clear();
}
function unmount() {
  const state = getRendererState();
  if (state.mainVnode) {
    state.mainComponent = v(() => null, {});
    const result = update();
    removeEventListeners(state);
    state.mainComponent = null;
    state.mainVnode = null;
    state.isMounted = false;
    state.current.vnode = null;
    state.current.component = null;
    state.current.event = null;
    return result;
  }
  return "";
}
function mount(dom, component) {
  const state = getRendererState();
  const container = typeof dom === "string" ? isNodeJs ? document.querySelector(dom) || createElement(dom, dom === "svg") : document.querySelector(dom) : dom;
  if (state.mainVnode && state.mainVnode.dom !== container) {
    removeEventListeners(state);
  }
  if (isComponent(component)) {
    state.mainComponent = v(component, {}, []);
  } else if (isVnodeComponent(component)) {
    state.mainComponent = component;
  } else {
    state.mainComponent = v(() => component, {}, []);
  }
  state.mainVnode = hydrateDomToVnode(container);
  return update();
}
