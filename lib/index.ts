/* eslint-disable indent */
/* eslint-disable eqeqeq */
/* eslint-disable complexity */
declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var document: Document;
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface DefaultRecord extends Record<string | number | symbol, any> {}

export interface VnodeProperties extends DefaultRecord {
  key?: string | number;
}

export interface DomElement extends Element, DefaultRecord {}

export interface DomElementWithVnode extends DomElement {
  vnode: VnodeWithDom;
}

export interface Component extends DefaultRecord {
  (props: VnodeProperties, children: any[]): Vnode | any;
}

export interface POJOComponent extends DefaultRecord {
  view: Component;
}

export type ValyrianComponent = Component | POJOComponent;

export interface VnodeComponentInterface extends Vnode {
  tag: ValyrianComponent;
}

export interface Children extends Array<Vnode | VnodeComponentInterface | ValyrianComponent | any> {}

export interface Directive {
  (vnode: VnodeWithDom, oldVnode: VnodeWithDom | null): void | boolean;
}

export const isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);

const byStringMatcherCache: Record<string, (vnode: VnodeWithDom) => boolean> = {};
const byStringMatcherRegex = /^([^.#]*)?#?([^.]*)?(.*)?$/;

function byStringMatcher(string: string) {
  if (!byStringMatcherCache[string]) {
    // Use regular expression to extract tag, id, and classes
    const match = byStringMatcherRegex.exec(string) as RegExpMatchArray;
    const tag = match[1];
    const id = match[2];
    const classes = match[3] ? match[3].split(".").splice(1) : null;

    let matcher: (vnode: VnodeWithDom) => boolean = (vnode: VnodeWithDom) => vnode instanceof Vnode;
    if (tag) {
      const previousMatcher = matcher;
      matcher = (vnode: VnodeWithDom) => previousMatcher(vnode) && vnode.tag === tag;
    }

    if (id) {
      const previousMatcher = matcher;
      matcher = (vnode: VnodeWithDom) => previousMatcher(vnode) && vnode.dom.id === id;
    }

    if (classes) {
      const previousMatcher = matcher;
      matcher = (vnode: VnodeWithDom) => {
        if (!previousMatcher(vnode)) {
          return false;
        }

        for (const className of classes) {
          if (!vnode.dom.classList.contains(className)) {
            return false;
          }
        }

        return true;
      };
    }

    byStringMatcherCache[string] = matcher;
  }

  return byStringMatcherCache[string];
}

export class Vnode {
  constructor(
    public tag: string | Component | POJOComponent,
    public props: VnodeProperties,
    public children: Children,
    public dom?: DomElementWithVnode,
    public processed?: boolean,
    public isSVG?: boolean,
    public _parent?: Vnode
  ) {}

  parent(matcher?: string | ((vnode: VnodeWithDom) => boolean)): Vnode | void {
    if (!matcher) {
      return this._parent;
    }

    const finalMatcher = typeof matcher === "string" ? byStringMatcher(matcher) : matcher;

    let parent = this._parent as VnodeWithDom;
    while (parent) {
      if (finalMatcher(parent)) {
        return parent;
      }
      parent = parent._parent;
    }
  }

  findChild(filter: string | ((vnode: VnodeWithDom) => boolean)): VnodeWithDom | void {
    const finalFilter =
      typeof filter === "string"
        ? byStringMatcher(filter)
        : (vnode: VnodeWithDom) => vnode instanceof Vnode && filter(vnode);

    for (let i = 0, l = this.children.length; i < l; i++) {
      const child = this.children[i];
      if (finalFilter(child as VnodeWithDom)) {
        return child as VnodeWithDom;
      }
    }

    for (let i = 0, l = this.children.length; i < l; i++) {
      const child = this.children[i];
      if (child instanceof Vnode) {
        const result = child.findChild(finalFilter);
        if (result) {
          return result;
        }
      }
    }
  }

  filterChildren(filter: string | ((vnode: VnodeWithDom, i: number) => boolean)): VnodeWithDom[] {
    const finalFilter =
      typeof filter === "string"
        ? byStringMatcher(filter)
        : (vnode: VnodeWithDom, i: number) => vnode instanceof Vnode && filter(vnode, i);
    const result: VnodeWithDom[] = [];
    for (let i = 0, l = this.children.length; i < l; i++) {
      const child = this.children[i];
      if (finalFilter(child as VnodeWithDom, i)) {
        result.push(child as VnodeWithDom);
      }
    }

    return result;
  }

  get(index: number): VnodeWithDom | void {
    return this.children[index];
  }

  remove(this: VnodeWithDom) {
    this.dom.remove();
    cleanupVnodeChildren(this);
    domToVnodeWeakMap.delete(this.dom);
    this._parent.children.splice(this._parent.children.indexOf(this), 1);
  }

  replace(this: VnodeWithDom, newChild: VnodeWithDom) {
    this._parent.children.splice(this._parent.children.indexOf(this), 1, newChild);
    processVnode(this._parent, newChild, this.dom);
    cleanupVnodeChildren(this);
    domToVnodeWeakMap.delete(this.dom);
  }
}

export interface VnodeWithDom extends Vnode {
  tag: string;
  dom: DomElementWithVnode;
  _parent: VnodeWithDom;
}

export const isComponent = (component: unknown): component is Component => typeof component === "function";
export const isVnode = (object?: unknown): object is Vnode => object instanceof Vnode;

export const isVnodeComponent = (object?: unknown): object is VnodeComponentInterface => {
  return isVnode(object) && isComponent(object.tag);
};

export function domToVnode(dom: any): VnodeWithDom {
  if (dom.nodeType === 3) {
    return dom.nodeValue;
  }

  const vnode = new Vnode(dom.nodeName.toLowerCase(), {}, []) as VnodeWithDom;
  vnode.dom = dom;
  domToVnodeWeakMap.set(dom, vnode);

  for (let i = 0, l = dom.childNodes.length; i < l; i++) {
    const childDom = dom.childNodes[i];
    if (childDom.nodeType === 3) {
      vnode.children.push(childDom.nodeValue);
    } else if (childDom.nodeType === 1) {
      const childVnode = domToVnode(childDom);
      childVnode._parent = vnode;
      vnode.children.push();
    }
  }

  for (let i = 0, l = dom.attributes.length; i < l; i++) {
    const attr = dom.attributes[i];
    vnode.props[attr.nodeName] = attr.nodeValue;
  }

  return vnode as VnodeWithDom;
}

export function trust(htmlString: string) {
  const div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  return Array.from(div.childNodes).map(domToVnode);
}

let mainComponent: VnodeComponentInterface | null = null;
let mainVnode: VnodeWithDom | null = null;
let isMounted = false;

// This object is used to store the current virtual node and component being rendered.
export const current = {
  vnode: null as Vnode | null,
  component: null as ValyrianComponent | null,
  event: null as Event | null
};

/* Reserved props ----------------------------------------------------------- */
// This object is used to store the names of reserved props, which are props that are reserved
// for special purposes and should not be used as regular component props.
export const reservedProps: Record<string, true> = {
  key: true,
  state: true,
  "v-keep": true, // Used to keep the element when the parent is updated
  "v-text": true, // Used to set the text content of an element

  // Built in directives
  "v-if": true,
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
const onCleanupSet = new Set<Function>();
const onMountSet = new Set<Function>();
const onUpdateSet = new Set<Function>();
const onUnmountSet = new Set<Function>();
export const onMount = (callback: Function) => !isMounted && onMountSet.add(callback);
export const onUpdate = (callback: Function) => onUpdateSet.add(callback);
export const onCleanup = (callback: Function) => onCleanupSet.add(callback);
export const onUnmount = (callback: Function) => !isMounted && onUnmountSet.add(callback);
const callSet = (set: Set<Function>) => {
  for (const callback of set) {
    callback();
  }
  set.clear();
};

/* Directives --------------------------------------------------------------- */
export const directives: Record<string, Directive> = {
  "v-if": (vnode: VnodeWithDom) => {
    const bool = Boolean(vnode.props["v-if"]);
    if (bool) {
      const parentNode = vnode.dom?.parentNode;
      if (parentNode) {
        const newdom = document.createTextNode("");
        parentNode.replaceChild(newdom, vnode.dom);
      }

      return false;
    }
  },

  "v-for": (vnode: VnodeWithDom) => {
    const [set, callback] = vnode.props["v-for"];
    for (let i = 0, l = set.length; i < l; i++) {
      vnode.children.push(callback(set[i], i));
    }
  },

  "v-show": (vnode: VnodeWithDom) => {
    const bool = Boolean(vnode.props["v-show"]);
    (
      vnode.dom as unknown as {
        style: { display: string };
      }
    ).style.display = bool ? "" : "none";
  },

  "v-class": (vnode: VnodeWithDom) => {
    const classes = vnode.props["v-class"];
    const classList = (vnode.dom as DomElement).classList;
    for (const name in classes) {
      const value = typeof classes[name] === "function" ? (classes[name] as Function)() : classes[name];
      classList.toggle(name, value);
    }
  },

  "v-html": (vnode: VnodeWithDom) => {
    vnode.children = [trust(vnode.props["v-html"])];
  },

  "v-create": (vnode: VnodeWithDom, oldVnode: VnodeWithDom | null) => {
    if (!oldVnode) {
      const callback = vnode.props["v-create"];
      const cleanup = callback(vnode);

      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },

  "v-update": (vnode: VnodeWithDom, oldVnode: VnodeWithDom | null) => {
    if (oldVnode) {
      const callback = vnode.props["v-update"];
      const cleanup = callback(vnode, oldVnode);

      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },

  "v-cleanup": (vnode: VnodeWithDom) => {
    const callback = vnode.props["v-cleanup"];
    onCleanup(() => callback(vnode));
  }
};

export function directive(name: string, directive: Directive) {
  const directiveName = `v-${name}`;
  directives[directiveName] = directive;
  reservedProps[directiveName] = true;
}

/* Event listener ----------------------------------------------------------- */
const eventListenerNames: Record<string, true> = {};

function eventListener(e: Event) {
  current.event = e;
  let dom = e.target as DomElement;
  const name = `on${e.type}`;

  while (dom) {
    const oldVnode = domToVnodeWeakMap.get(dom);
    if (oldVnode && oldVnode.props[name]) {
      oldVnode.props[name](e, oldVnode);

      if (!e.defaultPrevented) {
        update();
      }
      return;
    }
    dom = dom.parentNode as DomElement;
  }

  current.event = null;
}

function sharedSetAttribute(
  name: string,
  value: any,
  newVnode: VnodeWithDom,
  oldVnode: VnodeWithDom | null
): void | boolean {
  if (typeof value === "function") {
    if (name in eventListenerNames === false) {
      (mainVnode as VnodeWithDom).dom.addEventListener(name.slice(2), eventListener);
      eventListenerNames[name] = true;
    }
    return;
  }

  if (name === "style" && typeof value === "object") {
    // Apply styles
    for (const styleKey in value) {
      if (value.hasOwnProperty(styleKey)) {
        newVnode.dom.style[styleKey] = value[styleKey];
      }
    }
    return;
  }

  if (name in newVnode.dom) {
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

export function setAttribute(name: string, value: any, newVnode: VnodeWithDom, oldVnode: VnodeWithDom | null): void {
  if (!reservedProps[name]) {
    newVnode.props[name] = value;
    sharedSetAttribute(name, value, newVnode, oldVnode);
  }
}

function removeAttributes(vnode: VnodeWithDom, oldVnode: VnodeWithDom | null): void {
  if (oldVnode) {
    for (const name in oldVnode.props) {
      if (!vnode.props[name] && !eventListenerNames[name] && !reservedProps[name]) {
        if (name in vnode.dom) {
          vnode.dom[name] = null;
        } else {
          vnode.dom.removeAttribute(name);
        }
      }
    }
  }
}

function addProperties(vnode: VnodeWithDom, oldVnode: VnodeWithDom | null) {
  for (const name in vnode.props) {
    if (reservedProps[name]) {
      if (directives[name] && directives[name](vnode, oldVnode) === false) {
        break;
      }
      continue;
    }
    sharedSetAttribute(name, vnode.props[name], vnode, oldVnode);
  }
}

export function updateAttributes(newVnode: VnodeWithDom, oldVnode: VnodeWithDom | null): void {
  removeAttributes(newVnode, oldVnode);
  addProperties(newVnode, oldVnode);
}

/* patch ------------------------------------------------------------------- */

const domToVnodeWeakMap = new WeakMap<DomElement, VnodeWithDom>();

function createElement(tag: string, isSVG: boolean): DomElement {
  return isSVG
    ? document.createElementNS("http://www.w3.org/2000/svg", tag)
    : (document.createElement(tag) as DomElement);
}

function createNewElement(vnode: any, parentVnode: VnodeWithDom) {
  if (vnode instanceof Vnode === false) {
    return document.createTextNode(vnode);
  }

  vnode._parent = parentVnode;
  const dom = createElement(vnode.tag, vnode.isSVG);
  vnode.dom = dom;
  domToVnodeWeakMap.set(dom, vnode);
  addProperties(vnode, null);

  if ("v-text" in vnode.props) {
    dom.textContent = vnode.props["v-text"];
    return dom;
  }

  flatTree(vnode);

  if (vnode.children.length === 0) {
    return dom;
  }

  for (let i = 0, l = vnode.children.length; i < l; i++) {
    const childVnode = vnode.children[i];
    const childEl = createNewElement(childVnode, vnode);
    dom.appendChild(childEl);
  }

  return dom;
}

function cleanupVnodeChildren(vnode: VnodeWithDom) {
  for (let i = 0, l = vnode.dom.childNodes.length; i < l; i++) {
    const child = vnode.dom.childNodes[i];
    if (domToVnodeWeakMap.has(child as DomElement)) {
      const oldVnode = domToVnodeWeakMap.get(child as DomElement) as VnodeWithDom;
      cleanupVnodeChildren(oldVnode);
      domToVnodeWeakMap.delete(child as DomElement);
    }
  }
}

function processVnode(newVnode: VnodeWithDom, newChild: VnodeWithDom, oldChild: DomElement): void {
  newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";

  if (!oldChild || newChild.tag !== oldChild.nodeName.toLowerCase()) {
    newChild.dom = createNewElement(newChild, newVnode) as DomElementWithVnode;
    if (oldChild) {
      newVnode.dom.replaceChild(newChild.dom, oldChild);
    } else {
      newVnode.dom.appendChild(newChild.dom);
    }
    return;
  }

  newChild._parent = newVnode;
  const oldVnode = domToVnodeWeakMap.get(oldChild);
  newChild.dom = oldChild as DomElementWithVnode;
  domToVnodeWeakMap.set(oldChild, newChild);

  if (oldVnode && "v-keep" in newChild.props && newChild.props["v-keep"] === oldVnode.props["v-keep"]) {
    newChild.children = oldVnode.children;
    return;
  }

  updateAttributes(newChild as VnodeWithDom, oldVnode || null);

  if ("v-text" in newChild.props) {
    if (newChild.dom.textContent != newChild.props["v-text"]) {
      newChild.dom.textContent = newChild.props["v-text"];
    }
    return;
  }

  if (newChild.children.length === 0) {
    if (newChild.dom.childNodes.length > 0) {
      newChild.dom.textContent = "";
      cleanupVnodeChildren(newChild);
    }
    return;
  }

  patch(newChild as VnodeWithDom);
}

function flatTree(newVnode: VnodeWithDom) {
  current.vnode = newVnode;
  const { children } = newVnode;
  let i = 0;

  while (i < children.length) {
    const newChild = children[i];

    if (newChild == null) {
      children.splice(i, 1);
      continue;
    }

    if (Array.isArray(newChild)) {
      children.splice(i, 1, ...newChild);
      continue;
    }

    if (newChild instanceof Vnode && typeof newChild.tag !== "string") {
      const component = ("view" in newChild.tag ? newChild.tag.view : newChild.tag).bind(newChild.tag);
      current.component = component;
      children[i] = component(newChild.props, newChild.children);
    }

    i++;
  }
}

export function patch(newVnode: VnodeWithDom): void {
  flatTree(newVnode);
  const { dom, children } = newVnode;
  const newTreeLength = children.length;

  if (newTreeLength === 0) {
    dom.textContent = "";
    cleanupVnodeChildren(newVnode);
    return;
  }

  const oldTree = dom.childNodes as unknown as DomElementWithVnode[];
  const oldTreeLength = oldTree.length;
  const firstOldVnode = oldTree[0] && domToVnodeWeakMap.get(oldTree[0]);

  if (firstOldVnode && children[0] instanceof Vnode && "key" in children[0].props && "key" in firstOldVnode.props) {
    const oldKeyedList: Record<string, number> = {};
    const newKeyedList: Record<string, number> = {};
    const childNodes = newVnode.dom.childNodes;

    // Create key maps while also handling removal of nodes not present in children
    for (let i = 0; i < oldTreeLength; i++) {
      const oldVnode = domToVnodeWeakMap.get(oldTree[i]);
      oldKeyedList[oldVnode?.props.key as any] = i;
      if (i < newTreeLength) {
        newKeyedList[children[i].props.key] = i;
      }
    }

    for (let i = 0; i < newTreeLength; i++) {
      const newChild = children[i];
      newChild._parent = newVnode;
      newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";
      const oldChildIndex = oldKeyedList[newChild.props.key];
      const oldChild = oldTree[oldChildIndex];
      let shouldPatch = true;

      if (oldChild) {
        newChild.dom = oldChild;
        const oldVnode = domToVnodeWeakMap.get(oldChild) as VnodeWithDom;

        newChild.dom = oldChild;
        domToVnodeWeakMap.set(oldChild, newChild);

        if (oldVnode && "v-keep" in newChild.props && newChild.props["v-keep"] === oldVnode.props["v-keep"]) {
          newChild.children = oldVnode.children;
          shouldPatch = false;
        } else {
          updateAttributes(newChild, oldVnode);
          if ("v-text" in newChild.props) {
            if (newChild.dom.textContent != newChild.props["v-text"]) {
              newChild.dom.textContent = newChild.props["v-text"];
            }
            shouldPatch = false;
          } else if (newChild.children.length === 0) {
            if (newChild.dom.childNodes.length > 0) {
              newChild.dom.textContent = "";
              cleanupVnodeChildren(newChild);
            }
            shouldPatch = false;
          }
        }
      } else {
        newChild.dom = createNewElement(newChild, newVnode) as DomElementWithVnode;
        shouldPatch = false;
      }

      const currentNode = childNodes[i];
      if (!currentNode) {
        newVnode.dom.appendChild(newChild.dom);
      } else if (currentNode !== newChild.dom) {
        newVnode.dom.replaceChild(newChild.dom, currentNode);
      }

      shouldPatch && patch(newChild);
    }

    for (let i = newTreeLength; i < oldTreeLength; i++) {
      const oldVnode = domToVnodeWeakMap.get(oldTree[i]);
      if (oldVnode && !newKeyedList[oldVnode.props.key as any]) {
        const domToRemove = oldTree[i];
        domToRemove.parentNode && domToRemove.remove();
        cleanupVnodeChildren(oldVnode);
      }
    }
    return;
  }

  const maxLen = Math.max(newTreeLength, oldTreeLength);

  for (let i = 0; i < maxLen; i++) {
    const newChild = children[i];
    const oldChild = oldTree[i] as DomElementWithVnode;
    const oldVnode = domToVnodeWeakMap.get(oldChild);

    if (newChild === oldVnode) {
      continue;
    }

    if (!oldChild) {
      newVnode.dom.appendChild(createNewElement(newChild, newVnode));
      continue;
    }

    if (!newChild) {
      oldChild.remove();
      oldVnode && cleanupVnodeChildren(oldVnode);
      continue;
    }

    if (newChild instanceof Vnode === false) {
      if (oldChild.nodeType !== 3) {
        const textDom = document.createTextNode(newChild as string);
        newVnode.dom.replaceChild(textDom, oldChild);
        if (domToVnodeWeakMap.has(oldChild)) {
          oldVnode && cleanupVnodeChildren(oldVnode);
          domToVnodeWeakMap.delete(oldChild);
        }
      } else if (oldChild.nodeValue != newChild) {
        oldChild.nodeValue = newChild as string;
      }
      continue;
    }

    processVnode(newVnode, newChild as VnodeWithDom, oldChild);
  }
}

export function update(): void | string {
  if (mainVnode) {
    callSet(onCleanupSet);
    mainVnode.children = [mainComponent];
    patch(mainVnode);
    callSet(isMounted ? onUpdateSet : onMountSet);
    isMounted = true;
    current.vnode = null;
    current.component = null;
    if (isNodeJs) {
      return mainVnode.dom.innerHTML;
    }
  }
}

export function updateVnode(vnode: VnodeWithDom): string | void {
  callSet(onCleanupSet);
  patch(vnode);
  callSet(isMounted ? onUpdateSet : onMountSet);
  isMounted = true;
  current.vnode = null;
  current.component = null;
  if (isNodeJs) {
    return vnode.dom.innerHTML;
  }
}

export function unmount() {
  if (mainVnode) {
    mainComponent = new Vnode(() => null, {}, []) as VnodeComponentInterface;
    const result = update();
    callSet(onUnmountSet);
    for (const name in eventListenerNames) {
      mainVnode.dom.removeEventListener(name.slice(2).toLowerCase(), eventListener);
      Reflect.deleteProperty(eventListenerNames, name);
    }

    mainComponent = null;
    mainVnode = null;
    isMounted = false;
    current.vnode = null;
    current.component = null;
    return result;
  }
}

export function mount(dom: string | DomElement, component: any) {
  const container =
    typeof dom === "string" ? (isNodeJs ? createElement(dom, dom === "svg") : document.querySelector(dom)) : dom;
  const vnodeComponent = isVnodeComponent(component)
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

export function v(tagOrComponent: string | Component, props: VnodeProperties, ...children: Children) {
  return new Vnode(tagOrComponent, props || {}, children);
}

v.fragment = (_: VnodeProperties, ...children: Children) => children;
