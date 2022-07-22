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
  return (isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag)) as DomElement;

  if (isSVG) {
    if (!elementsToClone.svg[tag]) {
      elementsToClone.svg[tag] = document.createElementNS("http://www.w3.org/2000/svg", tag) as any;
    }

    return elementsToClone.svg[tag].cloneNode(false) as any;
  }

  if (!elementsToClone.notSvg[tag]) {
    elementsToClone.notSvg[tag] = document.createElement(tag) as any;
  }

  return elementsToClone.notSvg[tag].cloneNode(false) as any;
}

const Vnode = function Vnode(this: Vnode, tag: string, props: Props, children: Children) {
  this.props = props;
  this.children = children;
  this.tag = tag;
} as unknown as Vnode;

function domToVnode(dom: any): void | VnodeWithDom {
  if (dom.nodeType === 3) {
    let vnode = new Vnode("#text", {}, []);

    vnode.dom = dom;
    vnode.nodeValue = dom.nodeValue;
    return vnode as VnodeWithDom;
  }

  if (dom.nodeType === 1) {
    let children = [];
    for (let i = 0; i < dom.childNodes.length; i++) {
      let child = domToVnode(dom.childNodes[i]);
      if (child) {
        children.push(child);
      }
    }

    let props: Props = {};
    [].forEach.call(dom.attributes, (prop: Attr) => (props[prop.nodeName] = prop.nodeValue));

    let vnode = new Vnode(dom.tagName.toLowerCase(), props, children);
    vnode.dom = dom;
    return vnode as VnodeWithDom;
  }
}

const trust = (htmlString: string): Children => {
  let div = createDomElement("div");
  div.innerHTML = htmlString.trim();

  return [].map.call(div.childNodes, (item) => domToVnode(item)) as Vnode[];
};

