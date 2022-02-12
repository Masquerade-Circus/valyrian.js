var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, copyDefault, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && (copyDefault || key !== "default"))
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toCommonJS = /* @__PURE__ */ ((cache) => {
  return (module2, temp) => {
    return cache && cache.get(module2) || (temp = __reExport(__markAsModule({}), module2, 1), cache && cache.set(module2, temp), temp);
  };
})(typeof WeakMap !== "undefined" ? /* @__PURE__ */ new WeakMap() : 0);

// lib/index.ts
var lib_exports = {};
__export(lib_exports, {
  Vnode: () => Vnode,
  directive: () => directive,
  isComponent: () => isComponent,
  isNodeJs: () => isNodeJs,
  isVnode: () => isVnode,
  isVnodeComponent: () => isVnodeComponent,
  mount: () => mount,
  onCleanup: () => onCleanup,
  onMount: () => onMount,
  onUnmount: () => onUnmount,
  onUpdate: () => onUpdate,
  setProperty: () => setProperty,
  trust: () => trust,
  unmount: () => unmount,
  update: () => update,
  v: () => v
});
var Vnode = function Vnode2(tag, props, children) {
  this.props = props;
  this.children = children;
  this.tag = tag;
};
function isVnode(component) {
  return component instanceof Vnode;
}
function isComponent(component) {
  return typeof component === "function" || typeof component === "object" && component !== null && "view" in component;
}
function isVnodeComponent(vnode) {
  return vnode instanceof Vnode && vnode.tag === "__component__";
}
var isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);
function createDomElement(tag, isSVG = false) {
  return isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
}
function domToVnode(dom) {
  let vnode = v(dom.tagName.toLowerCase(), {}, ...Array.from(dom.childNodes).filter((child) => child.nodeType === 1 || child.nodeType === 3).map((child) => {
    if (child.nodeType === 1) {
      return domToVnode(child);
    }
    let text = new Vnode("#text", {}, []);
    text.nodeValue = String(child.nodeValue);
    text.dom = child;
    return text;
  }));
  [].forEach.call(dom.attributes, (prop) => vnode.props[prop.nodeName] = prop.nodeValue);
  vnode.dom = dom;
  return vnode;
}
var trust = (htmlString) => {
  let div = createDomElement("div");
  div.innerHTML = htmlString.trim();
  return [].map.call(div.childNodes, (item) => domToVnode(item));
};
var ValyrianSymbol = Symbol("Valyrian");
function onCleanup(callback) {
  if (v.current.app?.onCleanup.indexOf(callback) === -1) {
    v.current.app?.onCleanup.push(callback);
  }
}
function onUnmount(callback) {
  if (v.current.app?.onUnmount.indexOf(callback) === -1) {
    v.current.app?.onUnmount.push(callback);
  }
}
function onMount(callback) {
  if (v.current.app?.onMount.indexOf(callback) === -1) {
    v.current.app?.onMount.push(callback);
  }
}
function onUpdate(callback) {
  if (v.current.app?.onUpdate.indexOf(callback) === -1) {
    v.current.app?.onUpdate.push(callback);
  }
}
function mount(container, component) {
  let appContainer = null;
  if (isNodeJs) {
    appContainer = typeof container === "string" ? createDomElement(container === "svg" ? "svg" : "div", container === "svg") : container;
  } else {
    appContainer = typeof container === "string" ? document.querySelectorAll(container)[0] : container;
  }
  if (!appContainer) {
    throw new Error("Container not found");
  }
  let vnodeComponent;
  if (isVnodeComponent(component)) {
    vnodeComponent = component;
  } else if (isComponent(component)) {
    vnodeComponent = v(component, {});
  } else {
    throw new Error("Component must be a Valyrian Component or a Vnode component");
  }
  if (component[ValyrianSymbol]) {
    unmount(component);
  } else {
    let eventListener = function(e) {
      let dom = e.target;
      let name = `v-on${e.type}`;
      while (dom) {
        if (dom[name]) {
          dom[name](e, dom);
          if (!e.defaultPrevented) {
            update(component);
          }
          return;
        }
        dom = dom.parentNode;
      }
    };
    component[ValyrianSymbol] = {
      isMounted: false,
      eventListenerNames: {},
      onCleanup: [],
      onMount: [],
      onUpdate: [],
      onUnmount: []
    };
    component[ValyrianSymbol].eventListener = eventListener;
  }
  component[ValyrianSymbol].component = vnodeComponent;
  component[ValyrianSymbol].container = appContainer;
  component[ValyrianSymbol].mainVnode = domToVnode(appContainer);
  component[ValyrianSymbol].mainVnode.isSVG = component[ValyrianSymbol].tag === "svg";
  return update(component);
}
function callCleanup(valyrianApp) {
  for (let i = 0; i < valyrianApp.onCleanup.length; i++) {
    valyrianApp.onCleanup[i]();
  }
  valyrianApp.onCleanup = [];
}
function callUnmount(valyrianApp) {
  for (let i = 0; i < valyrianApp.onUnmount.length; i++) {
    valyrianApp.onUnmount[i]();
  }
  valyrianApp.onUnmount = [];
}
function callMount(valyrianApp) {
  for (let i = 0; i < valyrianApp.onMount.length; i++) {
    valyrianApp.onMount[i]();
  }
  valyrianApp.onMount = [];
}
function callUpdate(valyrianApp) {
  for (let i = 0; i < valyrianApp.onUpdate.length; i++) {
    valyrianApp.onUpdate[i]();
  }
  valyrianApp.onUpdate = [];
}
function update(component) {
  if (component && component[ValyrianSymbol]) {
    let valyrianApp = component[ValyrianSymbol];
    v.current.app = valyrianApp;
    valyrianApp.onCleanup.length && callCleanup(valyrianApp);
    let oldVnode = valyrianApp.mainVnode;
    valyrianApp.mainVnode = new Vnode(valyrianApp.mainVnode.tag, valyrianApp.mainVnode.props, [valyrianApp.component]);
    valyrianApp.mainVnode.dom = oldVnode.dom;
    valyrianApp.mainVnode.isSVG = oldVnode.isSVG;
    patch(valyrianApp.mainVnode, oldVnode, valyrianApp);
    oldVnode = null;
    if (valyrianApp.isMounted === false) {
      valyrianApp.onMount.length && callMount(valyrianApp);
      valyrianApp.isMounted = true;
    } else {
      valyrianApp.onUpdate.length && callUpdate(valyrianApp);
    }
    if (isNodeJs) {
      return valyrianApp.mainVnode.dom.innerHTML;
    }
  }
}
function unmount(component) {
  if (!component || !component[ValyrianSymbol]) {
    return;
  }
  let valyrianApp = component[ValyrianSymbol];
  if (valyrianApp.isMounted) {
    valyrianApp.onCleanup.length && callCleanup(valyrianApp);
    valyrianApp.onUnmount.length && callUnmount(valyrianApp);
    let oldVnode = valyrianApp.mainVnode;
    valyrianApp.mainVnode = new Vnode(valyrianApp.mainVnode.tag, valyrianApp.mainVnode.props, []);
    valyrianApp.mainVnode.dom = oldVnode.dom;
    valyrianApp.mainVnode.isSVG = oldVnode.isSVG;
    patch(valyrianApp.mainVnode, oldVnode, valyrianApp);
    oldVnode = null;
    if (isNodeJs) {
      return valyrianApp.mainVnode.dom.innerHTML;
    }
    valyrianApp = null;
    Reflect.deleteProperty(component, ValyrianSymbol);
  }
}
var emptyVnode = new Vnode("__empty__", {}, []);
function onremove(vnode) {
  for (let i = 0; i < vnode.children.length; i++) {
    vnode.children[i].tag !== "#text" && onremove(vnode.children[i]);
  }
  vnode.props.onremove && vnode.props.onremove(vnode);
}
function sharedUpdateProperty(prop, value, vnode, oldVnode) {
  if (v.reservedProps[prop]) {
    if (v.directives[prop]) {
      v.directives[prop](vnode.props[prop], vnode, oldVnode);
    }
    return;
  }
  if (typeof value === "function") {
    let valyrianApp = v.current.app;
    if (prop in valyrianApp.eventListenerNames === false) {
      valyrianApp.eventListenerNames[prop] = true;
      valyrianApp.container.addEventListener(prop.slice(2), valyrianApp.eventListener);
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
function setProperty(name, value, vnode, oldVnode) {
  if (name in vnode.props === false) {
    vnode.props[name] = value;
  }
  sharedUpdateProperty(name, value, vnode, oldVnode);
}
function updateProperties(vnode, oldVnode) {
  for (let prop in vnode.props) {
    if (prop in vnode.props === false) {
      return;
    }
    sharedUpdateProperty(prop, vnode.props[prop], vnode, oldVnode);
  }
  if (oldVnode) {
    for (let prop in oldVnode.props) {
      if (prop in vnode.props === false && typeof oldVnode.props[prop] !== "function" && prop in v.reservedProps === false) {
        if (prop in oldVnode.dom && vnode.isSVG === false) {
          oldVnode.dom[prop] = null;
        } else {
          oldVnode.dom.removeAttribute(prop);
        }
      }
    }
  }
}
function flatTree(newVnode) {
  let newTree = newVnode.children;
  for (let i = 0; i < newTree.length; i++) {
    let childVnode = newTree[i];
    if (childVnode instanceof Vnode) {
      if (childVnode.tag !== "#text") {
        if (childVnode.tag === "__component__") {
          let component = childVnode.component;
          v.current.component = component;
          let result = ("view" in component ? component.view : component).call(component, childVnode.props, ...childVnode.children);
          newTree.splice(i--, 1, result);
          continue;
        }
        childVnode.isSVG = newVnode.isSVG || childVnode.tag === "svg";
      }
    } else if (childVnode === null || childVnode === void 0) {
      newTree.splice(i--, 1);
    } else if (Array.isArray(childVnode)) {
      newTree.splice(i--, 1, ...childVnode);
    } else {
      if (i > 0 && newTree[i - 1].tag === "#text") {
        newTree[i - 1].nodeValue += childVnode;
        newTree.splice(i--, 1);
      } else {
        newTree[i] = new Vnode("#text", {}, []);
        newTree[i].nodeValue = String(childVnode);
      }
    }
  }
}
function patchKeyedTree(newVnode, newTree, oldTree, newTreeLength, oldTreeLength, valyrianApp) {
  let oldKeyedList = oldTree.reduce((acc, vnode, i) => {
    acc[vnode.props.key] = i;
    return acc;
  }, {});
  let newKeyedList = newTree.reduce((acc, vnode, i) => {
    acc[vnode.props.key] = i;
    return acc;
  }, {});
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
        updateProperties(childVnode, oldChildVnode);
        if (valyrianApp.isMounted) {
          childVnode.props.onupdate && childVnode.props.onupdate(childVnode, oldChildVnode);
        } else {
          childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
        }
      }
    } else {
      childVnode.dom = createDomElement(childVnode.tag, childVnode.isSVG);
      updateProperties(childVnode);
      childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
    }
    if (newVnode.dom.childNodes[i] === void 0) {
      newVnode.dom.appendChild(childVnode.dom);
    } else if (newVnode.dom.childNodes[i] !== childVnode.dom) {
      oldTree[i] && newKeyedList[oldTree[i].props.key] === void 0 && onremove(oldTree[i]);
      newVnode.dom.replaceChild(childVnode.dom, newVnode.dom.childNodes[i]);
    }
    shouldPatch && patch(childVnode, oldChildVnode, valyrianApp);
  }
  for (let i = newTreeLength; i < oldTreeLength; i++) {
    if (newKeyedList[oldTree[i].props.key] === void 0) {
      let oldChildVnode = oldTree[i];
      onremove(oldChildVnode);
      oldChildVnode.dom.parentNode && oldChildVnode.dom.parentNode.removeChild(oldChildVnode.dom);
    }
  }
}
function patchNormalTree(newVnode, newTree, oldTree, newTreeLength, oldTreeLength, valyrianApp) {
  for (let i = 0; i < newTreeLength; i++) {
    let oldChildVnode = oldTree[i];
    let newChildVnode = newTree[i];
    if (!oldChildVnode) {
      if (newChildVnode.tag === "#text") {
        newChildVnode.dom = document.createTextNode(newChildVnode.nodeValue);
        newVnode.dom.appendChild(newChildVnode.dom);
        continue;
      }
      newChildVnode.dom = createDomElement(newChildVnode.tag, newChildVnode.isSVG);
      updateProperties(newChildVnode);
      newVnode.dom.appendChild(newChildVnode.dom);
      newChildVnode.props.oncreate && newChildVnode.props.oncreate(newChildVnode);
      patch(newChildVnode, void 0, valyrianApp);
      continue;
    }
    if (newChildVnode.tag === "#text") {
      if (oldChildVnode.tag === "#text") {
        newChildVnode.dom = oldChildVnode.dom;
        if (newChildVnode.dom.nodeValue != newChildVnode.nodeValue) {
          newChildVnode.dom.nodeValue = newChildVnode.nodeValue;
        }
        continue;
      }
      newChildVnode.dom = document.createTextNode(newChildVnode.nodeValue);
      onremove(oldChildVnode);
      newVnode.dom.replaceChild(newChildVnode.dom, oldChildVnode.dom);
      continue;
    }
    if (oldChildVnode.tag === newChildVnode.tag) {
      newChildVnode.dom = oldChildVnode.dom;
      if (newChildVnode.props["v-once"] || newChildVnode.props.shouldupdate && newChildVnode.props.shouldupdate(newChildVnode, oldChildVnode) === false) {
        newChildVnode.children = oldChildVnode.children;
        continue;
      }
      updateProperties(newChildVnode, oldChildVnode);
      if (valyrianApp && valyrianApp.isMounted) {
        newChildVnode.props.onupdate && newChildVnode.props.onupdate(newChildVnode, oldChildVnode);
      } else {
        newChildVnode.props.oncreate && newChildVnode.props.oncreate(newChildVnode);
      }
      patch(newChildVnode, oldChildVnode, valyrianApp);
      continue;
    }
    newChildVnode.dom = createDomElement(newChildVnode.tag, newChildVnode.isSVG);
    updateProperties(newChildVnode);
    if (oldChildVnode.tag !== "#text") {
      onremove(oldChildVnode);
    }
    newChildVnode.props.oncreate && newChildVnode.props.oncreate(newChildVnode);
    newVnode.dom.replaceChild(newChildVnode.dom, oldChildVnode.dom);
    patch(newChildVnode, void 0, valyrianApp);
  }
  for (let i = newTreeLength; i < oldTreeLength; i++) {
    let oldChildVnode = oldTree[i];
    if (oldChildVnode.tag !== "#text") {
      onremove(oldChildVnode);
    }
    oldChildVnode.dom.parentNode && oldChildVnode.dom.parentNode.removeChild(oldChildVnode.dom);
  }
}
function patch(newVnode, oldVnode = emptyVnode, valyrianApp) {
  v.current.vnode = newVnode;
  v.current.oldVnode = oldVnode;
  flatTree(newVnode);
  let newTree = newVnode.children;
  let oldTree = oldVnode.children;
  let oldTreeLength = oldTree.length;
  let newTreeLength = newTree.length;
  if (newTreeLength === 0) {
    for (let i = 0; i < oldTreeLength; i++) {
      onremove(oldTree[i]);
    }
    newVnode.dom.textContent = "";
    return;
  }
  if (oldTreeLength && "key" in newTree[0].props && "key" in oldTree[0].props) {
    patchKeyedTree(newVnode, newTree, oldTree, newTreeLength, oldTreeLength, valyrianApp);
    return;
  }
  patchNormalTree(newVnode, newTree, oldTree, newTreeLength, oldTreeLength, valyrianApp);
}
function directive(name, directive2) {
  let fullName = `v-${name}`;
  v.directives[fullName] = directive2;
  v.reservedProps[fullName] = true;
}
function hideDirective(test) {
  return (bool, vnode, oldVnode) => {
    let value = test ? bool : !bool;
    if (value) {
      let newdom = document.createTextNode("");
      if (oldVnode && oldVnode.dom && oldVnode.dom.parentNode) {
        oldVnode.tag !== "#text" && onremove(oldVnode);
        oldVnode.dom.parentNode.replaceChild(newdom, oldVnode.dom);
      }
      vnode.tag = "#text";
      vnode.children = [];
      vnode.props = {};
      vnode.dom = newdom;
    }
  };
}
var builtInDirectives = {
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
    if (vnode.name === "input") {
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
          setProperty("checked", value, vnode, oldVnode);
          break;
        }
        case "radio": {
          setProperty("checked", model[property] === vnode.dom.value, vnode, oldVnode);
          break;
        }
        default: {
          setProperty("value", model[property], vnode, oldVnode);
        }
      }
    } else if (vnode.name === "select") {
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
          if (child.name === "option") {
            let value2 = "value" in child.props ? child.props.value : child.children.join("").trim();
            child.props.selected = model[property].indexOf(value2) !== -1;
          }
        });
      } else {
        vnode.children.forEach((child) => {
          if (child.name === "option") {
            let value2 = "value" in child.props ? child.props.value : child.children.join("").trim();
            child.props.selected = value2 === model[property];
          }
        });
      }
    } else if (vnode.name === "textarea") {
      event = event || "oninput";
      vnode.children = [model[property]];
    }
    if (!vnode.props[event]) {
      if (!handler) {
        handler = (e) => model[property] = e.target.value;
      }
      setProperty(event, handler, vnode, oldVnode);
    }
  }
};
var v = function v2(tagOrComponent, props, ...children) {
  if (typeof tagOrComponent === "string") {
    return new Vnode(tagOrComponent, props || {}, children);
  }
  const vnode = new Vnode("__component__", props || {}, children);
  vnode.component = tagOrComponent;
  return vnode;
};
v.fragment = (props, ...children) => {
  return children;
};
v.current = {};
v.directives = { ...builtInDirectives };
v.reservedProps = {
  key: true,
  state: true,
  oncreate: true,
  onupdate: true,
  onremove: true,
  shouldupdate: true,
  "v-cleanup": true,
  "v-once": true,
  "v-if": true,
  "v-unless": true,
  "v-for": true,
  "v-show": true,
  "v-class": true,
  "v-html": true
};
(isNodeJs ? global : window).v = v;
module.exports = __toCommonJS(lib_exports);
