// lib/index.ts
var ComponentString = "__component__";
var TextString = "#text";
var isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);
var Und = void 0;
var Vnode = function Vnode2(tag, props, children) {
  this.props = props;
  this.children = children;
  this.tag = tag;
};
function isVnode(object) {
  return object instanceof Vnode;
}
function isComponent(component) {
  return typeof component === "function" || typeof component === "object" && component !== null && "view" in component;
}
function isVnodeComponent(vnode) {
  return vnode instanceof Vnode && vnode.tag === ComponentString;
}
function createDomElement(tag, isSVG = false) {
  return isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
}
function domToVnode(dom) {
  if (dom.nodeType === 3) {
    let vnode = v(TextString, {}, []);
    vnode.nodeValue = dom.nodeValue;
    vnode.dom = dom;
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
    let vnode = v(dom.tagName.toLowerCase(), props, ...children);
    vnode.dom = dom;
    return vnode;
  }
}
var trust = (htmlString) => {
  let div = createDomElement("div");
  div.innerHTML = htmlString.trim();
  return [].map.call(div.childNodes, (item) => domToVnode(item));
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
  "v-html": true
};
var eventListenerNames = {};
var onCleanupList = [];
var onMountList = [];
var onUpdateList = [];
var onUnmountList = [];
var current = {};
function eventListener(e) {
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
}
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
  if (v.isMounted) {
    unmount();
  }
  v.component = vnodeComponent;
  v.container = appContainer;
  v.mainVnode = domToVnode(appContainer);
  return update();
}
function callCallbackList(list) {
  for (let i = 0; i < list.length; i++) {
    list[i]();
  }
  list = [];
}
function update() {
  if (v.component && v.mainVnode) {
    onCleanupList.length && callCallbackList(onCleanupList);
    let oldVnode = v.mainVnode;
    v.mainVnode = new Vnode(v.mainVnode.tag, v.mainVnode.props, [v.component]);
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
  if (v.isMounted && v.mainVnode && v.component) {
    onCleanupList.length && callCallbackList(onCleanupList);
    onUnmountList.length && callCallbackList(onUnmountList);
    let oldVnode = v.mainVnode;
    v.mainVnode = new Vnode(v.mainVnode.tag, v.mainVnode.props, []);
    v.mainVnode.dom = oldVnode.dom;
    v.mainVnode.isSVG = oldVnode.isSVG;
    patch(v.mainVnode, oldVnode);
    oldVnode = null;
    v.component = null;
    v.isMounted = false;
    if (isNodeJs) {
      return v.mainVnode.dom.innerHTML;
    }
  }
}
var emptyVnode = new Vnode("__empty__", {}, []);
function onremove(vnode) {
  for (let i = 0; i < vnode.children.length; i++) {
    vnode.children[i].tag !== TextString && onremove(vnode.children[i]);
  }
  vnode.props.onremove && vnode.props.onremove(vnode);
}
function sharedSetAttribute(prop, value, vnode, oldVnode) {
  if (reservedProps[prop]) {
    if (directives[prop]) {
      return directives[prop](vnode.props[prop], vnode, oldVnode);
    }
    return;
  }
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
  sharedSetAttribute(name, value, vnode, oldVnode);
}
function setAttributes(vnode, oldVnode) {
  for (let prop in vnode.props) {
    if (sharedSetAttribute(prop, vnode.props[prop], vnode, oldVnode) === false) {
      return;
    }
  }
  if (oldVnode) {
    for (let prop in oldVnode.props) {
      if (prop in vnode.props === false && typeof oldVnode.props[prop] !== "function" && prop in reservedProps === false) {
        if (prop in oldVnode.dom && vnode.isSVG === false) {
          oldVnode.dom[prop] = null;
        } else {
          oldVnode.dom.removeAttribute(prop);
        }
      }
    }
  }
}
function patch(newVnode, oldVnode = emptyVnode) {
  current.vnode = newVnode;
  current.oldVnode = oldVnode === emptyVnode ? Und : oldVnode;
  let newTree = newVnode.children;
  let oldTree = oldVnode.children;
  for (let i = 0; i < newTree.length; i++) {
    let childVnode = newTree[i];
    if (childVnode instanceof Vnode) {
      if (childVnode.tag !== TextString) {
        if (childVnode.tag === ComponentString) {
          let component = childVnode.component;
          current.component = component;
          let result = ("view" in component ? component.view : component).call(component, childVnode.props, ...childVnode.children);
          newTree.splice(i--, 1, result);
          continue;
        }
        childVnode.isSVG = newVnode.isSVG || childVnode.tag === "svg";
      }
    } else if (Array.isArray(childVnode)) {
      newTree.splice(i--, 1, ...childVnode);
    } else if (childVnode === null || childVnode === Und) {
      newTree.splice(i--, 1);
    } else {
      newTree[i] = new Vnode(TextString, {}, []);
      newTree[i].nodeValue = childVnode;
    }
  }
  let oldTreeLength = oldTree.length;
  let newTreeLength = newTree.length;
  if (newTreeLength === 0) {
    for (let i = 0; i < oldTreeLength; i++) {
      oldTree[i].tag !== TextString && onremove(oldTree[i]);
    }
    newVnode.dom.textContent = "";
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
      if (newVnode.dom.childNodes[i] === Und) {
        newVnode.dom.appendChild(childVnode.dom);
      } else if (newVnode.dom.childNodes[i] !== childVnode.dom) {
        oldTree[i] && newKeyedList[oldTree[i].props.key] === Und && onremove(oldTree[i]);
        newVnode.dom.replaceChild(childVnode.dom, newVnode.dom.childNodes[i]);
      }
      shouldPatch && patch(childVnode, oldChildVnode);
    }
    for (let i = newTreeLength; i < oldTreeLength; i++) {
      if (newKeyedList[oldTree[i].props.key] === Und) {
        let oldChildVnode = oldTree[i];
        onremove(oldChildVnode);
        oldChildVnode.dom.parentNode && oldChildVnode.dom.parentNode.removeChild(oldChildVnode.dom);
      }
    }
    return;
  }
  for (let i = 0; i < newTreeLength; i++) {
    let newChildVnode = newTree[i];
    if (i < oldTreeLength) {
      let oldChildVnode = oldTree[i];
      if (newChildVnode.tag === TextString) {
        if (oldChildVnode.tag === TextString) {
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
        setAttributes(newChildVnode, oldChildVnode);
        if (v.isMounted) {
          newChildVnode.props.onupdate && newChildVnode.props.onupdate(newChildVnode, oldChildVnode);
        } else {
          newChildVnode.props.oncreate && newChildVnode.props.oncreate(newChildVnode);
        }
        patch(newChildVnode, oldChildVnode);
        continue;
      }
      newChildVnode.dom = createDomElement(newChildVnode.tag, newChildVnode.isSVG);
      setAttributes(newChildVnode);
      oldChildVnode.tag !== TextString && onremove(oldChildVnode);
      newChildVnode.props.oncreate && newChildVnode.props.oncreate(newChildVnode);
      newVnode.dom.replaceChild(newChildVnode.dom, oldChildVnode.dom);
      patch(newChildVnode, emptyVnode);
      continue;
    }
    if (newChildVnode.tag === TextString) {
      newChildVnode.dom = document.createTextNode(newChildVnode.nodeValue);
      newVnode.dom.appendChild(newChildVnode.dom);
      continue;
    }
    newChildVnode.dom = createDomElement(newChildVnode.tag, newChildVnode.isSVG);
    setAttributes(newChildVnode);
    newVnode.dom.appendChild(newChildVnode.dom);
    newChildVnode.props.oncreate && newChildVnode.props.oncreate(newChildVnode);
    patch(newChildVnode, emptyVnode);
  }
  for (let i = newTreeLength; i < oldTreeLength; i++) {
    let oldChildVnode = oldTree[i];
    oldChildVnode.tag !== TextString && onremove(oldChildVnode);
    oldChildVnode.dom.parentNode && oldChildVnode.dom.parentNode.removeChild(oldChildVnode.dom);
  }
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
        oldVnode.tag !== TextString && onremove(oldVnode);
        oldVnode.dom.parentNode.replaceChild(newdom, oldVnode.dom);
      }
      vnode.tag = TextString;
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
    } else if (vnode.name === "textarea") {
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
var plugins = /* @__PURE__ */ new Map();
function use(plugin, options) {
  if (plugins.has(plugin)) {
    return plugins.get(plugin);
  }
  let result = plugin(v, options);
  plugins.set(plugin, result);
  return result;
}
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
v.current = current;
v.directives = directives;
v.reservedProps = reservedProps;
v.isVnode = isVnode;
v.isComponent = isComponent;
v.isVnodeComponent = isVnodeComponent;
v.isMounted = false;
v.isNodeJs = isNodeJs;
v.trust = trust;
v.onCleanup = onCleanup;
v.onUnmount = onUnmount;
v.onMount = onMount;
v.onUpdate = onUpdate;
v.mount = mount;
v.unmount = unmount;
v.update = update;
v.setAttribute = setAttribute;
v.directive = directive;
v.use = use;
var lib_default = v;
export {
  lib_default as default
};
