/* eslint-disable */
declare global {
  var document: Document;
  namespace JSX {
    interface IntrinsicElements extends DefaultRecord {}
    type Element = ReturnType<
      typeof v | ((...args: any) => string | number | null | undefined | boolean | Promise<any>)
    >;
    type ComponentReturnType = string | number | null | undefined | boolean | Element | Element[];
  }
}

interface DefaultRecord extends Record<string | number | symbol, any> {}

export interface Properties extends DefaultRecord {
  key?: string | number;
}

export interface DomElement extends Element, DefaultRecord {}

export interface Component extends DefaultRecord {
  (props: Properties, children: any[]): Vnode | any;
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
  (value: any, vnode: VnodeWithDom, oldProps: Properties | null): false | void | any;
}

export const isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);

export class Vnode {
  constructor(
    public tag: string | Component | POJOComponent,
    public props: null | Properties,
    public children: Children,
    public dom?: DomElement,
    public isSVG?: boolean
  ) {}
}

export interface VnodeWithDom extends Vnode {
  tag: string;
  dom: DomElement;
  props: Properties;
}

export const isPOJOComponent = (component: unknown): component is POJOComponent =>
  Boolean(component && typeof component === "object" && "view" in component);

export const isComponent = (component: unknown): component is Component =>
  Boolean(typeof component === "function" || isPOJOComponent(component));
export const isVnode = (object?: unknown): object is Vnode => object instanceof Vnode;

export const isVnodeComponent = (object?: unknown): object is VnodeComponentInterface => {
  return isVnode(object) && isComponent(object.tag);
};

export function v(tagOrComponent: string | ValyrianComponent, props: Properties | null, ...children: Children) {
  return new Vnode(tagOrComponent, props, children);
}

v.fragment = (_: Properties, ...children: Children) => children;

export function hidrateDomToVnode(dom: any): VnodeWithDom | void {
  if (dom.nodeType === 3) {
    return dom.nodeValue;
  }

  if (dom.nodeType === 1) {
    const tag = dom.nodeName.toLowerCase();
    const props = {} as Properties;
    const children = [] as Children;

    for (let i = 0, l = dom.childNodes.length; i < l; i++) {
      const childDom = dom.childNodes[i];
      if (childDom.nodeType === 3) {
        children.push(childDom.nodeValue);
      } else if (childDom.nodeType === 1) {
        const childVnode = hidrateDomToVnode(childDom);
        children.push(childVnode);
      }
    }

    const attributes = dom.attributes;
    for (let i = 0, l = attributes.length; i < l; i++) {
      const attr = attributes[i];
      props[attr.nodeName] = attr.nodeValue;
    }

    const vnode = new Vnode(tag, props, children);
    vnode.dom = dom;
    vnode.isSVG = tag === "svg";
    return vnode as VnodeWithDom;
  }
}

export function trust(htmlString: string) {
  const div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  return Array.from(div.childNodes).map(hidrateDomToVnode);
}

let mainComponent: VnodeComponentInterface | null = null;
let mainVnode: VnodeWithDom | null = null;
let isMounted = false;

export const current = {
  vnode: null as Vnode | null,
  component: null as ValyrianComponent | null,
  event: null as Event | null
};

export const reservedProps = new Set<string>([
  "key",
  "state",
  "v-keep",
  "v-text",
  "v-if",
  "v-for",
  "v-show",
  "v-class",
  "v-html",
  "v-model",
  "v-create",
  "v-update",
  "v-cleanup"
]);

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

