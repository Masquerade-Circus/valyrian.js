// lib/index2.ts
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
    let dom2 = elementsToClone.svg[tag].cloneNode(false);
    dom2.vProps = {};
    return dom2;
  }
  if (!elementsToClone.notSvg[tag]) {
    elementsToClone.notSvg[tag] = document.createElement(tag);
  }
  let dom = elementsToClone.notSvg[tag].cloneNode(false);
  dom.vProps = {};
  return dom;
}
function domToVnode(dom) {
  if (dom.nodeType === 3) {
    return {
      tag: "#text",
      props: {},
      children: [dom.nodeValue],
      dom
    };
  }
  if (dom.nodeType === 1) {
    let children = [];
    for (let i = 0; i < dom.childNodes.length; i++) {
      let child = domToVnode(dom.childNodes[i]);
      if (child) {
        children.push(child);
      }
    }
    let vProps = {};
    if (dom.vProps) {
      vProps = dom.vProps;
    } else {
      [].forEach.call(dom.attributes, (prop) => vProps[prop.nodeName] = prop.nodeValue);
    }
    dom.vProps = vProps;
    return {
      tag: dom.tagName.toLowerCase(),
      props: vProps,
      children,
      dom
    };
  }
}
var trust = (htmlString) => {
  let div = createDomElement("div");
  div.innerHTML = htmlString.trim();
  return [].map.call(div.childNodes, (item) => domToVnode(item));
};
function createVnode(tag, props, children) {
  return {
    tag,
    props,
    children
  };
}
function createValyrianComponent(component, props, children) {
  return {
    view: component.bind(component),
    props,
    children
  };
}
var v = function(tagOrComponent, props, ...children) {
  if (typeof tagOrComponent === "string") {
    return createVnode(tagOrComponent, props || {}, children);
  }
  return createValyrianComponent(tagOrComponent, props || {}, children);
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
var conservedProps = {
  key: true,
  state: true,
  onremove: true
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
var current = {};
function sharedSetAttribute(prop, vnode, dom, isSVG = false, oldVnode) {
  if (reservedProps[prop]) {
    if (directives[prop]) {
      vnode.dom = dom;
      dom.vProps[prop] = vnode.props[prop];
      return directives[prop](vnode.props[prop], vnode, oldVnode);
    }
    if (conservedProps[prop]) {
      dom.vProps[prop] = vnode.props[prop];
    }
    return;
  }
  let value = vnode.props[prop];
  if (typeof value === "function") {
    if (prop in eventListenerNames === false) {
      eventListenerNames[prop] = true;
      v.container.addEventListener(prop.slice(2), eventListener);
    }
    dom[`v-${prop}`] = value;
    return;
  }
  if (prop in dom && isSVG === false) {
    if (dom[prop] != value) {
      dom.vProps[prop] = value;
      dom[prop] = value;
    }
    return;
  }
  if (dom[prop] !== value) {
    if (value === false) {
      dom.removeAttribute(prop);
      Reflect.deleteProperty(dom.vProps, prop);
    } else {
      dom.setAttribute(prop, value);
      dom.vProps[prop] = value;
    }
  }
}
function setAttribute(name, value, vnode, isSVG = false, oldVnode) {
  vnode.props[name] = value;
  sharedSetAttribute(name, vnode, vnode.dom, isSVG || vnode.tag === "svg", oldVnode);
}
function addAttributes(vnode, dom, isSVG = false) {
  for (let prop in vnode.props) {
    if (sharedSetAttribute(prop, vnode, dom, isSVG) === false) {
      break;
    }
  }
}
function updateAttributes(vnode, dom, isSVG = false) {
  let oldProps = { ...dom.vProps };
  let oldVnode;
  if (dom.vProps) {
    oldVnode = domToVnode(dom);
  }
  for (let prop in vnode.props) {
    if (sharedSetAttribute(prop, vnode, dom, isSVG, oldVnode) === false) {
      break;
    }
  }
  for (let prop in oldProps) {
    if (prop in vnode.props === false) {
      if (prop in dom && isSVG === false) {
        dom[prop] = null;
      } else {
        dom.removeAttribute(prop);
      }
      Reflect.deleteProperty(dom.vProps, prop);
    }
  }
}
function callLifeCycle(event, vnode, dom, oldVnode) {
  if (vnode.props[event]) {
    vnode.dom = dom;
    vnode.props[event](vnode, oldVnode);
  }
  if (event === "onremove") {
    for (let i = 0; i < vnode.children.length; i++) {
      let child = vnode.children[i];
      if (child.tag !== "#text") {
        callLifeCycle(event, child, child.dom);
      }
    }
  }
}
function patch(newVnode, oldVnode, isSVG = false) {
  let newTree = newVnode.children;
  let oldTree = oldVnode?.children || [];
  for (let i = 0; i < newTree.length; i++) {
    let childVnode = newTree[i];
    if (childVnode === null || childVnode === void 0) {
      newTree.splice(i--, 1);
    } else if (Array.isArray(childVnode)) {
      newTree.splice(i--, 1, ...childVnode);
    } else if (typeof childVnode === "object" && ("tag" in childVnode || "view" in childVnode)) {
      if (childVnode.view) {
        let result = childVnode.view(childVnode.props, ...childVnode.children);
        newTree.splice(i--, 1, result);
        continue;
      }
    } else {
      newTree[i] = v("#text", {}, childVnode);
    }
  }
  let oldTreeLength = oldTree.length;
  let newTreeLength = newTree.length;
  if (newTreeLength === 0) {
    for (let i = oldTreeLength - 1; i >= 0; i--) {
      let oldChild = oldTree[i];
      if (oldChild.tag !== "#text") {
        callLifeCycle("onremove", oldChild, oldChild.dom);
      }
      console.log("remove", oldChild.dom);
      newVnode.dom.textContent = "";
    }
    return;
  }
  if (newTreeLength) {
    for (let i = 0; i < newTreeLength; i++) {
      let newChild = newTree[i];
      let oldChild = oldTree[i];
      if (!oldChild) {
        if (newChild.tag === "#text") {
          newChild.dom = document.createTextNode(newChild.children[0]);
          newVnode.dom.appendChild(newChild.dom);
          continue;
        }
        isSVG = isSVG || newChild.tag === "svg";
        newChild.dom = createDomElement(newChild.tag, isSVG);
        addAttributes(newChild, newChild.dom, isSVG);
        newVnode.dom.appendChild(newChild.dom);
        callLifeCycle("oncreate", newChild, newChild.dom);
        if (newChild.children.length > 0) {
          patch(newChild, void 0, isSVG);
        }
        continue;
      }
      if (newChild.tag === "#text") {
        if (oldChild.tag === "#text") {
          newChild.dom = oldChild.dom;
          if (newChild.dom.textContent != newChild.children[0]) {
            newChild.dom.textContent = newChild.children[0];
          }
          continue;
        }
        newChild.dom = document.createTextNode(newChild.children[0]);
        if (oldChild.tag !== "#text") {
          callLifeCycle("onremove", oldChild, oldChild.dom);
        }
        newVnode.dom.replaceChild(newChild.dom, oldChild.dom);
        continue;
      }
      isSVG = isSVG || newChild.tag === "svg";
      if (oldChild.tag !== newChild.tag) {
        newChild.dom = createDomElement(newChild.tag, isSVG);
        if (oldChild.tag !== "#text") {
          callLifeCycle("onremove", oldChild, oldChild.dom);
        }
        addAttributes(newChild, newChild.dom, isSVG);
        newVnode.dom.replaceChild(newChild.dom, oldChild.dom);
        callLifeCycle("oncreate", newChild, newChild.dom);
        patch(newChild, oldChild, isSVG);
        continue;
      }
      newChild.dom = oldChild.dom;
      if ("v-once" in newChild.props || "shouldupdate" in newChild.props && newChild.props.shouldupdate(oldChild, newChild) === false) {
        newChild.children = oldChild.children;
        continue;
      }
      updateAttributes(newChild, newChild.dom, isSVG);
      callLifeCycle(v.isMounted ? "onupdate" : "oncreate", newChild, newChild.dom, oldChild);
      patch(newChild, oldChild, isSVG);
    }
  }
  for (let i = newTreeLength; i < oldTreeLength; i++) {
    let oldChild = oldTree[i];
    if (oldChild.tag !== "#text") {
      callLifeCycle("onremove", oldChild, oldChild.dom);
    }
    newVnode.dom.removeChild(oldChild.dom);
  }
}
function update() {
  if (v.component && v.container && v.mainVnode) {
    let oldVnode = {
      ...v.mainVnode,
      props: v.mainVnode.props,
      children: v.mainVnode.children
    };
    let result = v.component.view(v.component.props || {}, v.component.children);
    v.mainVnode.children = Array.isArray(result) ? result : [result];
    patch(v.mainVnode, oldVnode, v.mainVnode.tag === "svg");
    v.isMounted = true;
    if (isNodeJs) {
      return v.container.innerHTML;
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
  if (v.isValyrianComponent(normalComponent)) {
    if (!normalComponent.props) {
      normalComponent.props = {};
    }
    if (!Array.isArray(normalComponent.children)) {
      normalComponent.children = "children" in normalComponent ? [normalComponent.children] : [];
    }
    v.component = normalComponent;
  } else {
    v.component = createValyrianComponent(normalComponent, normalComponent.props || {}, "children" in normalComponent ? Array.isArray(normalComponent.children) ? normalComponent.children : [normalComponent.children] : []);
  }
  v.mainVnode = domToVnode(v.container);
  return update();
}
function unmount() {
  if (v.component && v.container && v.mainVnode) {
    let oldVnode = {
      ...v.mainVnode,
      props: v.mainVnode.props,
      children: [...v.mainVnode.children]
    };
    v.mainVnode.children = [];
    patch(v.mainVnode, oldVnode, v.mainVnode.tag === "svg");
    let container = v.container;
    v.container = null;
    v.component = null;
    v.isMounted = false;
    if (isNodeJs) {
      return container.innerHTML;
    }
  }
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
        oldVnode.tag !== "#text" && callLifeCycle("onremove", oldVnode, oldVnode.dom);
        oldVnode.dom.parentNode.replaceChild(newdom, oldVnode.dom);
      }
      vnode.tag = "#text";
      vnode.children = [""];
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
          setAttribute("checked", value, vnode, false, oldVnode);
          break;
        }
        case "radio": {
          setAttribute("checked", model[property] === vnode.dom.value, vnode, false, oldVnode);
          break;
        }
        default: {
          setAttribute("value", model[property], vnode, false, oldVnode);
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
      setAttribute(event, handler, vnode, false, oldVnode);
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
var index2_default = v;
export {
  index2_default as default
};
