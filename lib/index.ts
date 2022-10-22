/* eslint-disable indent */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable complexity */

import {
  Children,
  Component,
  Current,
  Directive,
  Directives,
  DomElement,
  Props,
  V,
  VnodeComponentInterface,
  VnodeInterface,
  VnodeWithDom
} from "valyrian.js";

export * from "valyrian.js";

const textTag = "#text";

export let isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);

export function createDomElement(tag: string, isSVG: boolean = false): DomElement {
  return isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
}

export const Vnode = function Vnode(this: VnodeInterface, tag: string, props: Props, children: Children) {
  this.tag = tag;
  this.props = props;
  this.children = children;
} as unknown as VnodeInterface;

export function isComponent(component): component is Component {
  return component && (typeof component === "function" || (typeof component === "object" && "view" in component));
}

export const isVnode = (object?: unknown | VnodeInterface): object is VnodeInterface => {
  return object instanceof Vnode;
};

export const isVnodeComponent = (object?: unknown | VnodeComponentInterface): object is VnodeComponentInterface => {
  return isVnode(object) && isComponent(object.tag);
};

// Transforms a DOM node to a VNode
function domToVnode(dom: any): VnodeWithDom {
  let children: VnodeWithDom[] = [];
  for (let i = 0, l = dom.childNodes.length; i < l; i++) {
    let childDom = dom.childNodes[i];
    if (childDom.nodeType === 3) {
      let vnode = new Vnode(textTag, {}, []);
      vnode.dom = childDom;
      children.push(vnode as VnodeWithDom);
      continue;
    }

    if (childDom.nodeType === 1) {
      children.push(domToVnode(childDom));
    }
  }

  let props: Props = {};
  for (let i = 0, l = dom.attributes.length; i < l; i++) {
    let attr = dom.attributes[i];
    props[attr.nodeName] = attr.nodeValue;
  }

  let vnode = new Vnode(dom.tagName.toLowerCase(), props, children);
  vnode.dom = dom;
  return vnode as VnodeWithDom;
}

export function trust(htmlString: string) {
  let div = createDomElement("div");
  div.innerHTML = htmlString.trim();

  return [].map.call(div.childNodes, (item) => domToVnode(item));
}

/* ========================================================================== */
/* Main Component implementation                                              */
/* ========================================================================== */

let mainComponent: VnodeComponentInterface | null = null;
let mainVnode: VnodeWithDom | null = null;
let isMounted = false;

export const current: Current = {
  vnode: null,
  oldVnode: null,
  component: null
};

