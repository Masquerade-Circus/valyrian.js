/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable complexity */

import {
  Children,
  Component,
  Current,
  Directive,
  Directives,
  DomElement,
  Plugin,
  Props,
  Valyrian,
  ValyrianComponent,
  Vnode,
  VnodeWithDom
} from "./interfaces2";

const isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);

const elementsToClone: {
  svg: Record<string, DomElement>;
  notSvg: Record<string, DomElement>;
} = {
  svg: {},
  notSvg: {}
};

function createDomElement(tag: string, isSVG: boolean = false): DomElement {
  if (isSVG) {
    if (!elementsToClone.svg[tag]) {
      elementsToClone.svg[tag] = document.createElementNS("http://www.w3.org/2000/svg", tag) as any;
    }

    let dom = elementsToClone.svg[tag].cloneNode(false) as any;
    dom.vProps = {};
    return dom;
  }

  if (!elementsToClone.notSvg[tag]) {
    elementsToClone.notSvg[tag] = document.createElement(tag) as any;
  }

  let dom = elementsToClone.notSvg[tag].cloneNode(false) as any;
  dom.vProps = {};
  return dom as DomElement;
}

function domToVnode(dom: any): void | Vnode {
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

    let vProps: Props = {};
    if (dom.vProps) {
      vProps = dom.vProps;
    } else {
      [].forEach.call(dom.attributes, (prop: Attr) => (vProps[prop.nodeName] = prop.nodeValue));
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

const trust = (htmlString: string): Children => {
  let div = createDomElement("div");
  div.innerHTML = htmlString.trim();

  return [].map.call(div.childNodes, (item) => domToVnode(item)) as Vnode[];
};

function createVnode(tag: string, props: Props, children: any[]): Vnode {
  return {
    tag,
    props,
    children
  };
}

function createValyrianComponent(component: Component, props: Record<string, any>, children: any[]): ValyrianComponent {
  return {
    view: component.bind(component),
    props,
    children
  };
}

const v: Valyrian = function (tagOrComponent: string | Component, props: Record<string, any> | null, ...children: any[]): Vnode | ValyrianComponent {
  if (typeof tagOrComponent === "string") {
    return createVnode(tagOrComponent, props || {}, children);
  }
  return createValyrianComponent(tagOrComponent, props || {}, children);
};

v.fragment = function (props: Props, ...children: any[]) {
  return children;
};

v.isVnode = function isVnode(object?: unknown | Vnode): object is Vnode {
  return Boolean(object && typeof object === "object" && "tag" in object);
};

v.isComponent = function isComponent(component?: unknown | ValyrianComponent): component is ValyrianComponent {
  return Boolean((component && typeof component === "function") || v.isValyrianComponent(component));
};

v.isValyrianComponent = function isValyrianComponent(component?: unknown | ValyrianComponent): component is ValyrianComponent {
  return Boolean(component && typeof component === "object" && "view" in component);
};

const reservedProps: Record<string, true> = {
  key: true,
  state: true,
  oncreate: true,
  onupdate: true,
  onremove: true,
  shouldupdate: true,
  "v-once": true,

  // Built in directives
  "v-if": true,
  "v-unless": true,
  "v-for": true,
  "v-show": true,
  "v-class": true,
  "v-html": true,
  "v-model": true
};
const conservedProps: Record<string, true> = {
  key: true,
  state: true,
  onremove: true
};
const eventListenerNames: Record<string, any> = {};
function eventListener(e: Event) {
  let dom = e.target as any;
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

const current: Current = {};

function sharedSetAttribute(prop: string, vnode: Vnode, dom: DomElement, isSVG: boolean = false, oldVnode?: VnodeWithDom): void | boolean {
  // It is a reserved prop
  if (reservedProps[prop]) {
    // If it is a directive name call the directive
    if (directives[prop]) {
      vnode.dom = dom;
      dom.vProps[prop] = vnode.props[prop];
      return directives[prop](vnode.props[prop], vnode as VnodeWithDom, oldVnode);
    }

    if (conservedProps[prop]) {
      dom.vProps[prop] = vnode.props[prop];
    }

    return;
  }

  let value = vnode.props[prop];

  // It is not a reserved prop so we add it to the dom
  if (typeof value === "function") {
    if (prop in eventListenerNames === false) {
      eventListenerNames[prop] = true;
      (v.container as DomElement).addEventListener(prop.slice(2), eventListener);
    }
    dom[`v-${prop}`] = value;
    return;
  }

  if (prop in dom && isSVG === false) {
    // eslint-disable-next-line eqeqeq
    if (dom[prop] != value) {
      dom.vProps[prop] = value;
      dom[prop] = value;
    }
    return;
  }

  // Use set attribute
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

function setAttribute(name: string, value: any, vnode: VnodeWithDom, isSVG: boolean = false, oldVnode?: VnodeWithDom): void {
  vnode.props[name] = value;
  sharedSetAttribute(name, vnode, vnode.dom, isSVG || vnode.tag === "svg", oldVnode);
}

function addAttributes(vnode: Vnode, dom: DomElement, isSVG = false): void {
  for (let prop in vnode.props) {
    if (sharedSetAttribute(prop, vnode, dom, isSVG) === false) {
      break;
    }
  }
}

function updateAttributes(vnode: Vnode, dom: DomElement, isSVG: boolean = false) {
  let oldProps = { ...dom.vProps };
  let oldVnode;

  if (dom.vProps) {
    oldVnode = domToVnode(dom) as VnodeWithDom;
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

function callLifeCycle(event: string, vnode: Vnode, dom: DomElement, oldVnode?: VnodeWithDom) {
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

function patch(newTree: any[], parent: DomElement, isSVG: boolean = false) {
  for (let i = 0; i < newTree.length; i++) {
    let childVnode = newTree[i];
    if (childVnode === null || childVnode === undefined) {
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

  let oldTreeLength = parent.childNodes.length;
  let newTreeLength = newTree.length;

  // If new tree is empty, remove all old nodes
  if (newTreeLength === 0) {
    for (let i = oldTreeLength - 1; i >= 0; i--) {
      let oldDom = parent.childNodes[i] as DomElement;

      if (oldDom.nodeType === 1) {
        let oldVnode = domToVnode(oldDom) as VnodeWithDom;
        callLifeCycle("onremove", oldVnode, oldDom);
      }

      parent.removeChild(oldDom);
    }
    return;
  }

  // If new tree and old tree have more than one child, we should update the dom
  if (newTreeLength) {
    for (let i = 0; i < newTreeLength; i++) {
      let newChild = newTree[i];
      let oldDom = parent.childNodes[i] as DomElement;

      if (!oldDom) {
        if (newChild.tag === "#text") {
          parent.appendChild(document.createTextNode(newChild.children[0]));
          continue;
        }

        isSVG = isSVG || newChild.tag === "svg";
        let newDom = createDomElement(newChild.tag, isSVG);
        parent.appendChild(newDom);
        addAttributes(newChild, newDom, isSVG);
        callLifeCycle("oncreate", newChild, newDom);
        if (newChild.children.length > 0) {
          patch(newChild.children, newDom, isSVG);
        }
        continue;
      }

      if (newChild.tag === "#text") {
        if (oldDom.nodeType === 3) {
          // eslint-disable-next-line eqeqeq
          if (oldDom.textContent != newChild.children[0]) {
            oldDom.textContent = newChild.children[0];
          }
          continue;
        }

        let newDom = document.createTextNode(newChild.children[0]);
        if (oldDom.nodeType === 1) {
          let oldVnode = domToVnode(oldDom) as VnodeWithDom;
          callLifeCycle("onremove", oldVnode, oldDom);
        }

        parent.replaceChild(newDom, oldDom);
        continue;
      }

      isSVG = isSVG || newChild.tag === "svg";
      if (oldDom.tagName.toLowerCase() !== newChild.tag) {
        let newDom = createDomElement(newChild.tag, isSVG);
        parent.replaceChild(newDom, oldDom);
        addAttributes(newChild, newDom, isSVG);
        if (oldDom.nodeType === 1) {
          let oldVnode = domToVnode(oldDom) as VnodeWithDom;
          callLifeCycle("onremove", oldVnode, oldDom);
        }
        callLifeCycle("oncreate", newChild, newDom);
        if (newChild.children.length > 0) {
          patch(newChild.children, newDom, isSVG);
        }
        continue;
      }

      if ("v-once" in newChild.props || "shouldupdate" in newChild.props) {
        let oldVnode = domToVnode(oldDom) as VnodeWithDom;
        let shouldUpdate = newChild.props.shouldupdate ? newChild.props.shouldupdate(oldVnode, newChild) !== false : false;
        if (!shouldUpdate) {
          newChild.children = oldVnode.children;
          continue;
        }
      }

      updateAttributes(newChild, oldDom, isSVG);
      callLifeCycle(v.isMounted ? "onupdate" : "oncreate", newChild, oldDom, domToVnode(oldDom) as VnodeWithDom);
      if (newChild.children.length > 0) {
        patch(newChild.children, oldDom, isSVG);
      }
    }
  }

  // For the rest of the children, we should remove them
  for (let i = newTreeLength; i < oldTreeLength; i++) {
    let oldChildVnode = parent.childNodes[i] as DomElement;
    if (oldChildVnode.nodeType === 1) {
      let oldVnode = domToVnode(oldChildVnode) as VnodeWithDom;
      callLifeCycle("onremove", oldVnode, oldChildVnode);
    }
    parent.removeChild(oldChildVnode);
  }
}

function update() {
  if (v.component && v.container) {
    let result = v.component.view(v.component.props || {}, v.component.children);

    patch(Array.isArray(result) ? result : [result], v.container as DomElement);

    v.isMounted = true;

    if (isNodeJs) {
      return v.container.innerHTML;
    }
  }
}

function mount(container: string | Element, normalComponent: Component | ValyrianComponent) {
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
    v.component = createValyrianComponent(
      normalComponent,
      normalComponent.props || {},
      "children" in normalComponent ? (Array.isArray(normalComponent.children) ? normalComponent.children : [normalComponent.children]) : []
    );
  }

  v.mainVnode = domToVnode(v.container);

  return update();
}

function unmount() {
  if (v.component && v.container) {
    patch([], v.container as DomElement);
    v.component = null;
    v.isMounted = false;
    if (isNodeJs) {
      return v.container.innerHTML;
    }
  }
}

const plugins = new Map<Plugin, any>();

function use(plugin: Plugin, options?: Record<string | number | symbol, any>): void | any {
  if (plugins.has(plugin)) {
    return plugins.get(plugin);
  }

  let result = plugin(v, options);
  plugins.set(plugin, result);
  return result;
}

function directive(name: string, directive: Directive) {
  let fullName = `v-${name}`;
  directives[fullName] = directive;
  reservedProps[fullName] = true;
}

function hideDirective(test: boolean): Directive {
  return (bool: boolean, vnode: VnodeWithDom, oldVnode?: VnodeWithDom) => {
    let value = test ? bool : !bool;
    if (value) {
      let newdom = document.createTextNode("");
      if (oldVnode) {
        oldVnode.tag !== "#text" && callLifeCycle("onremove", oldVnode, oldVnode.dom);
        (oldVnode.dom.parentNode as Element).replaceChild(newdom, oldVnode.dom);
      } else {
        (vnode.dom.parentNode as Element).replaceChild(newdom, vnode.dom);
      }
      vnode.tag = "#text";
      vnode.children = [];
      vnode.props = {};

      return false;
    }
  };
}

const directives: Directives = {
  "v-if": hideDirective(false),
  "v-unless": hideDirective(true),
  "v-for": (set: unknown[], vnode: VnodeWithDom) => {
    vnode.children = set.map(vnode.children[0]);
  },
  "v-show": (bool: boolean, vnode: VnodeWithDom) => {
    (vnode.dom as unknown as { style: { display: string } }).style.display = bool ? "" : "none";
  },
  "v-class": (classes: { [x: string]: boolean }, vnode: VnodeWithDom) => {
    for (let name in classes) {
      (vnode.dom as DomElement).classList.toggle(name, classes[name]);
    }
  },
  "v-html": (html: string, vnode: VnodeWithDom) => {
    vnode.children = [trust(html)];
  },
  "v-model": ([model, property, event]: any[], vnode: VnodeWithDom, oldVnode?: VnodeWithDom) => {
    let value;
    let handler;
    if (vnode.tag === "input") {
      event = event || "oninput";
      switch (vnode.props.type) {
        case "checkbox": {
          if (Array.isArray(model[property])) {
            handler = (e: Event) => {
              let val = (e.target as DomElement & Record<string, any>).value;
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
            handler = () => (model[property] = !model[property]);
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
        handler = (e: Event & Record<string, any>) => {
          let val = (e.target as DomElement & Record<string, any>).value;
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
        vnode.children.forEach((child: Vnode) => {
          if (child.tag === "option") {
            let value = "value" in child.props ? child.props.value : child.children.join("").trim();
            child.props.selected = model[property].indexOf(value) !== -1;
          }
        });
      } else {
        vnode.children.forEach((child: Vnode) => {
          if (child.tag === "option") {
            let value = "value" in child.props ? child.props.value : child.children.join("").trim();
            child.props.selected = value === model[property];
          }
        });
      }
    } else if (vnode.tag === "textarea") {
      event = event || "oninput";
      vnode.children = [model[property]];
    }

    if (!vnode.props[event]) {
      if (!handler) {
        handler = (e: Event) => (model[property] = (e.target as DomElement & Record<string, any>).value);
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

export default v;
