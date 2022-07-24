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
  VnodeWithDom,
  VnodeComponent
} from "./interfaces2";

const TextTagString = "#text";
const NodeValueString = "nodeValue";

const isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);

const elementsToClone: {
  svg: Record<string, DomElement>;
  notSvg: Record<string, DomElement>;
  text: DomElement | null;
} = {
  svg: {},
  notSvg: {},
  text: null
};

function createDomElement(tag: string, isSVG: boolean = false): DomElement {
  // return (isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag)) as DomElement;

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

const VnodeComponent = function VnodeComponent(this: VnodeComponent, component: Component, props: Props, children: Children) {
  this.props = props;
  this.children = children;
  this.view = component;
} as unknown as VnodeComponent;

function domToVnode(dom: any): void | VnodeWithDom {
  if (dom.nodeType === 3) {
    let vnode = new Vnode(TextTagString, {}, []);
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

const v: Valyrian = function (tagOrComponent: string | Component, props: Props | null, ...children: any[]): Vnode | VnodeComponent {
  if (typeof tagOrComponent === "string") {
    return new Vnode(tagOrComponent, props || {}, children);
  }
  return new VnodeComponent(tagOrComponent, props || {}, children);
};

v.fragment = function (props: Props, ...children: Children) {
  return children;
};

v.isVnode = function isVnode(object?: unknown | Vnode): object is Vnode {
  return object instanceof Vnode;
};

v.isValyrianComponent = function isValyrianComponent(component?: unknown | ValyrianComponent): component is ValyrianComponent {
  return Boolean(component && typeof component === "object" && "view" in component);
};

v.isComponent = function isComponent(component?: unknown | ValyrianComponent): component is ValyrianComponent {
  return Boolean((component && typeof component === "function") || v.isValyrianComponent(component));
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

function sharedSetAttribute(prop: string, vnode: VnodeWithDom, oldVnode?: VnodeWithDom): void | boolean {
  // It is a reserved prop
  if (prop in reservedProps) {
    // If it is a directive name call the directive
    if (prop in directives) {
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

  if (prop in vnode.dom && vnode.isSVG === false) {
    // eslint-disable-next-line eqeqeq
    if (vnode.dom[prop] != value) {
      vnode.dom[prop] = value;
    }
    return;
  }

  // Use set attribute
  if (!oldVnode || oldVnode.props[prop] !== value) {
    if (value === false) {
      vnode.dom.removeAttribute(prop);
    } else {
      vnode.dom.setAttribute(prop, value);
    }
  }
}

function setAttribute(name: string, value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom): void {
  vnode.props[name] = value;
  sharedSetAttribute(name, vnode, oldVnode);
}

function setAttributes(vnode: VnodeWithDom, oldVnode?: VnodeWithDom) {
  for (let prop in vnode.props) {
    if (sharedSetAttribute(prop, vnode, oldVnode) === false) {
      return;
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

function callRemove(vnode: VnodeWithDom) {
  for (let i = 0, l = vnode.children.length; i < l; i++) {
    vnode.children[i] instanceof Vnode && callRemove(vnode.children[i]);
  }
  vnode.props.onremove && vnode.props.onremove(vnode);
}

function patch(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom) {
  v.current.vnode = newVnode;
  v.current.oldVnode = oldVnode;
  let newTree = newVnode.children;
  let oldTree = oldVnode?.children || [];
  let oldTreeLength = oldTree.length;

  // If there is a keyed oldchild and a keyed new child
  // We asume that all children are keyed vnodes
  if (newTree[0] instanceof Vnode && oldTreeLength && "key" in newTree[0].props && "key" in oldTree[0].props) {
    let newTreeLength = newTree.length;
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

  for (let i = 0; i < newTree.length; i++) {
    let newChild = newTree[i];

    // New child is vnode
    if (newChild instanceof Vnode) {
      let oldChild: VnodeWithDom | undefined = oldTree[i];

      // New child is text node
      if (NodeValueString in newChild) {
        if (!oldChild) {
          newChild.dom = (elementsToClone.text as DomElement).cloneNode(false) as DomElement;
          newChild.dom.nodeValue = newChild.nodeValue as string;
          newVnode.dom.appendChild(newChild.dom);
          continue;
        }

        if (NodeValueString in oldChild) {
          newChild.dom = oldChild.dom;
          // eslint-disable-next-line eqeqeq
          if (newChild.dom.nodeValue != newChild.nodeValue) {
            newChild.dom.nodeValue = newChild.nodeValue as string;
          }
          continue;
        }

        newChild.dom = (elementsToClone.text as DomElement).cloneNode(false) as DomElement;
        newChild.dom.nodeValue = newChild.nodeValue as string;
        NodeValueString in oldChild === false && callRemove(oldChild);
        newVnode.dom.replaceChild(newChild.dom, oldChild.dom);
        continue;
      }

      newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";

      if (!oldChild) {
        newChild.dom = createDomElement(newChild.tag, newChild.isSVG);
        setAttributes(newChild as VnodeWithDom);
        newChild.props.oncreate && newChild.props.oncreate(newChild);
        patch(newChild as VnodeWithDom);
        newVnode.dom.appendChild(newChild.dom);
        continue;
      }

      if (oldChild.tag === newChild.tag) {
        newChild.dom = oldChild.dom;
        if ("v-once" in newChild.props || ("shouldupdate" in newChild.props && newChild.props.shouldupdate(oldChild, newChild) === false)) {
          newChild.children = oldChild.children;
          continue;
        }

        setAttributes(newChild as VnodeWithDom, oldChild);
        if (v.isMounted) {
          newChild.props.onupdate && newChild.props.onupdate(newChild, oldChild);
        } else {
          newChild.props.oncreate && newChild.props.oncreate(newChild);
        }
        patch(newChild as VnodeWithDom, oldChild);
        continue;
      }

      newChild.dom = createDomElement(newChild.tag);
      NodeValueString in oldChild === false && callRemove(oldChild);
      setAttributes(newChild as VnodeWithDom);
      newChild.props.oncreate && newChild.props.oncreate(newChild);
      newVnode.dom.replaceChild(newChild.dom, oldChild.dom);
      patch(newChild as VnodeWithDom);
      continue;
    }

    // New child is null or undefined so skip it
    if (newChild === null || newChild === undefined) {
      newTree.splice(i--, 1);
      continue;
    }

    // New child is an array so flat it
    if (Array.isArray(newChild)) {
      newTree.splice(i--, 1, ...newChild);
      continue;
    }

    // New child is component
    if (newChild instanceof VnodeComponent) {
      v.current.component = newChild.view;
      newTree.splice(i--, 1, newChild.view(newChild.props, ...newChild.children));
      continue;
    }

    if (i > 0 && NodeValueString in newTree[i - 1]) {
      newTree[i - 1].dom.nodeValue += newChild;
      newTree.splice(i--, 1);
      continue;
    }

    // Is Text node
    newTree[i] = new Vnode(TextTagString, {}, []);
    newTree[i].nodeValue = String(newChild);
    i--;
  }

  // If new tree is empty, fast remove all old nodes
  if (newTree.length === 0) {
    for (let i = oldTreeLength - 1; i >= 0; i--) {
      let oldChild = oldTree[i];
      NodeValueString in oldChild === false && callRemove(oldChild);
      newVnode.dom.textContent = "";
    }
    return;
  }

  // For the rest of the children, we should remove them
  for (let i = newTree.length; i < oldTreeLength; i++) {
    let oldChild = oldTree[i];
    NodeValueString in oldChild === false && callRemove(oldChild);
    oldChild.dom.parentNode && oldChild.dom.parentNode.removeChild(oldChild.dom);
  }
}

function update() {
  if (v.component && v.mainVnode) {
    onCleanupList.length && callCallbackList(onCleanupList);
    let oldVnode: null | VnodeWithDom = v.mainVnode;
    v.mainVnode = new Vnode(oldVnode.tag, oldVnode.props, [v.component]) as VnodeWithDom;
    v.mainVnode.dom = oldVnode.dom;
    v.mainVnode.isSVG = oldVnode.isSVG;

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

let emptyComponent = new VnodeComponent(() => null, {}, []);

function unmount() {
  if (v.component && v.mainVnode) {
    onCleanupList.length && callCallbackList(onCleanupList);
    onUnmountList.length && callCallbackList(onUnmountList);
    v.component = emptyComponent;
    let result = v.update();
    v.container = null;
    v.isMounted = false;
    if (isNodeJs) {
      return result;
    }
  }
}

function mount(container: string | Element, normalComponent: Component | ValyrianComponent | VnodeComponent) {
  if (v.isMounted) {
    v.unmount();
  }

  if (isNodeJs) {
    v.container = typeof container === "string" ? createDomElement(container === "svg" ? "svg" : "div", container === "svg") : container;
  } else {
    v.container = typeof container === "string" ? document.querySelectorAll(container)[0] : container;
  }

  if (normalComponent instanceof VnodeComponent) {
    v.component = normalComponent;
  } else {
    v.component = v(
      normalComponent.view ? normalComponent.view.bind(normalComponent) : normalComponent.bind(normalComponent),
      normalComponent.props || {},
      ...("children" in normalComponent ? (Array.isArray(normalComponent.children) ? normalComponent.children : [normalComponent.children]) : [])
    ) as VnodeComponent;
  }
  v.mainVnode = domToVnode(v.container) as VnodeWithDom;
  v.mainVnode.isSVG = v.mainVnode.tag === "svg";

  // Just to facilitate the text node creation
  if (!elementsToClone.text) {
    elementsToClone.text = document.createTextNode("") as unknown as DomElement;
  }

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
      let newdom = (elementsToClone.text as DomElement).cloneNode(false) as DomElement;
      if (oldVnode && oldVnode.dom && oldVnode.dom.parentNode) {
        NodeValueString in oldVnode && callRemove(oldVnode);
        oldVnode.dom.parentNode.replaceChild(newdom, oldVnode.dom);
      }
      vnode.tag = TextTagString;
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
