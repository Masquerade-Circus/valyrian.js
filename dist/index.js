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
  VnodeComponent: () => VnodeComponent,
  VnodeText: () => VnodeText,
  v: () => v
});
module.exports = __toCommonJS(lib_exports);
var current = {};
var onCleanupList = [];
var onMountList = [];
var onUpdateList = [];
var onUnmountList = [];
var emptyComponent = () => "";
var eventListenerNames = {};
function eventListener(e) {
  let dom = e.target;
  let name = `v-on${e.type}`;
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
var reservedProps = {
  key: true,
  state: true,
  oncreate: true,
  onupdate: true,
  onremove: true,
  shouldupdate: true,
  "v-once": true,
  "v-if": true,
  "v-unless": true,
  "v-for": true,
  "v-show": true,
  "v-class": true,
  "v-html": true,
  "v-model": true
};
function createDomElement(tag, isSVG = false) {
  return isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
}
var Vnode = function Vnode2(tag, props, children) {
  this.tag = tag;
  this.props = props;
  this.children = children;
};
var VnodeText = function VnodeText2(nodeValue) {
  this.nodeValue = nodeValue;
};
var VnodeComponent = function VnodeComponent2(component, props, children) {
  this.component = component;
  this.props = props;
  this.children = children;
};
function domToVnode(dom) {
  let children = [];
  for (let i = 0; i < dom.childNodes.length; i++) {
    let childDom = dom.childNodes[i];
    if (childDom.nodeType === 3) {
      let vnode2 = new VnodeText(childDom.nodeValue);
      vnode2.dom = childDom;
      children.push(vnode2);
      continue;
    }
    if (childDom.nodeType === 1) {
      children.push(domToVnode(childDom));
    }
  }
  let props = {};
  for (let i = 0; i < dom.attributes.length; i++) {
    let attr = dom.attributes[i];
    props[attr.nodeName] = attr.nodeValue;
  }
  let vnode = new Vnode(dom.tagName.toLowerCase(), props, children);
  vnode.dom = dom;
  return vnode;
}
var v = (tagOrComponent, props, ...children) => {
  if (typeof tagOrComponent === "string") {
    return new Vnode(tagOrComponent, props || {}, children);
  }
  return new VnodeComponent(tagOrComponent, props || {}, children);
};
v.fragment = (props, ...vnodes) => {
  return vnodes;
};
v.trust = (htmlString) => {
  let div = createDomElement("div");
  div.innerHTML = htmlString.trim();
  return [].map.call(div.childNodes, (item) => domToVnode(item));
};
v.isVnode = (object) => {
  return object instanceof Vnode;
};
v.isVnodeComponent = (object) => {
  return object instanceof VnodeComponent;
};
v.isValyrianComponent = (component) => {
  return Boolean(component && typeof component === "object" && "view" in component);
};
v.isComponent = (component) => {
  return Boolean(component && typeof component === "function" || v.isValyrianComponent(component) || v.isVnodeComponent(component));
};
v.onCleanup = (callback) => {
  if (onCleanupList.indexOf(callback) === -1) {
    onCleanupList.push(callback);
  }
};
v.onUnmount = (callback) => {
  if (onUnmountList.indexOf(callback) === -1) {
    onUnmountList.push(callback);
  }
};
v.onMount = (callback) => {
  if (onMountList.indexOf(callback) === -1) {
    onMountList.push(callback);
  }
};
v.onUpdate = (callback) => {
  if (onUpdateList.indexOf(callback) === -1) {
    onUpdateList.push(callback);
  }
};
function callCallbackList(list) {
  for (let i = 0; i < list.length; i++) {
    list[i]();
  }
  list.length = 0;
}
function sharedSetAttribute(prop, newVnode, oldVnode) {
  if (reservedProps[prop]) {
    if (directives[prop]) {
      return directives[prop](newVnode.props[prop], newVnode, oldVnode);
    }
    return;
  }
  let value = newVnode.props[prop];
  let dom = newVnode.dom;
  if (typeof value === "function") {
    if (!eventListenerNames[prop]) {
      v.mainVnode.dom.addEventListener(prop.slice(2), eventListener);
      eventListenerNames[prop] = true;
    }
    dom[`v-${prop}`] = value;
    return;
  }
  if (prop in dom && !newVnode.isSVG) {
    if (dom[prop] != value) {
      dom[prop] = value;
    }
    return;
  }
  if (!oldVnode || value !== oldVnode.props[prop]) {
    if (value === false) {
      dom.removeAttribute(prop);
    } else {
      dom.setAttribute(prop, value);
    }
  }
}
function setAttribute(name, value, vnode, oldVnode) {
  vnode.props[name] = value;
  sharedSetAttribute(name, vnode, oldVnode);
}
function setAttributes(newVnode, oldVnode) {
  for (let prop in newVnode.props) {
    if (sharedSetAttribute(prop, newVnode, oldVnode) === false) {
      return;
    }
  }
  if (oldVnode) {
    for (let name in oldVnode.props) {
      if (name in newVnode.props === false && typeof oldVnode.props[name] !== "function" && !reservedProps[name]) {
        if (name in newVnode.dom && newVnode.isSVG === false) {
          newVnode.dom[name] = null;
        } else {
          newVnode.dom.removeAttribute(name);
        }
      }
    }
  }
}
var callRemove = (vnode) => {
  for (let i = 0, l = vnode.children.length; i < l; i++) {
    vnode.children[i] instanceof Vnode && callRemove(vnode.children[i]);
  }
  vnode.props.onremove && vnode.props.onremove(vnode);
};
v.patch = (newParentVnode, oldParentVnode) => {
  let oldTree = oldParentVnode?.children || [];
  let newTree = newParentVnode.children;
  let oldTreeLength = oldTree.length;
  current.vnode = newParentVnode;
  current.oldVnode = oldParentVnode;
  if (newTree[0] instanceof Vnode && oldTree[0] instanceof Vnode && "key" in newTree[0].props && "key" in oldTree[0].props) {
    let newTreeLength2 = newTree.length;
    let oldKeyedList = {};
    for (let i = 0; i < oldTreeLength; i++) {
      oldKeyedList[oldTree[i].props.key] = i;
    }
    let newKeyedList = {};
    for (let i = 0; i < newTreeLength2; i++) {
      newKeyedList[newTree[i].props.key] = i;
    }
    for (let i = 0; i < newTreeLength2; i++) {
      let childVnode = newTree[i];
      let oldChildVnode = oldTree[oldKeyedList[childVnode.props.key]];
      let shouldPatch = true;
      if (oldChildVnode) {
        childVnode.dom = oldChildVnode.dom;
        if (childVnode.props["v-once"] || childVnode.props.shouldupdate && childVnode.props.shouldupdate(childVnode, oldChildVnode) === false) {
          childVnode.children = oldChildVnode.children;
          shouldPatch = false;
        } else {
          setAttributes(childVnode, oldChildVnode);
          if (v.isMounted) {
            childVnode.props.onupdate && childVnode.props.onupdate(childVnode, oldChildVnode);
          } else {
            childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
          }
        }
      } else {
        childVnode.dom = createDomElement(childVnode.tag, childVnode.isSVG);
        setAttributes(childVnode);
        childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
      }
      if (!newParentVnode.dom.childNodes[i]) {
        newParentVnode.dom.appendChild(childVnode.dom);
      } else if (newParentVnode.dom.childNodes[i] !== childVnode.dom) {
        oldTree[i] && !newKeyedList[oldTree[i].props.key] && callRemove(oldTree[i]);
        newParentVnode.dom.replaceChild(childVnode.dom, newParentVnode.dom.childNodes[i]);
      }
      shouldPatch && v.patch(childVnode, oldChildVnode);
    }
    for (let i = newTreeLength2; i < oldTreeLength; i++) {
      if (!newKeyedList[oldTree[i].props.key]) {
        let oldChildVnode = oldTree[i];
        callRemove(oldChildVnode);
        oldChildVnode.dom.parentNode && oldChildVnode.dom.parentNode.removeChild(oldChildVnode.dom);
      }
    }
    return;
  }
  for (let i = 0; i < newTree.length; i++) {
    let childVnode = newTree[i];
    if (childVnode instanceof Vnode) {
      let oldChildVnode2 = oldTree[i];
      childVnode.isSVG = newParentVnode.isSVG || childVnode.tag === "svg";
      if (!oldChildVnode2) {
        childVnode.dom = createDomElement(childVnode.tag, childVnode.isSVG);
        setAttributes(childVnode);
        childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
        v.patch(childVnode);
        newParentVnode.dom.appendChild(childVnode.dom);
        continue;
      }
      if (childVnode.tag === oldChildVnode2.tag) {
        childVnode.dom = oldChildVnode2.dom;
        if (childVnode.props["v-once"] || childVnode.props.shouldupdate && childVnode.props.shouldupdate(childVnode, oldChildVnode2) === false) {
          childVnode.children = oldChildVnode2.children;
          continue;
        }
        setAttributes(childVnode, oldChildVnode2);
        if (v.isMounted) {
          childVnode.props.onupdate && childVnode.props.onupdate(childVnode, oldChildVnode2);
        } else {
          childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
        }
        v.patch(childVnode, oldChildVnode2);
        continue;
      }
      childVnode.dom = createDomElement(childVnode.tag, childVnode.isSVG);
      setAttributes(childVnode);
      childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
      oldChildVnode2 instanceof Vnode && callRemove(oldChildVnode2);
      newParentVnode.dom.replaceChild(childVnode.dom, oldChildVnode2.dom);
      v.patch(childVnode);
      continue;
    }
    if (childVnode === null || childVnode === void 0) {
      newTree.splice(i--, 1);
      continue;
    }
    if (Array.isArray(childVnode)) {
      newTree.splice(i--, 1, ...childVnode);
      continue;
    }
    if (childVnode instanceof VnodeComponent) {
      current.component = childVnode.component;
      newTree.splice(
        i--,
        1,
        (childVnode.component.view ? childVnode.component.view.bind(childVnode.component) : childVnode.component.bind(childVnode.component))(
          childVnode.props,
          ...childVnode.children
        )
      );
      continue;
    }
    if (childVnode instanceof VnodeText === false) {
      newTree[i] = childVnode = new VnodeText(String(childVnode));
    }
    if (newTree[i - 1] instanceof VnodeText) {
      newTree[i - 1].dom.nodeValue += childVnode.nodeValue;
      newTree[i - 1].nodeValue += childVnode.nodeValue;
      newTree.splice(i--, 1);
      continue;
    }
    let oldChildVnode = oldTree[i];
    if (!oldChildVnode) {
      childVnode.dom = document.createTextNode(childVnode.nodeValue);
      newParentVnode.dom.appendChild(childVnode.dom);
      continue;
    }
    if (oldChildVnode instanceof VnodeText) {
      childVnode.dom = oldChildVnode.dom;
      if (childVnode.nodeValue != childVnode.dom.nodeValue) {
        childVnode.dom.nodeValue = childVnode.nodeValue;
      }
      continue;
    }
    childVnode.dom = document.createTextNode(childVnode.nodeValue);
    callRemove(oldChildVnode);
    newParentVnode.dom.replaceChild(childVnode.dom, oldChildVnode.dom);
  }
  let newTreeLength = newTree.length;
  if (newTreeLength === 0) {
    for (let i = oldTreeLength; i--; ) {
      oldTree[i] instanceof Vnode && callRemove(oldTree[i]);
    }
    newParentVnode.dom.textContent = "";
    return;
  }
  for (let i = oldTreeLength - 1; i >= newTreeLength; --i) {
    oldTree[i] instanceof Vnode && callRemove(oldTree[i]);
    oldTree[i].dom.parentNode && oldTree[i].dom.parentNode.removeChild(oldTree[i].dom);
  }
};
v.update = () => {
  if (v.mainVnode) {
    onCleanupList.length && callCallbackList(onCleanupList);
    let oldMainVnode = v.mainVnode;
    let newMainVnode = new Vnode(oldMainVnode.tag, oldMainVnode.props, [
      v.component instanceof VnodeComponent ? v.component : v(v.component, null)
    ]);
    newMainVnode.dom = oldMainVnode.dom;
    newMainVnode.isSVG = oldMainVnode.isSVG;
    v.mainVnode = newMainVnode;
    v.patch(newMainVnode, oldMainVnode);
    if (v.isMounted === false) {
      onMountList.length && callCallbackList(onMountList);
      v.isMounted = true;
    } else {
      onUpdateList.length && callCallbackList(onUpdateList);
    }
    if (v.isNodeJs) {
      return newMainVnode.dom.innerHTML;
    }
  }
};
v.unmount = () => {
  if (v.mainVnode) {
    onCleanupList.length && callCallbackList(onCleanupList);
    onUnmountList.length && callCallbackList(onUnmountList);
    v.component = emptyComponent;
    let result = v.update();
    v.mainVnode = null;
    v.component = null;
    v.isMounted = false;
    return result;
  }
};
v.mount = (container, component) => {
  if (v.isMounted) {
    v.unmount();
  }
  let mainContainer;
  if (v.isNodeJs) {
    mainContainer = typeof container === "string" ? createDomElement(container, container === "svg") : container;
  } else {
    mainContainer = typeof container === "string" ? document.querySelectorAll(container)[0] : container;
  }
  v.mainVnode = domToVnode(mainContainer);
  v.mainVnode.isSVG = v.mainVnode.tag === "svg";
  v.component = component;
  return v.update();
};
var plugins = /* @__PURE__ */ new Map();
v.use = (plugin, options) => {
  if (plugins.has(plugin)) {
    return plugins.get(plugin);
  }
  let result = plugin(v, options);
  plugins.set(plugin, result);
  return result;
};
var hideDirective = (test) => (bool, vnode, oldnode) => {
  let value = test ? bool : !bool;
  if (value) {
    let newdom = document.createTextNode("");
    if (oldnode && oldnode.dom && oldnode.dom.parentNode) {
      oldnode instanceof Vnode && callRemove(oldnode);
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
    vnode.children = set.map(vnode.children[0]);
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
    vnode.children = [v.trust(html)];
  },
  "v-model": ([model, property, event], vnode, oldVnode) => {
    let value;
    let handler;
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
          setAttribute("checked", value, vnode, oldVnode);
          break;
        }
        case "radio": {
          setAttribute("checked", model[property] === vnode.dom.value, vnode, oldVnode);
          break;
        }
        default: {
          setAttribute("value", model[property], vnode, oldVnode);
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
    if (!vnode.props[event]) {
      if (!handler) {
        handler = (e) => model[property] = e.target.value;
      }
      setAttribute(event, handler, vnode, oldVnode);
    }
  }
};
v.directive = (name, directive) => {
  let fullName = `v-${name}`;
  directives[fullName] = directive;
  reservedProps[fullName] = true;
};
v.isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);
v.isMounted = false;
v.component = null;
v.mainVnode = null;
v.directives = directives;
v.reservedProps = reservedProps;
v.current = current;
v.setAttribute = setAttribute;
