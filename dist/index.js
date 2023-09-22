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
  createDomElement: () => createDomElement,
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
  return component && (typeof component === "function" || typeof component === "object" && "view" in component);
}
var isVnode = (object) => {
  return object instanceof Vnode;
};
var isVnodeComponent = (object) => {
  return isVnode(object) && isComponent(object.tag);
};
function domToVnode(dom) {
  if (dom.nodeType === 3) {
    let vnode2 = new Vnode(textTag, {}, [dom.nodeValue]);
    vnode2.dom = dom;
    return vnode2;
  }
  let children = [];
  for (let i = 0, l = dom.childNodes.length; i < l; i++) {
    let childDom = dom.childNodes[i];
    if (childDom.nodeType === 1 || childDom.nodeType === 3) {
      children.push(domToVnode(childDom));
    }
  }
  let props = {};
  for (let i = 0, l = dom.attributes.length; i < l; i++) {
    let attr = dom.attributes[i];
    props[attr.nodeName] = attr.nodeValue;
  }
  let vnode = new Vnode(dom.tagName.toLowerCase(), props, children);
  vnode.dom = dom;
  return vnode;
}
function trust(htmlString) {
  let div = createDomElement("div");
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
  for (let callback of set) {
    callback();
  }
  set.clear();
}
var eventListenerNames = {};
function eventListener(e) {
  current.event = e;
  let dom = e.target;
  let name = `v-on${e.type}`;
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
  let value = test ? bool : !bool;
  if (value) {
    let newdom = document.createTextNode("");
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
  "v-if": hideDirective(false),
  "v-unless": hideDirective(true),
  "v-for": (set, vnode) => {
    let newChildren = [];
    let callback = vnode.children[0];
    for (let i = 0, l = set.length; i < l; i++) {
      newChildren.push(callback(set[i], i));
    }
    vnode.children = newChildren;
  },
  "v-show": (bool, vnode) => {
    vnode.dom.style.display = bool ? "" : "none";
  },
  "v-class": (classes, vnode) => {
    for (let name in classes) {
      vnode.dom.classList.toggle(name, classes[name]);
    }
  },
  "v-html": (html, vnode) => {
    vnode.children = [trust(html)];
  },
  "v-model": ([model, property, event], vnode, oldVnode) => {
    let value;
    let handler = (e) => model[property] = e.target.value;
    if (vnode.tag === "input") {
      event = event || "oninput";
      switch (vnode.props.type) {
        case "checkbox": {
          if (Array.isArray(model[property])) {
            handler = (e) => {
              let val = e.target.value;
              let idx = model[property].indexOf(val);
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
          let val = e.target.value;
          if (e.ctrlKey) {
            let idx = model[property].indexOf(val);
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
            let value2 = "value" in child.props ? child.props.value : child.children.join("").trim();
            child.props.selected = model[property].indexOf(value2) !== -1;
          }
        });
      } else {
        vnode.children.forEach((child) => {
          if (child.tag === "option") {
            let value2 = "value" in child.props ? child.props.value : child.children.join("").trim();
            child.props.selected = value2 === model[property];
          }
        });
      }
    } else if (vnode.tag === "textarea") {
      event = event || "oninput";
      vnode.children = [model[property]];
    }
    let prevHandler = vnode.props[event];
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
  "v-create": (callback, vnode, oldVnode) => {
    if (!oldVnode) {
      let cleanup = callback(vnode);
      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },
  "v-update": (callback, vnode, oldVnode) => {
    if (oldVnode) {
      let cleanup = callback(vnode, oldVnode);
      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },
  "v-cleanup": (callback, vnode, oldVnode) => {
    onCleanup(() => callback(vnode, oldVnode));
  }
};
function directive(name, directive2) {
  let directiveName = `v-${name}`;
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
  if (name in newVnode.dom && newVnode.isSVG === false) {
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
  if (name in reservedProps) {
    return;
  }
  newVnode.props[name] = value;
  sharedSetAttribute(name, value, newVnode, oldVnode);
}
function updateAttributes(newVnode, oldVnode) {
  if (oldVnode) {
    for (let name in oldVnode.props) {
      if (name in newVnode.props === false && name in eventListenerNames === false && name in reservedProps === false) {
        if (name in newVnode.dom && newVnode.isSVG === false) {
          newVnode.dom[name] = null;
        } else {
          newVnode.dom.removeAttribute(name);
        }
      }
    }
  }
  for (let name in newVnode.props) {
    if (name in reservedProps) {
      if (name in directives && directives[name](newVnode.props[name], newVnode, oldVnode) === false) {
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
  let newTree = newVnode.children;
  let oldTree = oldVnode?.children || [];
  let oldTreeLength = oldTree.length;
  if (oldTreeLength && newTree[0] instanceof Vnode && "key" in newTree[0].props && "key" in oldTree[0].props) {
    let newTreeLength = newTree.length;
    let oldKeyedList = {};
    for (let i = 0; i < oldTreeLength; i++) {
      oldKeyedList[oldTree[i].props.key] = i;
    }
    let newKeyedList = {};
    for (let i = 0; i < newTreeLength; i++) {
      newKeyedList[newTree[i].props.key] = i;
    }
    for (let i = 0; i < newTreeLength; i++) {
      let newChild = newTree[i];
      let oldChild = oldTree[oldKeyedList[newChild.props.key]];
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
      if (!newVnode.dom.childNodes[i]) {
        newVnode.dom.appendChild(newChild.dom);
      } else if (newVnode.dom.childNodes[i] !== newChild.dom) {
        newVnode.dom.replaceChild(newChild.dom, newVnode.dom.childNodes[i]);
      }
      shouldPatch && patch(newChild, oldChild);
    }
    for (let i = newTreeLength; i < oldTreeLength; i++) {
      if (!newKeyedList[oldTree[i].props.key]) {
        oldTree[i].dom.parentNode && oldTree[i].dom.parentNode.removeChild(oldTree[i].dom);
      }
    }
    return;
  }
  if (newTree.length === 0) {
    newVnode.dom.textContent = "";
    return;
  }
  current.vnode = newVnode;
  current.oldVnode = oldVnode;
  for (let i = 0; i < newTree.length; i++) {
    let newChild = newTree[i];
    if (newChild instanceof Vnode) {
      if (typeof newChild.tag !== "string") {
        current.component = newChild.tag;
        newTree.splice(
          i--,
          1,
          ("view" in newChild.tag ? newChild.tag.view.bind(newChild.tag) : newChild.tag.bind(newChild.tag))(
            newChild.props,
            ...newChild.children
          )
        );
      }
      continue;
    }
    if (Array.isArray(newChild)) {
      newTree.splice(i--, 1, ...newChild);
      continue;
    }
    if (newChild === null || newChild === void 0) {
      newTree.splice(i--, 1);
      continue;
    }
    newTree[i] = new Vnode(textTag, {}, [newChild]);
  }
  for (let i = 0; i < newTree.length; i++) {
    let newChild = newTree[i];
    if (newChild.tag === textTag) {
      if (i >= oldTreeLength) {
        newChild.dom = document.createTextNode(newChild.children[0]);
        newVnode.dom.appendChild(newChild.dom);
        continue;
      }
      let oldChild2 = oldTree[i];
      if (oldChild2.tag !== textTag) {
        newChild.dom = document.createTextNode(newChild.children[0]);
        newVnode.dom.replaceChild(newChild.dom, oldChild2.dom);
        continue;
      }
      newChild.dom = oldChild2.dom;
      if (newChild.children[0] != oldChild2.dom.textContent) {
        oldChild2.dom.textContent = newChild.children[0];
      }
      continue;
    }
    newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";
    if (i >= oldTreeLength) {
      newChild.dom = createDomElement(newChild.tag, newChild.isSVG);
      updateAttributes(newChild);
      newVnode.dom.appendChild(newChild.dom);
      patch(newChild);
      continue;
    }
    let oldChild = oldTree[i];
    if (newChild.tag !== oldChild.tag) {
      newChild.dom = createDomElement(newChild.tag, newChild.isSVG);
      updateAttributes(newChild);
      newVnode.dom.replaceChild(newChild.dom, oldChild.dom);
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
  for (let i = newTree.length; i < oldTreeLength; i++) {
    newVnode.dom.removeChild(oldTree[i].dom);
  }
}
function update() {
  if (mainVnode) {
    callSet(onCleanupSet);
    let oldMainVnode = mainVnode;
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
    let result = update();
    callSet(onUnmountSet);
    for (let name in eventListenerNames) {
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
  let container = typeof dom === "string" ? isNodeJs ? createDomElement(dom, dom === "svg") : document.querySelectorAll(dom)[0] : dom;
  let vnodeComponent = isVnodeComponent(component) ? component : isComponent(component) ? new Vnode(component, {}, []) : new Vnode(() => component, {}, []);
  if (mainComponent && mainComponent.tag !== vnodeComponent.tag) {
    unmount();
  }
  mainComponent = vnodeComponent;
  mainVnode = domToVnode(container);
  return update();
}
var v = (tagOrComponent, props = {}, ...children) => {
  return new Vnode(tagOrComponent, props || {}, children);
};
v.fragment = (_, ...children) => children;