const v: Valyrian = function (tagOrComponent: string | Component, props: Record<string, any> | null, ...children: any[]): Vnode | ValyrianComponent {
  if (typeof tagOrComponent === "string") {
    return new Vnode(tagOrComponent, props || {}, children);
  }
  let vnode = new Vnode("#component", props || {}, children);
  vnode.view = tagOrComponent;
  return vnode;
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

let onCleanupList: Function[] = [];
let onMountList: Function[] = [];
let onUpdateList: Function[] = [];
let onUnmountList: Function[] = [];

function onCleanup(callback: Function): void {
  if (onCleanupList.indexOf(callback) === -1) {
    onCleanupList.push(callback);
  }
}
function onUnmount(callback: Function): void {
  if (onUnmountList.indexOf(callback) === -1) {
    onUnmountList.push(callback);
  }
}
function onMount(callback: Function): void {
  if (onMountList.indexOf(callback) === -1) {
    onMountList.push(callback);
  }
}
function onUpdate(callback: Function): void {
  if (onUpdateList.indexOf(callback) === -1) {
    onUpdateList.push(callback);
  }
}

function callCallbackList(list: Function[]): void {
  for (let i = 0; i < list.length; i++) {
    list[i]();
  }
  list.length = 0;
}

const current: Current = {};

function sharedSetAttribute(prop: string, vnode: VnodeWithDom, oldVnode?: VnodeWithDom, isSVG: boolean = false): void | boolean {
  // It is a reserved prop
  if (reservedProps[prop]) {
    // If it is a directive name call the directive
    if (directives[prop]) {
      return directives[prop](vnode.props[prop], vnode, oldVnode);
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
    vnode.dom[`v-${prop}`] = value;
    return;
  }

  if (prop in vnode.dom && isSVG === false) {
    // eslint-disable-next-line eqeqeq
    if (vnode.dom[prop] != value) {
      vnode.dom[prop] = value;
    }
    return;
  }

  // Use set attribute
  if (vnode.dom[prop] !== value) {
    if (value === false) {
      vnode.dom.removeAttribute(prop);
    } else {
      vnode.dom.setAttribute(prop, value);
    }
  }
}

function setAttribute(name: string, value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom, isSVG: boolean = false): void {
  vnode.props[name] = value;
  sharedSetAttribute(name, vnode, oldVnode, isSVG || vnode.tag === "svg");
}

function addAttributes(vnode: VnodeWithDom, isSVG = false): void {
  for (let prop in vnode.props) {
    if (sharedSetAttribute(prop, vnode, undefined, isSVG) === false) {
      break;
    }
  }
}

function updateAttributes(vnode: VnodeWithDom, oldVnode: VnodeWithDom, isSVG: boolean = false) {
  for (let prop in vnode.props) {
    if (sharedSetAttribute(prop, vnode, oldVnode, isSVG) === false) {
      break;
    }
  }

  for (let prop in oldVnode.props) {
    if (prop in vnode.props === false && prop in reservedProps === false && typeof oldVnode.props[prop] !== "function") {
      if (prop in vnode.dom && isSVG === false) {
        vnode.dom[prop] = null;
      } else {
        vnode.dom.removeAttribute(prop);
      }
    }
  }
}

function callRemove(vnode: VnodeWithDom) {
  for (let i = 0, l = vnode.children.length; i < l; i++) {
    "nodeValue" in vnode.children[i] === false && callRemove(vnode.children[i]);
  }
  vnode.props.onremove && vnode.props.onremove(vnode);
}

function patch(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom, isSVG: boolean = false) {
  v.current.vnode = newVnode;
  v.current.oldVnode = oldVnode;
  let newTree = newVnode.children;
  let oldTree = oldVnode?.children || [];

  for (let i = 0; i < newTree.length; i++) {
    let childVnode = newTree[i];
    if (childVnode instanceof Vnode) {
      if ("view" in childVnode) {
        v.current.component = childVnode.view;
        let result = childVnode.view(childVnode.props, ...childVnode.children);

        newTree.splice(i--, 1, result);
      }
    } else if (Array.isArray(childVnode)) {
      newTree.splice(i--, 1, ...childVnode);
    } else if (childVnode === null || childVnode === undefined) {
      newTree.splice(i--, 1);
    } else {
      newTree[i] = new Vnode("#text", {}, []);
      newTree[i].nodeValue = childVnode;
    }
  }

  let oldTreeLength = oldTree.length;
  let newTreeLength = newTree.length;

  // If new tree is empty, remove all old nodes
  if (newTreeLength === 0) {
    for (let i = oldTreeLength - 1; i >= 0; i--) {
      let oldChild = oldTree[i];

      "nodeValue" in oldChild === false && callRemove(oldChild);

      newVnode.dom.textContent = "";
    }
    return;
  }

  // If the tree is keyed list and is not first render and old tree is keyed list too
  if (oldTreeLength && "key" in newTree[0].props && "key" in oldTree[0].props) {
    let oldKeyedList: { [key: string]: number } = {};
    for (let i = 0; i < oldTreeLength; i++) {
      oldKeyedList[oldTree[i].props.key] = i;
    }

    let newKeyedList: { [key: string]: number } = {};
    for (let i = 0; i < newTreeLength; i++) {
      newKeyedList[newTree[i].props.key] = i;
    }

    for (let i = 0; i < newTreeLength; i++) {
      let childVnode = newTree[i];
      let oldChildVnode = oldTree[oldKeyedList[childVnode.props.key]];
      let shouldPatch = true;

      if (oldChildVnode) {
        childVnode.dom = oldChildVnode.dom;
        if ("v-once" in childVnode.props || (childVnode.props.shouldupdate && childVnode.props.shouldupdate(childVnode, oldChildVnode) === false)) {
          // skip this patch
          childVnode.children = oldChildVnode.children;
          shouldPatch = false;
        } else {
          updateAttributes(childVnode, oldChildVnode);
          if (v.isMounted) {
            childVnode.props.onupdate && childVnode.props.onupdate(childVnode, oldChildVnode);
          } else {
            childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
          }
        }
      } else {
        childVnode.dom = createDomElement(childVnode.tag, childVnode.isSVG);
        addAttributes(childVnode);
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

    // For the rest of the children, we should remove them
    for (let i = newTreeLength; i < oldTreeLength; i++) {
      if (!newKeyedList[oldTree[i].props.key]) {
        let oldChildVnode = oldTree[i];
        callRemove(oldChildVnode);
        oldChildVnode.dom.parentNode && oldChildVnode.dom.parentNode.removeChild(oldChildVnode.dom);
      }
    }

    return;
  }

  // If new tree and old tree have more than one child, we should update the dom

  for (let i = 0; i < newTreeLength; i++) {
    let newChild = newTree[i];
    let oldChild = oldTree[i];

    if (!oldChild) {
      if (newChild.tag === "#text") {
        newChild.dom = document.createTextNode(newChild.nodeValue);
        newVnode.dom.appendChild(newChild.dom);
        continue;
      }

      isSVG = isSVG || newChild.tag === "svg";
      newChild.dom = createDomElement(newChild.tag, isSVG);
      addAttributes(newChild, isSVG);
      newVnode.dom.appendChild(newChild.dom);
      newChild.props.oncreate && newChild.props.oncreate(newChild);
      if (newChild.children.length > 0) {
        patch(newChild, undefined, isSVG);
      }
      continue;
    }

    if ("nodeValue" in newChild) {
      if ("nodeValue" in oldChild) {
        newChild.dom = oldChild.dom;
        // eslint-disable-next-line eqeqeq
        if (newChild.dom.nodeValue != newChild.nodeValue) {
          newChild.dom.nodeValue = newChild.nodeValue;
        }
        continue;
      }

      newChild.dom = document.createTextNode(newChild.nodeValue);
      "nodeValue" in oldChild === false && callRemove(oldChild);
      newVnode.dom.replaceChild(newChild.dom, oldChild.dom);
      continue;
    }

    isSVG = isSVG || newChild.tag === "svg";
    if (oldChild.tag !== newChild.tag) {
      newChild.dom = createDomElement(newChild.tag, isSVG);
      "nodeValue" in oldChild === false && callRemove(oldChild);
      addAttributes(newChild, isSVG);
      newVnode.dom.replaceChild(newChild.dom, oldChild.dom);
      newChild.props.oncreate && newChild.props.oncreate(newChild);
      patch(newChild, oldChild, isSVG);
      continue;
    }

    newChild.dom = oldChild.dom;
    if ("v-once" in newChild.props || ("shouldupdate" in newChild.props && newChild.props.shouldupdate(oldChild, newChild) === false)) {
      newChild.children = oldChild.children;
      continue;
    }

    updateAttributes(newChild, oldChild, isSVG);
    if (v.isMounted) {
      newChild.props.onupdate && newChild.props.onupdate(newChild, oldChild);
    } else {
      newChild.props.oncreate && newChild.props.oncreate(newChild);
    }

    patch(newChild, oldChild, isSVG);
  }

  // For the rest of the children, we should remove them
  for (let i = newTreeLength; i < oldTreeLength; i++) {
    let oldChild = oldTree[i];

    "nodeValue" in oldChild === false && callRemove(oldChild);

    newVnode.dom.removeChild(oldChild.dom);
  }
}

function update() {
  onCleanupList.length && callCallbackList(onCleanupList);
  if (v.component && v.container && v.mainVnode) {
    let oldVnode = v.mainVnode;
    v.mainVnode = v(oldVnode.tag, oldVnode.props, v.component) as VnodeWithDom;
    v.mainVnode.dom = oldVnode.dom;

    patch(v.mainVnode, oldVnode, v.mainVnode.tag === "svg");

    if (v.isMounted === false) {
      onMountList.length && callCallbackList(onMountList);
      v.isMounted = true;
    } else {
      onUpdateList.length && callCallbackList(onUpdateList);
    }

    if (isNodeJs) {
      return v.container.innerHTML;
    }
  }
}

function unmount() {
  onCleanupList.length && callCallbackList(onCleanupList);
  onUnmountList.length && callCallbackList(onUnmountList);
  if (v.component && v.container && v.mainVnode) {
    let oldVnode = v.mainVnode;
    v.mainVnode = v(oldVnode.tag, oldVnode.props) as VnodeWithDom;
    v.mainVnode.dom = oldVnode.dom;

    patch(v.mainVnode, oldVnode, v.mainVnode.tag === "svg");

    let container = v.container;
    v.container = null;
    v.component = null;
    v.isMounted = false;
    v.mainVnode = undefined;
    if (isNodeJs) {
      return container.innerHTML;
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

  if (normalComponent && typeof normalComponent === "object" && normalComponent.view) {
    v.component = v(
      normalComponent.view.bind(normalComponent),
      normalComponent.props || {},
      ...("children" in normalComponent ? (Array.isArray(normalComponent.children) ? normalComponent.children : [normalComponent.children]) : [])
    ) as ValyrianComponent;
  } else {
    v.component = v(
      normalComponent.bind(normalComponent),
      normalComponent.props || {},
      "children" in normalComponent ? (Array.isArray(normalComponent.children) ? normalComponent.children : [normalComponent.children]) : []
    ) as ValyrianComponent;
  }

  v.mainVnode = domToVnode(v.container) as VnodeWithDom;

  return update();
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
      if (oldVnode && oldVnode.dom && oldVnode.dom.parentNode) {
        oldVnode.tag !== "#text" && callRemove(oldVnode);
        oldVnode.dom.parentNode.replaceChild(newdom, oldVnode.dom);
      }
      vnode.tag = "#text";
      vnode.children = [];
      vnode.props = {};
      vnode.dom = newdom as unknown as DomElement;

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

export default v;