/* Reserved props ----------------------------------------------------------- */
export const reservedProps: Record<string, true> = {
  key: true,
  state: true,
  "v-keep": true,

  // Built in directives
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

/* Mounting, Updating, Cleanup and Unmounting ------------------------------- */
const onCleanupSet: Set<Function> = new Set();
const onMountSet: Set<Function> = new Set();
const onUpdateSet: Set<Function> = new Set();
const onUnmountSet: Set<Function> = new Set();

export function onMount(callback) {
  onMountSet.add(callback);
}

export function onUpdate(callback) {
  onUpdateSet.add(callback);
}

export function onCleanup(callback) {
  onCleanupSet.add(callback);
}

export function onUnmount(callback) {
  onUnmountSet.add(callback);
}

function callSet(set) {
  for (let callback of set) {
    callback();
  }

  set.clear();
}

/* Event listener ----------------------------------------------------------- */
const eventListenerNames: Record<string, true> = {};
function eventListener(e: Event) {
  let dom = e.target as DomElement;
  let name = `v-on${e.type}`;
  while (dom) {
    if (dom[name]) {
      dom[name](e, dom);
      if (!e.defaultPrevented) {
        // eslint-disable-next-line no-use-before-define
        update();
      }
      return;
    }
    dom = dom.parentNode as DomElement;
  }
}

/* Directives --------------------------------------------------------------- */
let hideDirective = (test: boolean) => (bool: boolean, vnode: VnodeInterface, oldnode?: VnodeInterface) => {
  let value = test ? bool : !bool;
  if (value) {
    let newdom = document.createTextNode("");
    if (oldnode && oldnode.dom && oldnode.dom.parentNode) {
      oldnode.dom.parentNode.replaceChild(newdom, oldnode.dom);
    }
    vnode.tag = "#text";
    vnode.children = [];
    vnode.props = {};
    vnode.dom = newdom as unknown as DomElement;
    return false;
  }
};

export const directives: Directives = {
  "v-if": hideDirective(false),
  "v-unless": hideDirective(true),
  "v-for": (set: unknown[], vnode: VnodeWithDom) => {
    let newChildren: VnodeInterface[] = [];
    let callback = vnode.children[0];
    for (let i = 0, l = set.length; i < l; i++) {
      newChildren.push(callback(set[i], i));
    }
    vnode.children = newChildren;
  },
  "v-show": (bool: boolean, vnode: VnodeWithDom) => {
    (
      vnode.dom as unknown as {
        style: { display: string };
      }
    ).style.display = bool ? "" : "none";
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
    // We try to identify if the old vnode has the v-model directive initialized or not
    // If it is, we don't need to reinitialize it
    if (oldVnode && oldVnode.dom === vnode.dom) {
      let [oldModel, oldProperty, oldEvent] = oldVnode.props["v-model"] || [];

      if (oldModel === model && oldProperty === property && oldEvent === event) {
        return;
      }
    }

    let value;
    let handler = (e: Event) => (model[property] = (e.target as DomElement & Record<string, any>).value);
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
          // eslint-disable-next-line no-use-before-define
          sharedSetAttribute("checked", value, vnode);
          break;
        }
        case "radio": {
          // eslint-disable-next-line no-use-before-define
          sharedSetAttribute("checked", model[property] === vnode.dom.value, vnode);
          break;
        }
        default: {
          // eslint-disable-next-line no-use-before-define
          sharedSetAttribute("value", model[property], vnode);
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
        vnode.children.forEach((child: VnodeInterface) => {
          if (child.tag === "option") {
            let value = "value" in child.props ? child.props.value : child.children.join("").trim();
            child.props.selected = model[property].indexOf(value) !== -1;
          }
        });
      } else {
        vnode.children.forEach((child: VnodeInterface) => {
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

    // We assume that the prev handler if any will not be changed by the user across patchs
    let prevHandler = vnode.props[event];

    // eslint-disable-next-line no-use-before-define
    sharedSetAttribute(
      event,
      (e: Event) => {
        handler(e);

        // If the user has defined a handler for the event, we call it right away
        if (prevHandler) {
          prevHandler(e);
        }
      },
      vnode,
      oldVnode
    );
  },

  // eslint-disable-next-line no-unused-vars
  "v-create": (callback: (vnode: VnodeWithDom) => void, vnode: VnodeWithDom, oldVnode?: VnodeWithDom) => {
    if (!oldVnode) {
      callback(vnode);
    }
  },

  "v-update": (
    // eslint-disable-next-line no-unused-vars
    callback: (vnode: VnodeWithDom, oldVnode: VnodeWithDom) => void,
    vnode: VnodeWithDom,
    oldVnode?: VnodeWithDom
  ) => {
    if (oldVnode) {
      callback(vnode, oldVnode);
    }
  },

  "v-cleanup": (
    // eslint-disable-next-line no-unused-vars
    callback: (vnode: VnodeWithDom, oldVnode?: VnodeWithDom) => void,
    vnode: VnodeWithDom,
    oldVnode?: VnodeWithDom
  ) => {
    onCleanup(() => callback(vnode, oldVnode));
  }
};

export function directive(name: string, directive: Directive) {
  let directiveName = `v-${name}`;
  directives[directiveName] = directive;
  reservedProps[directiveName] = true;
}

/* Set attribute ------------------------------------------------------------ */
function sharedSetAttribute(name: string, value: any, newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void | boolean {
  if (typeof value === "function") {
    if (name in eventListenerNames === false) {
      (mainVnode as VnodeWithDom).dom.addEventListener(name.slice(2), eventListener);
      eventListenerNames[name] = true;
    }
    newVnode.dom[`v-${name}`] = value;
    return;
  }

  if (name in newVnode.dom && newVnode.isSVG === false) {
    // eslint-disable-next-line eqeqeq
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

export function setAttribute(name: string, value: any, newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void {
  if (name in reservedProps) {
    return;
  }
  newVnode.props[name] = value;
  sharedSetAttribute(name, value, newVnode as VnodeWithDom, oldVnode);
}

export function updateAttributes(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void {
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

/* patch ------------------------------------------------------------------- */

// Patch a DOM node with a new VNode tree
export function patch(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void {
  let newTree = newVnode.children;
  let oldTree = oldVnode?.children || [];
  let oldTreeLength = oldTree.length;

  // Is keyed list and update in place
  if (oldTreeLength && newTree[0] instanceof Vnode && "key" in newTree[0].props && "key" in oldTree[0].props) {
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

    // For the rest of the children, we should remove them
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

  // Flat newTree
  for (let i = 0; i < newTree.length; i++) {
    let newChild = newTree[i];

    if (newChild instanceof Vnode && newChild.tag !== textTag) {
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
        continue;
      }

      newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";

      if (i < oldTreeLength) {
        let oldChild = oldTree[i];
        if (newChild.tag === oldChild.tag) {
          newChild.dom = oldChild.dom;
          if ("v-keep" in newChild.props && newChild.props["v-keep"] === oldChild.props["v-keep"]) {
            newChild.children = oldChild.children;
            continue;
          }

          updateAttributes(newChild as VnodeWithDom, oldChild);
          patch(newChild as VnodeWithDom, oldChild);
          continue;
        }

        newChild.dom = createDomElement(newChild.tag, newChild.isSVG);
        updateAttributes(newChild as VnodeWithDom);
        newVnode.dom.replaceChild(newChild.dom, oldChild.dom);
        patch(newChild as VnodeWithDom);
        continue;
      }

      newChild.dom = createDomElement(newChild.tag, newChild.isSVG);
      updateAttributes(newChild as VnodeWithDom);
      newVnode.dom.appendChild(newChild.dom);
      patch(newChild as VnodeWithDom);
      continue;
    }

    if (Array.isArray(newChild)) {
      newTree.splice(i--, 1, ...newChild);
      continue;
    }

    if (newChild === null || newChild === undefined) {
      newTree.splice(i--, 1);
      continue;
    }

    newTree[i] = new Vnode(textTag, {}, []);
    if (newChild instanceof Vnode) {
      newTree[i].dom = newChild.dom;
      newChild = (newChild as VnodeWithDom).dom.textContent;
    }

    if (i < oldTreeLength) {
      let oldChild = oldTree[i];

      if (oldChild.tag === textTag) {
        newTree[i].dom = oldChild.dom;
        // eslint-disable-next-line eqeqeq
        if (newChild != oldChild.dom.textContent) {
          oldChild.dom.textContent = newChild;
        }
        continue;
      }

      newTree[i].dom = document.createTextNode(newChild);
      newVnode.dom.replaceChild(newTree[i].dom, oldChild.dom);
      continue;
    }

    newTree[i].dom = document.createTextNode(newChild);
    newVnode.dom.appendChild(newTree[i].dom);
  }

  for (let i = newTree.length; i < oldTreeLength; i++) {
    newVnode.dom.removeChild(oldTree[i].dom);
  }
}

export function update(): void | string {
  if (mainVnode) {
    callSet(onCleanupSet);
    let oldMainVnode = mainVnode;
    mainVnode = new Vnode(oldMainVnode.tag, oldMainVnode.props, [mainComponent]) as VnodeWithDom;
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

export function unmount() {
  if (mainVnode) {
    mainComponent = new Vnode(() => null, {}, []) as VnodeComponentInterface;
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

export function mount(dom, component) {
  let container =
    typeof dom === "string"
      ? isNodeJs
        ? createDomElement(dom, dom === "svg")
        : document.querySelectorAll(dom)[0]
      : dom;

  let vnodeComponent = isVnodeComponent(component)
    ? component
    : isComponent(component)
    ? new Vnode(component, {}, [])
    : new Vnode(() => component, {}, []);

  if (mainComponent && mainComponent.tag !== vnodeComponent.tag) {
    unmount();
  }

  mainComponent = vnodeComponent as VnodeComponentInterface;
  mainVnode = domToVnode(container);
  return update();
}

export const v: V = (tagOrComponent, props = {}, ...children) => {
  return new Vnode(tagOrComponent, props || {}, children);
};

v.fragment = (props: Props, ...children: Children) => children;
