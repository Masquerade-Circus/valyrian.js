// lib/index.ts
var isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);
var fragment = /* @__PURE__ */ Symbol.for("valyrian.fragment");
var Vnode = class {
  constructor(tag, props, children, key, dom, isSVG, oldChildComponents, childComponents, hasKeys, oncreate, oncleanup, onupdate, onremove) {
    this.tag = tag;
    this.props = props;
    this.children = children;
    this.key = key;
    this.dom = dom;
    this.isSVG = isSVG;
    this.oldChildComponents = oldChildComponents;
    this.childComponents = childComponents;
    this.hasKeys = hasKeys;
    this.oncreate = oncreate;
    this.oncleanup = oncleanup;
    this.onupdate = onupdate;
    this.onremove = onremove;
  }
  tag;
  props;
  children;
  key;
  dom;
  isSVG;
  oldChildComponents;
  childComponents;
  hasKeys;
  oncreate;
  oncleanup;
  onupdate;
  onremove;
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
    vnode.dom = dom;
    dom.vnode = vnode;
    vnode.isSVG = tag === "svg";
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
  vnode["oncleanup" /* onCleanup */] = vnode["oncleanup" /* onCleanup */] || /* @__PURE__ */ new Set();
  vnode["oncleanup" /* onCleanup */].add(cleanup);
  if (vnode.dom) {
    markSubtreeLifecycle(vnode.dom);
  }
}
function addCallbackToSet(callback, setType, vnode) {
  vnode[setType] = vnode[setType] || /* @__PURE__ */ new Set();
  if (vnode.dom && (setType === "oncleanup" /* onCleanup */ || setType === "onremove" /* onRemove */)) {
    markSubtreeLifecycle(vnode.dom);
  }
  vnode[setType].add(() => {
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
  const hasComponentAsOldChild = parentVnode.oldChildComponents && parentVnode.oldChildComponents.has(component);
  if (!hasComponentAsOldChild) {
    parentVnode["oncreate" /* onCreate */] = parentVnode["oncreate" /* onCreate */] || /* @__PURE__ */ new Set();
    parentVnode["oncreate" /* onCreate */].add(() => {
      const cleanup = callback();
      if (typeof cleanup === "function") {
        registerCleanup(cleanup, parentVnode);
        return;
      }
      if (isThenable(cleanup)) {
        Promise.resolve(cleanup).then(() => void 0).catch((error) => {
          console.error("Error in onCreate:", error);
        }).finally(() => {
          debouncedUpdate();
        });
      }
    });
  }
};
var onUpdate = (callback) => {
  const currentState = getCurrentComponentState();
  const parentVnode = currentState.vnode;
  const component = currentState.component;
  const hasComponentAsChild = parentVnode.childComponents && parentVnode.childComponents.has(component);
  if (hasComponentAsChild) {
    addCallbackToSet(callback, "onupdate" /* onUpdate */, parentVnode);
  }
};
var onCleanup = (callback) => {
  const currentState = getCurrentComponentState();
  addCallbackToSet(callback, "oncleanup" /* onCleanup */, currentState.vnode);
};
var onRemove = (callback) => {
  const currentState = getCurrentComponentState();
  const parentVnode = currentState.vnode;
  const component = currentState.component;
  let removed = false;
  function removeCallback() {
    const hasComponentAsChild = parentVnode.childComponents && parentVnode.childComponents.has(component);
    if (hasComponentAsChild || removed) {
      return;
    }
    removed = true;
    callback();
  }
  addCallbackToSet(removeCallback, "onremove" /* onRemove */, parentVnode);
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
    if (vnodes[i].oncleanup?.size) {
      callSet(vnodes[i].oncleanup);
    }
  }
}
function callRemoveOnVnodes(vnodes) {
  for (let i = 0; i < vnodes.length; i++) {
    if (vnodes[i].onremove?.size) {
      callSet(vnodes[i].onremove);
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
    addCallbackToSet(() => callback(vnode), "oncreate" /* onCreate */, vnode);
  },
  "v-update": (callback, vnode, oldProps) => {
    if (!oldProps) {
      return;
    }
    addCallbackToSet(() => callback(vnode, oldProps), "onupdate" /* onUpdate */, vnode);
  },
  "v-cleanup": (callback, vnode) => {
    vnode.oncleanup = vnode.oncleanup || /* @__PURE__ */ new Set();
    vnode.oncleanup.add(() => callback(vnode));
    markSubtreeLifecycle(vnode.dom);
  },
  "v-remove": (callback, vnode) => {
    vnode.onremove = vnode.onremove || /* @__PURE__ */ new Set();
    vnode.onremove.add(() => callback(vnode));
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
      if (newVnode.isSVG) {
        vnodeDom.setAttribute("style", value);
        return;
      }
      vnodeDom.style = value;
      return;
    }
    if (typeof value === "object") {
      if (newVnode.isSVG) {
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
      const runDirective = directives[name];
      const result = runDirective(value, newVnode, oldVnodeProps);
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
      const runDirective = directives[name];
      const result = runDirective(value, newVnode, oldVnodeProps);
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
  return newVnode.isSVG ? updateSVGAttributes(newVnode, oldVnode) : updateDomAttributes(newVnode, oldVnode);
}
var SvgElementNS = "http://www.w3.org/2000/svg";
function createElement(tag, isSVG) {
  return isSVG ? document.createElementNS(SvgElementNS, tag) : document.createElement(tag);
}
function flatTree(newVnode) {
  let children;
  const newChildren = newVnode.children;
  const parentIsSVG = newVnode.isSVG;
  newVnode.hasKeys = false;
  newVnode.oldChildComponents = newVnode.childComponents;
  newVnode.childComponents = void 0;
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
        newChild.isSVG = parentIsSVG || newChild.tag === "svg";
        newVnode.hasKeys = newVnode.hasKeys || typeof newChild.key !== "undefined";
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
      newChild.isSVG = parentIsSVG || newChild.tag === "svg";
      if (newChild.tag === fragment) {
        for (let l = newChild.children.length - 1; l >= 0; l--) {
          children.push(newChild.children[l]);
        }
        continue;
      }
      if (typeof newChild.tag !== "string") {
        const component = current.component = newChild.tag;
        newVnode.childComponents = newVnode.childComponents || /* @__PURE__ */ new Set();
        newVnode.childComponents.add(component);
        children.push(
          (typeof component === "function" ? component : component.view).call(
            component,
            newChild.props,
            newChild.children
          )
        );
        continue;
      }
      newVnode.hasKeys = newVnode.hasKeys || typeof newChild.key !== "undefined";
      out.push(newChild);
      continue;
    }
    out.push(newChild);
  }
  return out;
}
function processNewChild(newChild, parentVnode, oldDom, appendTarget) {
  const dom = createElement(newChild.tag, newChild.isSVG);
  if (oldDom) {
    newChild.dom = dom;
    strictReplaceChild(parentVnode.dom, newChild.dom, oldDom);
  } else {
    newChild.dom = (appendTarget || parentVnode.dom).appendChild(dom);
  }
  newChild.isSVG ? updateSVGAttributes(newChild) : updateDomAttributes(newChild);
  if ("v-text" in newChild.props) {
    newChild.dom.textContent = newChild.props["v-text"];
    if (newChild.oncreate?.size) {
      commitSet(newChild.oncreate);
    }
    return;
  }
  const currentState = getRendererState().current;
  currentState.oldVnode = null;
  currentState.vnode = newChild;
  const children = flatTree(newChild);
  if (children.length === 0) {
    newChild.dom.textContent = "";
    if (newChild.oncreate?.size) {
      commitSet(newChild.oncreate);
    }
    return;
  }
  for (let i = 0, l = children.length; i < l; i++) {
    if (children[i] instanceof Vnode === false) {
      newChild.dom.appendChild(document.createTextNode(children[i]));
      continue;
    }
    processNewChild(children[i], newChild);
  }
  if (newChild.oncreate?.size) {
    commitSet(newChild.oncreate);
  }
}
function patch(newVnode, oldVnode) {
  const currentState = getRendererState().current;
  currentState.oldVnode = oldVnode;
  currentState.vnode = newVnode;
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
    if (newVnode.oncreate?.size) {
      commitSet(newVnode.oncreate);
    }
    if (newVnode.onupdate?.size) {
      commitSet(newVnode.onupdate);
    }
    return;
  }
  const childNodes = dom.childNodes;
  const oldChildrenLength = childNodes.length;
  const childrenLength = children.length;
  if (oldChildrenLength === 0) {
    const appendTarget = childrenLength > 1 ? document.createDocumentFragment() : dom;
    let hasFragmentLifecycle = false;
    for (let i = 0; i < childrenLength; i++) {
      const newChild = children[i];
      if (newChild instanceof Vnode === false) {
        appendTarget.appendChild(document.createTextNode(newChild));
        continue;
      }
      processNewChild(newChild, newVnode, void 0, appendTarget);
      if (appendTarget !== dom && newChild.dom[SUBTREE_LC]) {
        hasFragmentLifecycle = true;
      }
    }
    if (appendTarget !== dom) {
      dom.appendChild(appendTarget);
      if (hasFragmentLifecycle) {
        markSubtreeLifecycle(dom);
      }
    }
    if (newVnode.oncreate?.size) {
      commitSet(newVnode.oncreate);
    }
    return;
  }
  let oldTree = childNodes;
  const oldKeyedList = /* @__PURE__ */ Object.create(null);
  if (newVnode.hasKeys) {
    const newOldTree = [];
    for (let i = 0, l = oldTree.length; i < l; i++) {
      newOldTree[i] = oldTree[i];
      const oldVnode2 = oldTree[i].vnode;
      oldKeyedList[oldVnode2?.key ?? i] = i;
    }
    oldTree = newOldTree;
  }
  for (let i = 0; i < childrenLength; i++) {
    const newChild = children[i];
    if (newChild instanceof Vnode === false) {
      const oldChild2 = oldTree[i];
      if (!oldChild2) {
        if (newVnode.hasKeys) {
          dom.appendChild(document.createTextNode(newChild));
        } else {
          const fragment2 = document.createDocumentFragment();
          let hasFragmentLifecycle = false;
          for (let j = i; j < childrenLength; j++) {
            const tailChild = children[j];
            if (tailChild instanceof Vnode === false) {
              fragment2.appendChild(document.createTextNode(tailChild));
            } else {
              processNewChild(tailChild, newVnode, void 0, fragment2);
              if (tailChild.dom[SUBTREE_LC]) {
                hasFragmentLifecycle = true;
              }
            }
          }
          dom.appendChild(fragment2);
          if (hasFragmentLifecycle) {
            markSubtreeLifecycle(dom);
          }
          break;
        }
        continue;
      }
      if (oldChild2.nodeType !== 3) {
        strictReplaceChild(dom, document.createTextNode(newChild), oldChild2);
        continue;
      }
      if (oldChild2.nodeValue != newChild) {
        oldChild2.nodeValue = newChild;
      }
      continue;
    }
    const oldChild = oldTree[newVnode.hasKeys ? oldKeyedList[newChild.key ?? i] : i];
    if (!oldChild || newChild.tag !== (oldChild.vnode?.tag || oldChild.nodeName.toLowerCase())) {
      if (!oldChild && !newVnode.hasKeys) {
        const fragment2 = document.createDocumentFragment();
        let hasFragmentLifecycle = false;
        for (let j = i; j < childrenLength; j++) {
          const tailChild = children[j];
          if (tailChild instanceof Vnode === false) {
            fragment2.appendChild(document.createTextNode(tailChild));
          } else {
            processNewChild(tailChild, newVnode, void 0, fragment2);
            if (tailChild.dom[SUBTREE_LC]) {
              hasFragmentLifecycle = true;
            }
          }
        }
        dom.appendChild(fragment2);
        if (hasFragmentLifecycle) {
          markSubtreeLifecycle(dom);
        }
        break;
      }
      processNewChild(newChild, newVnode, childNodes[i]);
      continue;
    }
    newChild.dom = oldChild;
    const currentChild = childNodes[i];
    const oldChildVnode = oldChild.vnode;
    if (!currentChild) {
      dom.appendChild(oldChild);
    } else if (currentChild !== oldChild) {
      dom.insertBefore(oldChild, currentChild);
    }
    if ("v-keep" in newChild.props && oldChildVnode) {
      if (oldChildVnode.props["v-keep"] === newChild.props["v-keep"]) {
        continue;
      }
      const nextOldVnode = childNodes[i + 1]?.vnode;
      const oldProps = nextOldVnode?.props;
      const nextKey = nextOldVnode?.key;
      if (oldProps && typeof nextKey === "undefined" && oldProps["v-keep"] === newChild.props["v-keep"]) {
        strictRemoveNode(oldChild);
        if (newVnode.hasKeys) {
          oldTree.splice(i, 1);
        }
        continue;
      }
    }
    if (oldChildVnode?.oncleanup?.size) {
      callSet(oldChildVnode.oncleanup);
    }
    newChild.isSVG ? updateSVGAttributes(newChild, oldChildVnode) : updateDomAttributes(newChild, oldChildVnode);
    if ("v-text" in newChild.props) {
      if (oldChild.textContent != newChild.props["v-text"]) {
        oldChild.textContent = newChild.props["v-text"];
      }
      continue;
    }
    patch(newChild, oldChildVnode || null);
  }
  for (let i = childNodes.length; i > childrenLength; i--) {
    const toRemove = childNodes[i - 1];
    if (toRemove && toRemove.nodeType === 1) {
      strictRemoveNode(toRemove);
    } else {
      toRemove?.remove();
    }
  }
  if (newVnode.oncreate?.size) {
    commitSet(newVnode.oncreate);
  }
  if (newVnode.onupdate?.size) {
    commitSet(newVnode.onupdate);
  }
}
function updateVnode(vnode, shouldCleanup = true) {
  const state = getRendererState();
  const currentState = state.current;
  vnode.props = vnode.props || {};
  const previousCommitQueue = state.commitQueue;
  state.commitQueue = null;
  if (shouldCleanup && vnode.oncleanup?.size) {
    callSet(vnode.oncleanup);
  }
  const oldOnRemoveSet = vnode.onremove?.size ? new Set(vnode.onremove) : null;
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
var debouncedUpdateMethod = isNodeJs ? update : () => requestAnimationFrame(update);
function debouncedUpdate(timeout = 42) {
  preventUpdate();
  const state = getRendererState();
  clearTimeout(state.debouncedUpdateTimeout);
  state.debouncedUpdateTimeout = setTimeout(() => {
    debouncedUpdateMethod();
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
export {
  Vnode,
  createElement,
  current,
  debouncedUpdate,
  directive,
  directives,
  fragment,
  hydrateDomToVnode,
  isComponent,
  isNodeJs,
  isPOJOComponent,
  isVnode,
  isVnodeComponent,
  mount,
  onCleanup,
  onCreate,
  onRemove,
  onUpdate,
  preventUpdate,
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
