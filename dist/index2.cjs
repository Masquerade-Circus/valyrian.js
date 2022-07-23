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

// lib/index2.ts
var index2_exports = {};
__export(index2_exports, {
  default: () => index2_default
});
module.exports = __toCommonJS(index2_exports);
var NodeValueString = "nodeValue";
var TextTagString = "#text";
var isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);
var elementsToClone = {
  svg: {},
  notSvg: {}
};
function createDomElement(tag, isSVG = false) {
  if (isSVG) {
    if (!elementsToClone.svg[tag]) {
      elementsToClone.svg[tag] = document.createElementNS("http://www.w3.org/2000/svg", tag);
    }
    return elementsToClone.svg[tag].cloneNode(false);
  }
  if (!elementsToClone.notSvg[tag]) {
    elementsToClone.notSvg[tag] = document.createElement(tag);
  }
  return elementsToClone.notSvg[tag].cloneNode(false);
}
var Vnode = function Vnode2(tag, props, children) {
  this.props = props;
  this.children = children;
  this.tag = tag;
};
function domToVnode(dom) {
  if (dom.nodeType === 3) {
    let vnode = new Vnode(TextTagString, {}, []);
    vnode.dom = dom;
    vnode.nodeValue = dom.nodeValue;
    return vnode;
  }
  if (dom.nodeType === 1) {
    let children = [];
    for (let i = 0; i < dom.childNodes.length; i++) {
      let child = domToVnode(dom.childNodes[i]);
      if (child) {
        children.push(child);
      }
    }
    let props = {};
    [].forEach.call(dom.attributes, (prop) => props[prop.nodeName] = prop.nodeValue);
    let vnode = new Vnode(dom.tagName.toLowerCase(), props, children);
    vnode.dom = dom;
    return vnode;
  }
}
var trust = (htmlString) => {
  let div = createDomElement("div");
  div.innerHTML = htmlString.trim();
  return [].map.call(div.childNodes, (item) => domToVnode(item));
};
var v = function(tagOrComponent, props, ...children) {
  if (typeof tagOrComponent === "string") {
    return new Vnode(tagOrComponent, props || {}, children);
  }
  let vnode = new Vnode("#component", props || {}, children);
  vnode.view = tagOrComponent;
  return vnode;
};
v.fragment = function(props, ...children) {
  return children;
};
v.isVnode = function isVnode(object) {
  return Boolean(object && typeof object === "object" && "tag" in object);
};
v.isComponent = function isComponent(component) {
  return Boolean(component && typeof component === "function" || v.isValyrianComponent(component));
};
v.isValyrianComponent = function isValyrianComponent(component) {
  return Boolean(component && typeof component === "object" && "view" in component);
};
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
var onCleanupList = [];
var onMountList = [];
var onUpdateList = [];
var onUnmountList = [];
function onCleanup(callback) {
  if (onCleanupList.indexOf(callback) === -1) {
    onCleanupList.push(callback);
  }
}
function onUnmount(callback) {
  if (onUnmountList.indexOf(callback) === -1) {
    onUnmountList.push(callback);
  }
}
function onMount(callback) {
  if (onMountList.indexOf(callback) === -1) {
    onMountList.push(callback);
  }
}
function onUpdate(callback) {
  if (onUpdateList.indexOf(callback) === -1) {
    onUpdateList.push(callback);
  }
}
function callCallbackList(list) {
  for (let i = 0; i < list.length; i++) {
    list[i]();
  }
  list.length = 0;
}
var current = {};
function sharedSetAttribute(prop, vnode, oldVnode) {
  if (reservedProps[prop]) {
    if (directives[prop]) {
      return directives[prop](vnode.props[prop], vnode, oldVnode);
    }
    return;
  }
  let value = vnode.props[prop];
  if (typeof value === "function") {
    if (prop in eventListenerNames === false) {
      eventListenerNames[prop] = true;
      v.container.addEventListener(prop.slice(2), eventListener);
    }
    vnode.dom[`v-${prop}`] = value;
    return;
  }
  if (prop in vnode.dom && vnode.isSVG === false) {
    if (vnode.dom[prop] != value) {
      vnode.dom[prop] = value;
    }
    return;
  }
  if (!oldVnode || oldVnode.props[prop] !== value) {
    if (value === false) {
      vnode.dom.removeAttribute(prop);
    } else {
      vnode.dom.setAttribute(prop, value);
    }
  }
}
function setAttribute(name, value, vnode, oldVnode) {
  vnode.props[name] = value;
  sharedSetAttribute(name, vnode, oldVnode);
}
function setAttributes(vnode, oldVnode) {
  for (let prop in vnode.props) {
    if (sharedSetAttribute(prop, vnode, oldVnode) === false) {
      break;
    }
  }
  if (oldVnode) {
    for (let prop in oldVnode.props) {
      if (prop in vnode.props === false && prop in reservedProps === false && typeof oldVnode.props[prop] !== "function") {
        if (prop in vnode.dom && vnode.isSVG === false) {
          vnode.dom[prop] = null;
        } else {
          vnode.dom.removeAttribute(prop);
        }
      }
    }
  }
}
function callRemove(vnode) {
  for (let i = 0, l = vnode.children.length; i < l; i++) {
    NodeValueString in vnode.children[i] === false && callRemove(vnode.children[i]);
  }
  vnode.props.onremove && vnode.props.onremove(vnode);
}
function patch(newVnode, oldVnode) {
  v.current.vnode = newVnode;
  v.current.oldVnode = oldVnode;
  let newTree = newVnode.children;
  let oldTree = oldVnode?.children || [];
  for (let i = 0; i < newTree.length; i++) {
    let childVnode = newTree[i];
    if (childVnode instanceof Vnode) {
      if ("view" in childVnode) {
        v.current.component = childVnode.view;
        newTree.splice(i--, 1, childVnode.view(childVnode.props, ...childVnode.children));
        continue;
      }
      childVnode.isSVG = newVnode.isSVG || childVnode.tag === "svg";
      continue;
    }
    if (Array.isArray(childVnode)) {
      newTree.splice(i--, 1, ...childVnode);
      continue;
    }
    if (childVnode === null || childVnode === void 0) {
      newTree.splice(i--, 1);
      continue;
    }
    newTree[i] = new Vnode(TextTagString, {}, []);
    newTree[i].nodeValue = childVnode;
  }
  let oldTreeLength = oldTree.length;
  let newTreeLength = newTree.length;
  if (newTreeLength === 0) {
    for (let i = oldTreeLength - 1; i >= 0; i--) {
      let oldChild = oldTree[i];
      NodeValueString in oldChild === false && callRemove(oldChild);
      newVnode.dom.textContent = "";
    }
    return;
  }
  if (oldTreeLength && "key" in newTree[0].props && "key" in oldTree[0].props) {
    let oldKeyedList = {};
    for (let i = 0; i < oldTreeLength; i++) {
      oldKeyedList[oldTree[i].props.key] = i;
    }
    let newKeyedList = {};
    for (let i = 0; i < newTreeLength; i++) {
      newKeyedList[newTree[i].props.key] = i;
    }
    for (let i = 0; i < newTreeLength; i++) {
      let childVnode = newTree[i];
      let oldChildVnode = oldTree[oldKeyedList[childVnode.props.key]];
      let shouldPatch = true;
      if (oldChildVnode) {
        childVnode.dom = oldChildVnode.dom;
        if ("v-once" in childVnode.props || childVnode.props.shouldupdate && childVnode.props.shouldupdate(childVnode, oldChildVnode) === false) {
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
      if (!newVnode.dom.childNodes[i]) {
        newVnode.dom.appendChild(childVnode.dom);
      } else if (newVnode.dom.childNodes[i] !== childVnode.dom) {
        oldTree[i] && !newKeyedList[oldTree[i].props.key] && callRemove(oldTree[i]);
        newVnode.dom.replaceChild(childVnode.dom, newVnode.dom.childNodes[i]);
      }
      shouldPatch && patch(childVnode, oldChildVnode);
    }
    for (let i = newTreeLength; i < oldTreeLength; i++) {
      if (!newKeyedList[oldTree[i].props.key]) {
        let oldChildVnode = oldTree[i];
        callRemove(oldChildVnode);
        oldChildVnode.dom.parentNode && oldChildVnode.dom.parentNode.removeChild(oldChildVnode.dom);
      }
    }
    return;
  }
  for (let i = 0; i < newTreeLength; i++) {
    let newChild = newTree[i];
    let oldChild = oldTree[i];
    if (!oldChild) {
      if (NodeValueString in newChild) {
        newChild.dom = document.createTextNode(newChild.nodeValue);
      } else {
        newChild.dom = createDomElement(newChild.tag, newChild.isSVG);
        setAttributes(newChild);
        newChild.props.oncreate && newChild.props.oncreate(newChild);
        patch(newChild);
      }
      newVnode.dom.appendChild(newChild.dom);
      continue;
    }
    if (NodeValueString in newChild) {
      if (NodeValueString in oldChild) {
        newChild.dom = oldChild.dom;
        if (newChild.dom.nodeValue != newChild.nodeValue) {
          newChild.dom.nodeValue = newChild.nodeValue;
        }
        continue;
      }
      newChild.dom = document.createTextNode(newChild.nodeValue);
      NodeValueString in oldChild === false && callRemove(oldChild);
      newVnode.dom.replaceChild(newChild.dom, oldChild.dom);
      continue;
    }
    if (oldChild.tag !== newChild.tag) {
      newChild.dom = createDomElement(newChild.tag);
      NodeValueString in oldChild === false && callRemove(oldChild);
      setAttributes(newChild);
      newVnode.dom.replaceChild(newChild.dom, oldChild.dom);
      newChild.props.oncreate && newChild.props.oncreate(newChild);
      patch(newChild, oldChild);
      continue;
    }
    newChild.dom = oldChild.dom;
    if ("v-once" in newChild.props || "shouldupdate" in newChild.props && newChild.props.shouldupdate(oldChild, newChild) === false) {
      newChild.children = oldChild.children;
      continue;
    }
    setAttributes(newChild, oldChild);
    if (v.isMounted) {
      newChild.props.onupdate && newChild.props.onupdate(newChild, oldChild);
    } else {
      newChild.props.oncreate && newChild.props.oncreate(newChild);
    }
    patch(newChild, oldChild);
  }
  for (let i = newTreeLength; i < oldTreeLength; i++) {
    let oldChild = oldTree[i];
    NodeValueString in oldChild === false && callRemove(oldChild);
    oldChild.dom.parentNode && oldChild.dom.parentNode.removeChild(oldChild.dom);
  }
}
function update() {
  if (v.component && v.mainVnode) {
    onCleanupList.length && callCallbackList(onCleanupList);
    let oldVnode = v.mainVnode;
    v.mainVnode = new Vnode(oldVnode.tag, oldVnode.props, [v.component]);
    v.mainVnode.dom = oldVnode.dom;
    patch(v.mainVnode, oldVnode);
    oldVnode = null;
    if (v.isMounted === false) {
      onMountList.length && callCallbackList(onMountList);
      v.isMounted = true;
    } else {
      onUpdateList.length && callCallbackList(onUpdateList);
    }
    if (isNodeJs) {
      return v.mainVnode.dom.innerHTML;
    }
  }
}
function unmount() {
  if (v.component && v.mainVnode) {
    onCleanupList.length && callCallbackList(onCleanupList);
    onUnmountList.length && callCallbackList(onUnmountList);
    let oldVnode = v.mainVnode;
    v.mainVnode = new Vnode(oldVnode.tag, oldVnode.props, []);
    v.mainVnode.dom = oldVnode.dom;
    patch(v.mainVnode, oldVnode);
    let container = v.mainVnode.dom;
    v.container = null;
    v.component = null;
    v.isMounted = false;
    v.mainVnode = void 0;
    if (isNodeJs) {
      return container.innerHTML;
    }
  }
}
function mount(container, normalComponent) {
  if (v.isMounted) {
    v.unmount();
  }
  if (isNodeJs) {
    v.container = typeof container === "string" ? createDomElement(container === "svg" ? "svg" : "div", container === "svg") : container;
  } else {
    v.container = typeof container === "string" ? document.querySelectorAll(container)[0] : container;
  }
  if (normalComponent && typeof normalComponent === "object" && normalComponent.view) {
    v.component = v(normalComponent.view.bind(normalComponent), normalComponent.props || {}, ..."children" in normalComponent ? Array.isArray(normalComponent.children) ? normalComponent.children : [normalComponent.children] : []);
  } else {
    v.component = v(normalComponent.bind(normalComponent), normalComponent.props || {}, "children" in normalComponent ? Array.isArray(normalComponent.children) ? normalComponent.children : [normalComponent.children] : []);
  }
  v.mainVnode = domToVnode(v.container);
  v.mainVnode.isSVG = v.mainVnode.tag === "svg";
  return update();
}
var plugins = /* @__PURE__ */ new Map();
function use(plugin, options) {
  if (plugins.has(plugin)) {
    return plugins.get(plugin);
  }
  let result = plugin(v, options);
  plugins.set(plugin, result);
  return result;
}
function directive(name, directive2) {
  let fullName = `v-${name}`;
  directives[fullName] = directive2;
  reservedProps[fullName] = true;
}
function hideDirective(test) {
  return (bool, vnode, oldVnode) => {
    let value = test ? bool : !bool;
    if (value) {
      let newdom = document.createTextNode("");
      if (oldVnode && oldVnode.dom && oldVnode.dom.parentNode) {
        NodeValueString in oldVnode === false && callRemove(oldVnode);
        oldVnode.dom.parentNode.replaceChild(newdom, oldVnode.dom);
      }
      vnode.tag = TextTagString;
      vnode.children = [];
      vnode.props = {};
      vnode.dom = newdom;
      return false;
    }
  };
}
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
    vnode.children = [trust(html)];
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
v.isNodeJs = isNodeJs;
v.isMounted = false;
v.directives = directives;
v.directive = directive;
v.reservedProps = reservedProps;
v.mount = mount;
v.unmount = unmount;
v.update = update;
v.use = use;
v.trust = trust;
v.setAttribute = setAttribute;
v.current = current;
v.onCleanup = onCleanup;
v.onUnmount = onUnmount;
v.onMount = onMount;
v.onUpdate = onUpdate;
var index2_default = v;