export const directives: Record<string, Directive> = {
  "v-if": (value, vnode) => {
    if (!Boolean(value)) {
      const parentNode = vnode.dom?.parentNode;
      if (parentNode) {
        parentNode.replaceChild(document.createTextNode(""), vnode.dom);
      }

      return false;
    }
  },

  "v-show": (value, vnode) => {
    const bool = Boolean(value);
    (
      vnode.dom as unknown as {
        style: { display: string };
      }
    ).style.display = bool ? "" : "none";
  },

  "v-html": (value, vnode) => {
    vnode.children = trust(value as string);
  },

  // The "v-model" directive binds the value of an input element to a model property
  "v-model": (model, vnode) => {
    // eslint-disable-next-line prefer-const
    if ("name" in vnode.props === false) {
      return;
    }

    let value;
    const property = vnode.props.name;
    let event = "oninput";

    // This function updates the model property when the input element's value changes
    let handler = (e: Event) => (model[property] = (e.target as DomElement & Record<string, any>).value);
    if (vnode.tag === "input") {
      // Depending on the type of input element, use a different handler function
      switch (vnode.props.type) {
        case "checkbox": {
          if (Array.isArray(model[property])) {
            // If the model property is an array, add or remove the value from the array when the checkbox is checked or unchecked
            handler = (e: Event) => {
              const val = (e.target as DomElement & Record<string, any>).value;
              const idx = model[property].indexOf(val);
              if (idx === -1) {
                model[property].push(val);
              } else {
                model[property].splice(idx, 1);
              }
            };
            // If the value is in the array, set the checkbox to be checked
            value = model[property].indexOf(vnode.dom.value) !== -1;
          } else if ("value" in vnode.props) {
            // If the input element has a "value" attribute, use it to determine the checked state
            handler = () => {
              if (model[property] === vnode.props.value) {
                model[property] = null;
              } else {
                model[property] = vnode.props.value;
              }
            };
            value = model[property] === vnode.props.value;
          } else {
            // If there is no "value" attribute, use a boolean value for the model property
            handler = () => (model[property] = !model[property]);
            value = model[property];
          }
          // Set the "checked" attribute on the input element
          // eslint-disable-next-line no-use-before-define
          sharedSetAttribute("checked", value, vnode);
          break;
        }
        case "radio": {
          // If the element is a radio button, set the "checked" attribute based on the value of the model property
          // eslint-disable-next-line no-use-before-define
          sharedSetAttribute("checked", model[property] === vnode.dom.value, vnode);
          break;
        }
        default: {
          // For all other input types, set the "value" attribute based on the value of the model property
          // eslint-disable-next-line no-use-before-define
          sharedSetAttribute("value", model[property], vnode);
        }
      }
    } else if (vnode.tag === "select") {
      // If the element is a select element, use the "click" event by default
      event = "onclick";
      if (vnode.props.multiple) {
        // If the select element allows multiple selections, update the model property with an array of selected values
        handler = (e: Event & Record<string, any>) => {
          const val = (e.target as DomElement & Record<string, any>).value;
          if (e.ctrlKey) {
            // If the Ctrl key is pressed, add or remove the value from the array
            const idx = model[property].indexOf(val);
            if (idx === -1) {
              model[property].push(val);
            } else {
              model[property].splice(idx, 1);
            }
          } else {
            // If the Ctrl key is not pressed, set the model property to an array with the selected value
            model[property].splice(0, model[property].length);
            model[property].push(val);
          }
        };
        // Set the "selected" attribute on the options based on whether they are in the model property array
        vnode.children.forEach((child: VnodeWithDom) => {
          if (child.tag === "option") {
            const value = "value" in child.props ? child.props.value : child.children.join("").trim();
            child.props.selected = model[property].indexOf(value) !== -1;
          }
        });
      } else {
        // If the select element does not allow multiple selections, set the "selected" attribute on the options based on the value of the model property
        vnode.children.forEach((child: VnodeWithDom) => {
          if (child.tag === "option") {
            const value = "value" in child.props ? child.props.value : child.children.join("").trim();
            child.props.selected = value === model[property];
          }
        });
      }
    } else if (vnode.tag === "textarea") {
      // Set the textarea's content to the value of the model property
      vnode.children = [model[property]];
    }

    // We assume that the prev handler if any will not be changed by the user across patchs
    const prevHandler = vnode.props[event];

    // Set the event handler on the element
    // eslint-disable-next-line no-use-before-define
    sharedSetAttribute(
      event,
      (e: Event) => {
        handler(e);

        // If the previous handler is defined, call it after the model has been updated
        if (prevHandler) {
          prevHandler(e);
        }
      },
      vnode
    );
  },

  "v-create": (callback, vnode, oldProps) => {
    if (!oldProps) {
      const cleanup = callback(vnode);

      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },

  "v-update": (callback, vnode, oldProps) => {
    if (oldProps) {
      const cleanup = callback(vnode, oldProps);

      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },

  "v-cleanup": (callback, vnode) => {
    onCleanup(() => callback(vnode));
  },

  "v-class": (value, vnode) => {
    if (typeof value === "string") {
      vnode.dom.className = value;
    } else if (Array.isArray(value)) {
      vnode.dom.className = value.join(" ");
    } else if (typeof value === "object") {
      const classList = vnode.dom.classList;
      for (const name in value) {
        const val = typeof value[name] === "function" ? (value[name] as Function)() : value[name];
        classList.toggle(name, val);
      }
    }
  },

  // Frequent used properties
  class(value, vnode) {
    if (vnode.dom.className !== value) {
      vnode.dom.className = value;
    }
  },

  className(value, vnode) {
    directives.class(value, vnode, null);
  },

  id: (value, vnode) => {
    vnode.dom.id = value;
  },

  style: (value, vnode) => {
    if (typeof value === "string") {
      vnode.dom.style = value;
    } else if (typeof value === "object") {
      vnode.dom.style = "";
      const domStyle = vnode.dom.style;
      for (const name in value) {
        domStyle[name] = value[name];
      }
    }
  }
};

export function directive(name: string, directive: Directive) {
  const directiveName = `v-${name}`;
  directives[directiveName] = directive;
  reservedProps.add(directiveName);
}

export function setPropNameReserved(name: string) {
  reservedProps.add(name);
}

const eventListenerNames = new Set<string>();

function eventListener(e: Event) {
  current.event = e;
  let dom = e.target as DomElement;
  const name = `on${e.type}`;

  while (dom) {
    const oldProps = dom.props;
    if (oldProps && oldProps[name]) {
      oldProps[name](e, dom);

      if (!e.defaultPrevented) {
        // eslint-disable-next-line no-use-before-define
        update();
      }
      return;
    }
    dom = dom.parentNode as DomElement;
  }

  current.event = null;
}

function sharedSetAttribute(name: string, value: any, newVnode: VnodeWithDom): void | boolean {
  const newVnodeDom = newVnode.dom;
  if (typeof value === "function") {
    if (!eventListenerNames.has(name)) {
      // We attach the delegated event listener to the main vnode dom element, which is the root of the component
      (mainVnode as VnodeWithDom).dom.addEventListener(name.slice(2), eventListener);
      eventListenerNames.add(name);
    }
    return;
  }

  if (name in newVnodeDom) {
    newVnodeDom[name] = value;
    return;
  }

  if (value === false) {
    newVnodeDom.removeAttribute(name);
  } else {
    newVnodeDom.setAttribute(name, value);
  }
}

export function setAttribute(name: string, value: any, newVnode: VnodeWithDom): void {
  if (!reservedProps.has(name)) {
    newVnode.props[name] = value;
    sharedSetAttribute(name, value, newVnode);
  }
}

export function updateAttributes(newVnode: VnodeWithDom, oldProps: Properties | null): void {
  const vnodeDom = newVnode.dom;
  const vnodeProps = newVnode.props;

  if (oldProps) {
    for (const name in oldProps) {
      if (name in vnodeProps === false && !eventListenerNames.has(name) && !reservedProps.has(name)) {
        if (name in vnodeDom) {
          vnodeDom[name] = null;
        } else {
          vnodeDom.removeAttribute(name);
        }
      }
    }
  }

  for (const name in vnodeProps) {
    if (directives[name]) {
      if (directives[name](vnodeProps[name], newVnode, oldProps) === false) {
        break;
      }
      continue;
    }

    if (!reservedProps.has(name)) {
      sharedSetAttribute(name, vnodeProps[name], newVnode);
    }
  }
}

export function createElement(tag: string, isSVG: boolean): DomElement {
  return isSVG
    ? document.createElementNS("http://www.w3.org/2000/svg", tag)
    : (document.createElement(tag) as DomElement);
}

function flatTree(newVnode: VnodeWithDom) {
  current.vnode = newVnode;

  if ("v-for" in newVnode.props) {
    const children = [];
    const set = newVnode.props["v-for"];
    const l = set.length;
    const callback = newVnode.children[0];

    for (let i = 0; i < l; i++) {
      const newChild = callback(set[i], i);
      if (newChild instanceof Vnode) {
        newChild.props = newChild.props || {};
        newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";
      }
      children[i] = newChild;
    }

    return children;
  }

  let i = 0;
  const originalChildren = newVnode.children;
  let children = originalChildren;

  while (i < children.length) {
    const newChild = children[i];

    if (newChild == null) {
      if (children === originalChildren) {
        children = [...originalChildren];
      }
      children.splice(i, 1);
      continue;
    }

    if (Array.isArray(newChild)) {
      if (children === originalChildren) {
        children = [...originalChildren];
      }
      children.splice(i, 1, ...newChild);
      continue;
    }

    if (newChild instanceof Vnode) {
      newChild.props = newChild.props || {};
      newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";

      if (typeof newChild.tag !== "string") {
        if (children === originalChildren) {
          children = [...originalChildren];
        }

        const component = (current.component = newChild.tag);

        children[i] = (isPOJOComponent(component) ? component.view : component).bind(component)(
          newChild.props,
          newChild.children
        );

        continue;
      }
    }

    i++;
  }

  return children;
}

function createNewElement(newChild: VnodeWithDom, newVnode: VnodeWithDom, oldChild: DomElement | null) {
  const dom = createElement(newChild.tag, newChild.isSVG as boolean);
  if (oldChild) {
    newVnode.dom.replaceChild(dom, oldChild);
  } else {
    newVnode.dom.appendChild(dom);
  }
  newChild.dom = dom;
  updateAttributes(newChild, null);
  newChild.dom.props = newChild.props;
  if ("v-text" in newChild.props) {
    newChild.dom.textContent = newChild.props["v-text"];
    return;
  }

  const children = flatTree(newChild);
  if (children.length === 0) {
    newChild.dom.textContent = "";
    return;
  }

  for (let i = 0, l = children.length; i < l; i++) {
    if (children[i] instanceof Vnode === false) {
      newChild.dom.appendChild(document.createTextNode(children[i]));
      continue;
    }
    createNewElement(children[i], newChild, null);
  }
}

function patchKeyed(newVnode: VnodeWithDom, children: Children) {
  const oldTree = [...Array.from(newVnode.dom.childNodes)] as unknown as DomElement[];
  const childNodes = newVnode.dom.childNodes;
  const oldKeyedList: Record<string, number> = {};
  const newKeyedList: Record<string, number> = {};

  for (let i = 0, l = oldTree.length; i < l; i++) {
    const oldProps = oldTree[i].props;
    if (oldProps) {
      oldKeyedList[oldProps.key as string] = i;
    }

    if (i < children.length && children[i] instanceof Vnode) {
      newKeyedList[children[i].props.key as string] = i;
    }
  }

  for (let i = 0, l = children.length; i < l; i++) {
    const newChild = children[i];
    const oldChild = oldTree[oldKeyedList[newChild.props.key as string]];

    if (!oldChild) {
      createNewElement(newChild, newVnode, childNodes[i] as DomElement | null);
      continue;
    }

    newChild.dom = oldChild;
    const currentChild = childNodes[i];
    if (!currentChild) {
      newVnode.dom.appendChild(oldChild);
    } else if (currentChild !== oldChild) {
      newVnode.dom.replaceChild(oldChild, currentChild);
    }

    if ("v-keep" in newChild.props === false || oldChild.props["v-keep"] !== newChild.props["v-keep"]) {
      updateAttributes(newChild as VnodeWithDom, oldChild.props);
      oldChild.props = newChild.props;

      if ("v-text" in newChild.props) {
        // eslint-disable-next-line eqeqeq
        if (oldChild.textContent != newChild.props["v-text"]) {
          oldChild.textContent = newChild.props["v-text"];
        }
        continue;
      }
      // eslint-disable-next-line no-use-before-define
      patch(newChild as VnodeWithDom);
    }
  }

  for (let i = children.length, l = childNodes.length; i < l; i++) {
    childNodes[i]?.remove();
  }
}

// eslint-disable-next-line complexity
function patch(newVnode: VnodeWithDom): void {
  const children = flatTree(newVnode);

  const dom = newVnode.dom;

  if (children.length === 0) {
    if (dom.childNodes.length) {
      dom.textContent = "";
    }
    return;
  }

  const oldDomChildren = dom.childNodes as unknown as DomElement[];
  const oldChildrenLength = oldDomChildren.length;
  if (oldChildrenLength > 0) {
    const firstOldProps = oldDomChildren[0].props;
    const firstVnode = children[0] as VnodeWithDom;
    if (firstOldProps && firstVnode instanceof Vnode && "key" in firstVnode.props && "key" in firstOldProps) {
      patchKeyed(newVnode, children);
      return;
    }
  }

  const childrenLength = children.length;
  if (oldChildrenLength === 0) {
    for (let i = 0; i < childrenLength; i++) {
      if (children[i] instanceof Vnode === false) {
        dom.appendChild(document.createTextNode(children[i]));
        continue;
      }
      createNewElement(children[i], newVnode, null);
    }
    return;
  }

  for (let i = 0; i < childrenLength; i++) {
    const newChild = children[i] as VnodeWithDom;
    const isText = newChild instanceof Vnode === false;
    const oldChild = oldDomChildren[i];

    if (!oldChild) {
      if (isText) {
        newVnode.dom.appendChild(document.createTextNode(newChild as unknown as string));
        continue;
      }

      createNewElement(newChild as VnodeWithDom, newVnode, null);
      continue;
    }

    if (isText) {
      if (oldChild.nodeType !== 3) {
        newVnode.dom.replaceChild(document.createTextNode(newChild as unknown as string), oldChild);
        continue;
      }

      // eslint-disable-next-line eqeqeq
      if (oldChild.nodeValue != (newChild as unknown as string)) {
        oldChild.nodeValue = newChild as unknown as string;
      }
      continue;
    }

    if ("v-keep" in newChild.props) {
      if (oldChild.props && oldChild.props["v-keep"] === newChild.props["v-keep"]) {
        continue;
      }

      const nextOldChild = oldDomChildren[i + 1];
      if (nextOldChild && nextOldChild.props && nextOldChild.props["v-keep"] === newChild.props["v-keep"]) {
        oldChild.remove();
        continue;
      }
    }

    if (newChild.tag !== oldChild.nodeName.toLowerCase()) {
      createNewElement(newChild, newVnode, oldChild);
      continue;
    }

    newChild.dom = oldChild;
    updateAttributes(newChild, oldChild.props || null);
    oldChild.props = newChild.props;
    if ("v-text" in newChild.props) {
      // eslint-disable-next-line eqeqeq
      if (newChild.dom.textContent != newChild.props["v-text"]) {
        newChild.dom.textContent = newChild.props["v-text"];
      }
      continue;
    }
    patch(newChild);
  }

  for (let i = childrenLength, l = oldDomChildren.length; i < l; i++) {
    oldDomChildren[i]?.remove();
  }
}

export function updateVnode(vnode: VnodeWithDom): string | void {
  callSet(onCleanupSet);
  vnode.props = vnode.props || {};
  patch(vnode);
  callSet(isMounted ? onUpdateSet : onMountSet);
  isMounted = true;
  current.vnode = null;
  current.component = null;
}

export function update(): string {
  if (mainVnode) {
    mainVnode.children = [mainComponent];
    updateVnode(mainVnode as VnodeWithDom);
    if (isNodeJs) {
      return mainVnode.dom.innerHTML;
    }
  }
  return "";
}

let debouncedUpdateTimeout: any;

const clearDebouncedUpdateMethod = isNodeJs ? clearTimeout : cancelAnimationFrame;
const setDebouncedUpdateMethod = isNodeJs ? () => setTimeout(update, 5) : () => requestAnimationFrame(update);

export function debouncedUpdate() {
  clearDebouncedUpdateMethod(debouncedUpdateTimeout);
  debouncedUpdateTimeout = setDebouncedUpdateMethod();
}

export function unmount() {
  if (mainVnode) {
    mainComponent = v(() => null, {}) as VnodeComponentInterface;
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
    current.event = null;
    return result;
  }

  return "";
}

export function mount(dom: string | DomElement, component: ValyrianComponent | VnodeComponentInterface | any) {
  const container =
    typeof dom === "string" ? (isNodeJs ? createElement(dom, dom === "svg") : document.querySelector(dom)) : dom;

  if (isComponent(component)) {
    mainComponent = v(component, {}, []) as VnodeComponentInterface;
  } else if (isVnodeComponent(component)) {
    mainComponent = component;
  } else {
    mainComponent = v(() => component, {}, []) as VnodeComponentInterface;
  }

  mainVnode = hidrateDomToVnode(container) as VnodeWithDom;
  return update();
}
