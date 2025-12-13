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
  (value: any, vnode: VnodeWithDom, oldProps?: Properties): false | void | any;
}

export const isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);

export class Vnode {
  constructor(
    public tag: string | Component | POJOComponent,
    public props: null | Properties,
    public children: Children,
    public dom?: DomElement,
    public isSVG?: boolean,
    public oldChildComponents?: Set<ValyrianComponent>,
    public childComponents?: Set<ValyrianComponent>,
    public hasKeys?: boolean,
    public oncreate?: Set<Function>,
    public oncleanup?: Set<Function>,
    public onupdate?: Set<Function>,
    public onremove?: Set<Function>
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

export function hidrateDomToVnode(dom: any): VnodeWithDom | string | null | void {
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
    dom.vnode = vnode;
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
  oldVnode: null as Vnode | null,
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
  "v-cleanup",
  "v-remove"
]);

enum SetType {
  onCreate = "oncreate",
  onUpdate = "onupdate",
  onCleanup = "oncleanup",
  onRemove = "onremove"
}

function addCallbackToSet(callback: Function, setType: SetType, vnode: VnodeWithDom) {
  vnode[setType] = vnode[setType] || new Set();
  vnode[setType].add(() => {
    const cleanup = callback();
    if (typeof cleanup === "function") {
      vnode[SetType.onCleanup] = vnode[SetType.onCleanup] || new Set();
      vnode[SetType.onCleanup].add(cleanup);
    }
  });
}

function validateIsCalledInsideComponent() {
  if (!current.vnode) {
    throw new Error("This function must be called inside a component");
  }
}

export const onCreate = (callback: Function) => {
  validateIsCalledInsideComponent();
  const parentVnode = current.vnode as VnodeWithDom;
  const component = current.component as ValyrianComponent;
  const hasComponentAsOldChild = parentVnode.oldChildComponents && parentVnode.oldChildComponents.has(component);

  if (!hasComponentAsOldChild) {
    addCallbackToSet(callback, SetType.onCreate, parentVnode);
  }
};
export const onUpdate = (callback: Function) => {
  validateIsCalledInsideComponent();
  const parentVnode = current.vnode as VnodeWithDom;
  const component = current.component as ValyrianComponent;
  const hasComponentAsChild = parentVnode.childComponents && parentVnode.childComponents.has(component);
  if (hasComponentAsChild) {
    addCallbackToSet(callback, SetType.onUpdate, current.vnode as VnodeWithDom);
  }
};
export const onCleanup = (callback: Function) => {
  validateIsCalledInsideComponent();
  addCallbackToSet(callback, SetType.onCleanup, current.vnode as VnodeWithDom);
};
export const onRemove = (callback: Function) => {
  validateIsCalledInsideComponent();

  const parentVnode = current.vnode as VnodeWithDom;
  const component = current.component as ValyrianComponent;
  let removed = false;

  function removeCallback() {
    const hasComponentAsChild = parentVnode.childComponents && parentVnode.childComponents.has(component);

    if (hasComponentAsChild || removed) {
      return;
    }

    removed = true;
    callback();
  }

  addCallbackToSet(removeCallback, SetType.onRemove, current.vnode as VnodeWithDom);
};
const callSet = (set?: Set<Function> | null) => {
  if (!set) {
    return;
  }
  for (const callback of set) {
    callback();
  }
  set.clear();
};

export const directives: Record<string, Directive> = {
  "v-create": (callback, childVnode, oldProps) => {
    if (!oldProps) {
      addCallbackToSet(() => callback(childVnode), SetType.onCreate, current.vnode as VnodeWithDom);
    }
  },

  "v-update": (callback, childVnode, oldProps) => {
    if (oldProps) {
      addCallbackToSet(() => callback(childVnode, oldProps), SetType.onUpdate, current.vnode as VnodeWithDom);
    }
  },

  "v-remove": (callback, childVnode) => {
    let parentVnode = current.vnode as VnodeWithDom;
    let currentChildVnode = childVnode as VnodeWithDom;
    while (parentVnode) {
      parentVnode.onremove = parentVnode.onremove || new Set();
      addCallbackToSet(
        () => {
          if (!childVnode.dom.vnode || currentChildVnode.dom.parentNode) {
            return;
          }
          callback(childVnode);
          childVnode.dom.vnode = null;
        },
        SetType.onRemove,
        parentVnode
      );

      if (!parentVnode.dom.parentElement) {
        break;
      }
      currentChildVnode = parentVnode;
      parentVnode = (parentVnode.dom.parentElement as DomElement).vnode as VnodeWithDom;
    }
  },

  "v-cleanup": (callback, vnode) => {
    addCallbackToSet(() => callback(vnode), SetType.onCleanup, current.vnode as VnodeWithDom);
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
          setAttribute("checked", value, vnode);
          break;
        }
        case "radio": {
          // If the element is a radio button, set the "checked" attribute based on the value of the model property
          // eslint-disable-next-line no-use-before-define
          setAttribute("checked", model[property] === vnode.dom.value, vnode);
          break;
        }
        default: {
          // For all other input types, set the "value" attribute based on the value of the model property
          // eslint-disable-next-line no-use-before-define
          setAttribute("value", model[property], vnode);
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
    setAttribute(
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
      if (vnode.isSVG) {
        vnode.dom.setAttribute("class", value);
        return;
      }
      vnode.dom.className = value;
    }
  },

  className(value, vnode) {
    directives.class(value, vnode);
  },

  id: (value, vnode) => {
    if (vnode.dom.id !== value) {
      if (vnode.isSVG) {
        vnode.dom.setAttribute("id", value);
        return;
      }
      vnode.dom.id = value;
    }
  },

  style: (value, vnode) => {
    if (typeof value === "string") {
      if (vnode.isSVG) {
        vnode.dom.setAttribute("style", value);
        return;
      }
      vnode.dom.style = value;
    } else if (typeof value === "object") {
      if (vnode.isSVG) {
        vnode.dom.setAttribute("style", "");
      } else {
        vnode.dom.style = "";
      }
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
    const oldVnode = dom.vnode as VnodeWithDom;
    if (oldVnode && oldVnode.props[name]) {
      try {
        oldVnode.props[name](e, oldVnode);
      } finally {
        current.event = null;
      }

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

  if (!newVnode.isSVG && name in newVnodeDom) {
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

export function updateAttributes(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void {
  const vnodeDom = newVnode.dom;
  const vnodeProps = newVnode.props;
  vnodeDom.vnode = newVnode;

  if (oldVnode) {
    for (const name in oldVnode.props) {
      if (name in vnodeProps === false && !eventListenerNames.has(name) && !reservedProps.has(name)) {
        if (!newVnode.isSVG && name in vnodeDom) {
          vnodeDom[name] = null;
        } else {
          vnodeDom.removeAttribute(name);
        }
      }
    }
  }

  for (const name in vnodeProps) {
    if (directives[name]) {
      if (directives[name](vnodeProps[name], newVnode, oldVnode?.props) === false) {
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
  let children: Children = [];
  const newChildren = newVnode.children;
  newVnode.hasKeys = false;

  if ("v-for" in newVnode.props === false) {
    for (let l = newChildren.length - 1; l >= 0; l--) {
      children.push(newChildren[l]);
    }
  } else {
    children = [];
    const set = newVnode.props["v-for"];
    const callback = newVnode.children[0];

    if (typeof callback !== "function") {
      console.warn("v-for directive must have a callback function as children");
      return children;
    }

    // This is done to preserve the correct call order of the children
    const tmp: any[] = [];
    for (let i = 0; i < set.length; i++) {
      tmp.push(callback(set[i], i));
    }
    for (let i = tmp.length - 1; i >= 0; i--) {
      children.push(tmp[i]);
    }
  }

  newVnode.oldChildComponents = newVnode.childComponents;
  if (newVnode.childComponents) {
    newVnode.childComponents = new Set();
  }

  const out: Children = [];

  while (children.length) {
    const newChild = children.pop();

    if (newChild == null) {
      continue;
    }

    if (Array.isArray(newChild)) {
      for (let l = newChild.length - 1; l >= 0; l--) {
        children.push(newChild[l]);
      }
      continue;
    }

    if (newChild instanceof Vnode) {
      newChild.props = newChild.props || {};

      if ("v-if" in newChild.props && !Boolean(newChild.props["v-if"])) {
        continue;
      }

      newChild.isSVG = newVnode.isSVG || newChild.tag === "svg";

      if (typeof newChild.tag !== "string") {
        const component = (current.component = newChild.tag);
        newVnode.childComponents = newVnode.childComponents || new Set();
        newVnode.childComponents.add(component);

        children.push(
          (isPOJOComponent(component) ? component.view : component).bind(component)(newChild.props, newChild.children)
        );

        continue;
      }

      newVnode.hasKeys = newVnode.hasKeys || "key" in newChild.props;
      out.push(newChild);
      continue;
    }

    out.push(newChild);
  }

  return out;
}

function processNewChild(newChild: VnodeWithDom, parentVnode: VnodeWithDom, oldDom?: DomElement) {
  if (oldDom) {
    newChild.dom = createElement(newChild.tag, newChild.isSVG as boolean);
    parentVnode.dom.replaceChild(newChild.dom, oldDom);
  } else {
    newChild.dom = parentVnode.dom.appendChild(createElement(newChild.tag, newChild.isSVG as boolean));
  }
  updateAttributes(newChild);
  if ("v-text" in newChild.props) {
    newChild.dom.textContent = newChild.props["v-text"];
    return;
  }

  current.oldVnode = null;
  current.vnode = newChild;

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
    processNewChild(children[i] as VnodeWithDom, newChild);
  }
}

// eslint-disable-next-line complexity
function patch(newVnode: VnodeWithDom, oldVnode: VnodeWithDom | null): void {
  current.oldVnode = oldVnode;
  current.vnode = newVnode;
  const children = flatTree(newVnode);
  const dom = newVnode.dom;

  if (children.length === 0) {
    if (dom.childNodes.length) {
      dom.textContent = "";
    }
    // There are no children so we don't need to call the oncreate and onupdate callbacks
    return;
  }

  const childNodes = dom.childNodes as unknown as DomElement[];
  const oldChildrenLength = childNodes.length;
  const childrenLength = children.length;
  if (oldChildrenLength === 0) {
    for (let i = 0; i < childrenLength; i++) {
      const newChild = children[i] as VnodeWithDom;
      if (newChild instanceof Vnode === false) {
        dom.appendChild(document.createTextNode(newChild));
        continue;
      }
      processNewChild(newChild, newVnode);
    }
    // The oncreate callback must be called after the children are created
    newVnode.oncreate && callSet(newVnode.oncreate);
    return;
  }

  let oldTree = childNodes as unknown as DomElement[];
  const oldKeyedList: Record<string, number> = {};

  if (newVnode.hasKeys) {
    const newOldTree = [];
    for (let i = 0, l = oldTree.length; i < l; i++) {
      newOldTree[i] = oldTree[i];
      const oldVnode = oldTree[i].vnode as VnodeWithDom;
      oldKeyedList[!oldVnode || "key" in oldVnode.props === false ? i : (oldVnode.props.key as string)] = i;
    }
    oldTree = newOldTree;
  }

  for (let i = 0, l = children.length; i < l; i++) {
    const newChild = children[i] as VnodeWithDom;

    if (newChild instanceof Vnode === false) {
      const oldChild = oldTree[i];
      if (!oldChild) {
        dom.appendChild(document.createTextNode(newChild));
        continue;
      }

      if (oldChild.nodeType !== 3) {
        dom.replaceChild(document.createTextNode(newChild), oldChild);
        continue;
      }

      // eslint-disable-next-line eqeqeq
      if (oldChild.nodeValue != newChild) {
        oldChild.nodeValue = newChild;
      }
      continue;
    }

    const oldChild = oldTree[newVnode.hasKeys ? oldKeyedList[(newChild.props.key as any) || i] : i] as DomElement;

    if (!oldChild || newChild.tag !== oldChild.nodeName.toLowerCase()) {
      processNewChild(newChild, newVnode, childNodes[i] as DomElement);
      continue;
    }

    newChild.dom = oldChild;
    const currentChild = childNodes[i];
    const oldChildVnode = oldChild.vnode as VnodeWithDom;
    if (!currentChild) {
      dom.appendChild(oldChild);
    } else if (currentChild !== oldChild) {
      dom.replaceChild(oldChild, currentChild);
    }

    if ("v-keep" in newChild.props && oldChildVnode) {
      if (oldChildVnode.props["v-keep"] === newChild.props["v-keep"]) {
        continue;
      }

      const oldProps = childNodes[i + 1]?.vnode?.props;
      if (oldProps && "key" in oldProps === false && oldProps["v-keep"] === newChild.props["v-keep"]) {
        oldChild.remove();
        oldTree.splice(i, 1);
        continue;
      }
    }

    updateAttributes(newChild as VnodeWithDom, oldChildVnode);

    if ("v-text" in newChild.props) {
      // eslint-disable-next-line eqeqeq
      if (oldChild.textContent != newChild.props["v-text"]) {
        oldChild.textContent = newChild.props["v-text"];
      }
      continue;
    }

    // Call the cleanup for the old child vnode before the patch
    callSet(oldChildVnode?.oncleanup);
    // eslint-disable-next-line no-use-before-define
    patch(newChild as VnodeWithDom, oldChildVnode || null);
    // Call the remove for the old child vnode after the patch
    callSet(oldChildVnode?.onremove);
  }

  for (let i = childNodes.length, l = children.length; i > l; i--) {
    childNodes[i - 1].remove();
  }

  // In here we could have new children or/and patched children
  // So we need to call the oncreate and onupdate callbacks
  callSet(newVnode.oncreate);
  callSet(newVnode.onupdate);
}

export function updateVnode(vnode: VnodeWithDom, shouldCleanup = true): string | void {
  vnode.props = vnode.props || {};
  if (shouldCleanup) {
    // The clean up must be from the old vnode
    // and in here the vnode is the old one
    // so, we need to call the cleanup before the patch
    // inside  the patch the clean up will be called only for the old children
    callSet(vnode.oncleanup);
  }
  // Clone the old on remove set to call it after the patch
  const oldOnRemoveSet = vnode.onremove ? new Set(vnode.onremove) : null;
  current.vnode = vnode;
  patch(vnode, shouldCleanup ? vnode : null);
  // Call the old on remove set
  callSet(oldOnRemoveSet);
  isMounted = true;
  current.oldVnode = null;
  current.vnode = null;
  current.component = null;
}

export function update(): string {
  if (mainVnode) {
    mainVnode.children = [mainComponent];
    // If the updateVnode method is called from outside the main lib (e.g. from a directive)
    // it always be considered as mounted, so the cleanup will be called before the patch
    // But in here, we need to pass the shouldCleanup as false if the app is not mounted
    updateVnode(mainVnode as VnodeWithDom, isMounted);
    if (isNodeJs) {
      return mainVnode.dom.innerHTML;
    }
  }
  return "";
}

let debouncedUpdateTimeout: any;
const debouncedUpdateMethod = isNodeJs ? update : () => requestAnimationFrame(update);

export function debouncedUpdate(timeout = 42) {
  if (current.event) {
    current.event.preventDefault();
  }
  clearTimeout(debouncedUpdateTimeout);
  debouncedUpdateTimeout = setTimeout(debouncedUpdateMethod, timeout);
}

export function unmount() {
  if (mainVnode) {
    mainComponent = v(() => null, {}) as VnodeComponentInterface;
    const result = update();
    for (const name of eventListenerNames) {
      mainVnode.dom.removeEventListener(name.slice(2), eventListener);
    }
    eventListenerNames.clear();

    callSet(mainVnode.onremove);

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
