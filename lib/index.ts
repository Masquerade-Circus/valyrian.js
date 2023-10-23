declare global {
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
  (vnode: VnodeWithDom, oldProps: VnodeProperties | null): void | boolean;
}

export const isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);

export class Vnode {
  constructor(
    public tag: string | Component | POJOComponent,
    public props: null | VnodeProperties,
    public children: Children,
    public dom?: DomElement,
    public isSVG?: boolean
  ) {}
}

export interface VnodeWithDom extends Vnode {
  tag: string;
  dom: DomElement;
  props: VnodeProperties;
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
  dom.props = vnode.props;

  for (let i = 0, l = dom.childNodes.length; i < l; i++) {
    const childDom = dom.childNodes[i];
    if (childDom.nodeType === 3) {
      vnode.children.push(childDom.nodeValue);
    } else if (childDom.nodeType === 1) {
      const childVnode = domToVnode(childDom);
      vnode.children.push(childVnode);
    }
  }

  const props = vnode.props as VnodeProperties;
  for (let i = 0, l = dom.attributes.length; i < l; i++) {
    const attr = dom.attributes[i];
    props[attr.nodeName] = attr.nodeValue;
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
  "v-for"(vnode: VnodeWithDom) {
    const set = vnode.props["v-for"];
    const children = vnode.children;
    const callback = children[0];
    children.length = set.length;

    for (let i = 0, l = set.length; i < l; i++) {
      children[i] = callback(set[i], i);
    }
  },

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

  "v-show": (vnode: VnodeWithDom) => {
    const bool = Boolean(vnode.props["v-show"]);
    (
      vnode.dom as unknown as {
        style: { display: string };
      }
    ).style.display = bool ? "" : "none";
  },

  "v-html": (vnode: VnodeWithDom) => {
    vnode.children = [trust(vnode.props["v-html"])];
  },

  // The "v-model" directive binds the value of an input element to a model property
  "v-model": (vnode: VnodeWithDom) => {
    let [model, property, event]: any[] = vnode.props["v-model"];
    let value;
    // This function updates the model property when the input element's value changes
    let handler = (e: Event) => (model[property] = (e.target as DomElement & Record<string, any>).value);
    if (vnode.tag === "input") {
      // If the element is an input, use the "input" event by default
      event = event || "oninput";
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
      event = event || "onclick";
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
      // If the element is a textarea, use the "input" event by default
      event = event || "oninput";
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

  "v-create": (vnode: VnodeWithDom, oldProps: VnodeProperties | null) => {
    if (!oldProps) {
      const callback = vnode.props["v-create"];
      const cleanup = callback(vnode);

      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },

  "v-update": (vnode: VnodeWithDom, oldProps: VnodeProperties | null) => {
    if (oldProps) {
      const callback = vnode.props["v-update"];
      const cleanup = callback(vnode, oldProps);

      if (typeof cleanup === "function") {
        onCleanup(cleanup);
      }
    }
  },

  "v-cleanup": (vnode: VnodeWithDom) => {
    const callback = vnode.props["v-cleanup"];
    onCleanup(() => callback(vnode));
  },

  // Frequent used properties
  class: (vnode: VnodeWithDom) => {
    const value = vnode.props.class;
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

  id: (vnode: VnodeWithDom) => {
    vnode.dom.id = vnode.props.id;
  },

  style: (vnode: VnodeWithDom) => {
    const value = vnode.props.style;
    if (typeof value === "string") {
      vnode.dom.style.cssText = value;
    } else if (typeof value === "object") {
      const domStyle = vnode.dom.style;
      domStyle.cssText = "";
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

function removeAttributes(vnode: VnodeWithDom, oldProps: VnodeProperties | null): void {
  if (!oldProps) {
    return;
  }

  const vnodeDom = vnode.dom;
  const vnodeProps = vnode.props;

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

function addProperties(vnode: VnodeWithDom, oldProps: VnodeProperties | null) {
  const vnodeProps = vnode.props;
  for (const name in vnodeProps) {
    if (directives[name]) {
      if (directives[name](vnode, oldProps) === false) {
        break;
      }
      continue;
    }

    if (reservedProps.has(name)) {
      continue;
    }

    sharedSetAttribute(name, vnodeProps[name], vnode);
  }
}

function updateAttributes(newVnode: VnodeWithDom, oldProps: VnodeProperties | null): void {
  removeAttributes(newVnode, oldProps);
  addProperties(newVnode, oldProps);
}

function createElement(tag: string, isSVG: boolean): DomElement {
  return isSVG
    ? document.createElementNS("http://www.w3.org/2000/svg", tag)
    : (document.createElement(tag) as DomElement);
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

    if (newChild instanceof Vnode) {
      if (newChild.props === null) {
        newChild.props = {};
      }

      if (typeof newChild.tag !== "string") {
        const component = ("view" in newChild.tag ? newChild.tag.view : newChild.tag).bind(newChild.tag);
        current.component = component;
        children[i] = component(newChild.props, newChild.children);
        continue;
      } else {
        newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";
      }
    }

    i++;
  }
}

function createNewElement(newChild: any, newVnode: VnodeWithDom, oldChild: DomElement | null) {
  if (newChild instanceof Vnode === false) {
    const dom = document.createTextNode(newChild);
    if (oldChild) {
      newVnode.dom.replaceChild(dom, oldChild);
    } else {
      newVnode.dom.appendChild(dom);
    }
    return;
  }

  const dom = createElement(newChild.tag, newChild.isSVG);
  if (oldChild) {
    newVnode.dom.replaceChild(dom, oldChild);
  } else {
    newVnode.dom.appendChild(dom);
  }
  newChild.dom = dom;
  addProperties(newChild, null);
  newChild.dom.props = newChild.props;
  flatTree(newChild);
  const children = newChild.children;
  if (children.length === 0) {
    newChild.dom.textContent = "";
    return;
  }

  for (let i = 0, l = children.length; i < l; i++) {
    createNewElement(children[i], newChild, null);
  }
  children.length = 0;
}

function patchKeyed(newVnode: VnodeWithDom) {
  const oldTree = newVnode.dom.childNodes as unknown as DomElement[];
  const oldKeyedList: Record<string, number> = {};
  const newKeyedList: Record<string, number> = {};
  const children = newVnode.children;

  for (let i = 0, l = oldTree.length; i < l; i++) {
    const oldChild = oldTree[i];
    const oldProps = oldChild.props;
    if (oldProps) {
      oldKeyedList[oldProps.key as string] = i;
    }

    if (i < children.length && children[i] instanceof Vnode) {
      newKeyedList[children[i].props.key as string] = i;
    }
  }

  for (let i = 0, l = children.length; i < l; i++) {
    const newChild = children[i];
    const oldIndex = oldKeyedList[newChild.props.key];
    const oldChild = oldTree[oldIndex];

    if (!oldChild) {
      createNewElement(newChild, newVnode, null);
      continue;
    }

    newChild.dom = oldChild;
    if (newVnode.dom.childNodes[i] !== newChild.dom) {
      newVnode.dom.insertBefore(newChild.dom, newVnode.dom.childNodes[i]);
    }

    const oldProps = oldChild.props;
    newChild.dom = oldChild as DomElement;
    oldChild.props = newChild.props;

    if (oldProps && "v-keep" in newChild.props && newChild.props["v-keep"] === oldProps["v-keep"]) {
      continue;
    }

    updateAttributes(newChild as VnodeWithDom, oldProps || null);
    patch(newChild);
  }

  // Remove any old nodes not in the new tree
  for (let i = 0, l = oldTree.length; i < l; i++) {
    const oldChild = oldTree[i];
    const oldProps = oldChild.props;
    if (oldProps && !newKeyedList[oldProps.key as string]) {
      oldChild.remove();
    }
  }
}

export function patch(newVnode: VnodeWithDom): void {
  flatTree(newVnode);
  const children = newVnode.children;

  if (children.length === 0) {
    newVnode.dom.textContent = "";
    return;
  }

  const oldDomChildren = newVnode.dom.childNodes as unknown as DomElement[];
  const oldChildrenLength = oldDomChildren.length;
  if (oldChildrenLength > 0) {
    const firstOldProps = oldDomChildren[0].props;
    const firstVnode = children[0] as VnodeWithDom;
    if (firstOldProps && firstVnode instanceof Vnode && "key" in firstVnode.props && "key" in firstOldProps) {
      patchKeyed(newVnode);
      children.length = 0;
      return;
    }
  }

  const childrenLength = children.length;
  if (oldChildrenLength === 0) {
    for (let i = 0; i < childrenLength; i++) {
      createNewElement(children[i], newVnode, null);
    }
    children.length = 0;
    return;
  }

  for (let i = 0; i < childrenLength; i++) {
    const oldChild = oldDomChildren[i];
    const newChild = children[i];
    if (!oldChild) {
      createNewElement(newChild, newVnode, null);
      continue;
    }

    if (newChild instanceof Vnode === false) {
      if (oldChild.nodeType !== 3) {
        newVnode.dom.replaceChild(document.createTextNode(newChild), oldChild);
        continue;
      }

      if (oldChild.nodeValue != newChild) {
        oldChild.nodeValue = newChild;
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
    updateAttributes(newChild as VnodeWithDom, oldChild.props || null);
    oldChild.props = newChild.props;
    patch(newChild);
  }

  for (let i = childrenLength, l = oldDomChildren.length; i < l; i++) {
    oldDomChildren[i]?.remove();
  }

  children.length = 0;
}

export function update(): void | string {
  if (mainVnode) {
    mainVnode.children = [mainComponent];
    return updateVnode(mainVnode);
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
  return new Vnode(tagOrComponent, props, children);
}

v.fragment = (_: VnodeProperties, ...children: Children) => children;
