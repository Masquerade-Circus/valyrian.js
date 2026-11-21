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

type LifecycleCleanup = () => void;
type OnCreateCallback = () => void | LifecycleCleanup | Promise<void>;
type OnUpdateCallback = () => void | LifecycleCleanup;

export interface Properties extends DefaultRecord {}

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
export const fragment = Symbol.for("valyrian.fragment");
export type Fragment = typeof fragment;
export type VnodeTag = string | ValyrianComponent | Fragment;

const OLD_CHILD_COMPONENTS = Symbol("oldChildComponents");
const CHILD_COMPONENTS = Symbol("childComponents");
const HAS_KEYS = Symbol("hasKeys");
const IS_SVG = Symbol("isSVG");
const ON_CREATE = Symbol("oncreate");
const ON_UPDATE = Symbol("onupdate");
const ON_CLEANUP = Symbol("oncleanup");
const ON_REMOVE = Symbol("onremove");

export class Vnode {
  declare [IS_SVG]?: boolean;
  declare [OLD_CHILD_COMPONENTS]?: Set<ValyrianComponent>;
  declare [CHILD_COMPONENTS]?: Set<ValyrianComponent>;
  declare [HAS_KEYS]?: boolean;
  declare [ON_CREATE]?: Set<Function>;
  declare [ON_CLEANUP]?: Set<Function>;
  declare [ON_UPDATE]?: Set<Function>;
  declare [ON_REMOVE]?: Set<Function>;

  constructor(
    public tag: VnodeTag,
    public props: null | Properties,
    public children: Children,
    public key?: string | number,
    public dom?: DomElement,
    isSVG?: boolean,
    oldChildComponents?: Set<ValyrianComponent>,
    childComponents?: Set<ValyrianComponent>,
    hasKeys?: boolean,
    oncreate?: Set<Function>,
    oncleanup?: Set<Function>,
    onupdate?: Set<Function>,
    onremove?: Set<Function>
  ) {
    this[IS_SVG] = isSVG;
    this[OLD_CHILD_COMPONENTS] = oldChildComponents;
    this[CHILD_COMPONENTS] = childComponents;
    this[HAS_KEYS] = hasKeys;
    this[ON_CREATE] = oncreate;
    this[ON_CLEANUP] = oncleanup;
    this[ON_UPDATE] = onupdate;
    this[ON_REMOVE] = onremove;
  }
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

export function v(tagOrComponent: VnodeTag, props: Properties | null, ...children: Children) {
  const key = props?.key;

  if (typeof key !== "undefined") {
    Reflect.deleteProperty(props as Properties, "key");
  }

  return new Vnode(tagOrComponent, props, children, key);
}

v.fragment = (_: any, ...children: Children) => children;

const DOM_SNAPSHOT = Symbol("valyrian.domSnapshot");
type VnodeWithOrigin = VnodeWithDom & { [DOM_SNAPSHOT]?: true };

export function hydrateDomToVnode(dom: any): VnodeWithDom | string | null | void {
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
        const childVnode = hydrateDomToVnode(childDom);
        children.push(childVnode);
      }
    }

    const attributes = dom.attributes;
    for (let i = 0, l = attributes.length; i < l; i++) {
      const attr = attributes[i];
      props[attr.nodeName] = attr.nodeValue;
    }

    const vnode = new Vnode(tag, props, children);
    // Keep the internal origin out of enumerable VNode data.
    Object.defineProperty(vnode, DOM_SNAPSHOT, { value: true });
    vnode.dom = dom;
    dom.vnode = vnode;
    vnode[IS_SVG] = tag === "svg";
    return vnode as VnodeWithDom;
  }
}

export function trust(htmlString: string) {
  const div = createElement("div");
  div.innerHTML = htmlString.trim();
  return Array.from(div.childNodes).map(hydrateDomToVnode);
}

type RendererState = {
  mainComponent: VnodeComponentInterface | null;
  mainVnode: VnodeWithDom | null;
  moveCommand: "moveBefore" | "insertBefore";
  isMounted: boolean;
  current: {
    oldVnode: Vnode | null;
    vnode: Vnode | null;
    component: ValyrianComponent | null;
    event: Event | null;
  };
  commitQueue: Function[] | null;
  isFlushingCommit: boolean;
  pendingUpdateAfterCommit: boolean;
  eventListenerNames: Set<string>;
  debouncedUpdateTimeout: any;
};

const rendererStateKey = Symbol.for("valyrian.rendererState");

function createRendererState(): RendererState {
  return {
    mainComponent: null,
    mainVnode: null,
    moveCommand: "insertBefore",
    isMounted: false,
    current: { oldVnode: null, vnode: null, component: null, event: null },
    commitQueue: null,
    isFlushingCommit: false,
    pendingUpdateAfterCommit: false,
    eventListenerNames: new Set(),
    debouncedUpdateTimeout: null
  };
}

const rendererState = createRendererState();

function getRendererState(): RendererState {
  if (isNodeJs && typeof sessionStorage !== "undefined") {
    const storage = sessionStorage as Storage & {
      store?: Record<string | symbol, unknown>;
    };
    const store = storage.store;
    if (store) {
      let state = store[rendererStateKey] as RendererState | undefined;
      if (!state) {
        state = createRendererState();
        store[rendererStateKey] = state;
      }
      return state;
    }
  }
  return rendererState;
}

export const current = isNodeJs
  ? new Proxy(rendererState.current, {
      get(_target, property) {
        return Reflect.get(getRendererState().current, property);
      },
      set(_target, property, value) {
        return Reflect.set(getRendererState().current, property, value);
      }
    })
  : rendererState.current;

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
  "v-remove",
  "v-ref",

  // Just for security reasons avoid to use this properties
  "innerHTML",
  "outerHTML",
  "srcdoc"
]);

type SetType = typeof ON_CREATE | typeof ON_UPDATE | typeof ON_CLEANUP | typeof ON_REMOVE;

const SUBTREE_LC = Symbol.for("valyrian.subtreeLifecycle");

function markSubtreeLifecycle(dom: DomElement) {
  let node: any = dom;
  while (node && node.nodeType === 1 && !node[SUBTREE_LC]) {
    node[SUBTREE_LC] = true;
    node = node.parentElement;
  }
}

function registerCleanup(cleanup: Function, vnode: VnodeWithDom) {
  (vnode[ON_CLEANUP] ||= new Set()).add(cleanup);

  if (vnode.dom) {
    markSubtreeLifecycle(vnode.dom);
  }
}

function addCallbackToSet(callback: Function, setType: SetType, vnode: VnodeWithDom) {
  const callbacks = (vnode[setType] ||= new Set());

  if (vnode.dom && (setType === ON_CLEANUP || setType === ON_REMOVE)) {
    markSubtreeLifecycle(vnode.dom);
  }

  callbacks.add(() => {
    const cleanup = callback();
    if (typeof cleanup === "function") {
      registerCleanup(cleanup, vnode);
    }
  });
}

function getCurrentComponentState(): RendererState["current"] {
  const currentState = getRendererState().current;
  if (!currentState.vnode) {
    throw new Error("This function must be called inside a component");
  }
  return currentState;
}

export const onCreate = (callback: OnCreateCallback) => {
  const currentState = getCurrentComponentState();
  const parentVnode = currentState.vnode as VnodeWithDom;
  const component = currentState.component as ValyrianComponent;
  const hasComponentAsOldChild = parentVnode[OLD_CHILD_COMPONENTS]?.has(component);

  if (!hasComponentAsOldChild) {
    (parentVnode[ON_CREATE] ||= new Set()).add(() => {
      const state = getRendererState();
      const mainVnode = state.mainVnode;
      const cleanup = callback();
      if (typeof cleanup === "function") {
        registerCleanup(cleanup, parentVnode);
        return;
      }

      if (isThenable(cleanup)) {
        Promise.resolve(cleanup)
          .then(() => undefined)
          .catch((error) => {
            console.error("Error in onCreate:", error);
          })
          .finally(() => {
            if (mainVnode !== null && state.mainVnode === mainVnode) {
              debouncedUpdate();
            }
          });
      }
    });
  }
};
export const onUpdate = (callback: OnUpdateCallback) => {
  const currentState = getCurrentComponentState();
  const parentVnode = currentState.vnode as VnodeWithDom;
  const component = currentState.component as ValyrianComponent;
  const hasComponentAsChild = parentVnode[CHILD_COMPONENTS]?.has(component);
  if (hasComponentAsChild) {
    addCallbackToSet(callback, ON_UPDATE, parentVnode);
  }
};
export const onCleanup = (callback: Function) => {
  const currentState = getCurrentComponentState();
  addCallbackToSet(callback, ON_CLEANUP, currentState.vnode as VnodeWithDom);
};
export const onRemove = (callback: Function) => {
  const currentState = getCurrentComponentState();
  const parentVnode = currentState.vnode as VnodeWithDom;
  const component = currentState.component as ValyrianComponent;
  let removed = false;

  function removeCallback() {
    const hasComponentAsChild = parentVnode[CHILD_COMPONENTS]?.has(component);

    if (hasComponentAsChild || removed) {
      return;
    }

    removed = true;
    callback();
  }

  addCallbackToSet(removeCallback, ON_REMOVE, parentVnode);
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

const commitSet = (set?: Set<Function> | null) => {
  if (!set || set.size === 0) {
    return;
  }
  const callbacks = Array.from(set);
  set.clear();
  const state = getRendererState();
  if (!state.commitQueue) {
    state.commitQueue = [];
  }
  state.commitQueue.push(() => {
    for (let i = 0; i < callbacks.length; i++) {
      callbacks[i]();
    }
  });
};

function collectVnodesPostOrder(dom: DomElement, out: VnodeWithDom[]) {
  const childNodes = dom.childNodes as unknown as DomElement[];
  for (let i = 0; i < childNodes.length; i++) {
    const child = childNodes[i];
    if (!child || child.nodeType !== 1) {
      continue;
    }
    collectVnodesPostOrder(child, out);
  }
  const vnode = dom.vnode as VnodeWithDom;
  if (vnode) {
    out.push(vnode);
  }
}

function callCleanupOnVnodes(vnodes: VnodeWithDom[]) {
  for (let i = 0; i < vnodes.length; i++) {
    const callbacks = vnodes[i][ON_CLEANUP];
    if (callbacks?.size) {
      callSet(callbacks);
    }
  }
}

function callRemoveOnVnodes(vnodes: VnodeWithDom[]) {
  for (let i = 0; i < vnodes.length; i++) {
    const callbacks = vnodes[i][ON_REMOVE];
    if (callbacks?.size) {
      callSet(callbacks);
    }
  }
}

function strictRemoveNode(dom: DomElement) {
  if (!dom || dom.nodeType !== 1) {
    return;
  }

  if (!(dom as any)[SUBTREE_LC]) {
    dom.remove();
    return;
  }

  const vnodes: VnodeWithDom[] = [];
  collectVnodesPostOrder(dom, vnodes);
  callCleanupOnVnodes(vnodes);
  dom.remove();
  callRemoveOnVnodes(vnodes);
}

function strictReplaceChild(parent: DomElement, newNode: Node, oldNode: DomElement) {
  let vnodes: VnodeWithDom[] | null = null;
  if (oldNode && oldNode.nodeType === 1 && (oldNode as any)[SUBTREE_LC]) {
    vnodes = [];
    collectVnodesPostOrder(oldNode, vnodes);
    callCleanupOnVnodes(vnodes);
  }
  parent.replaceChild(newNode, oldNode);
  if (vnodes) {
    callRemoveOnVnodes(vnodes);
  }
}

export const directives: Record<string, Directive> = {
  "v-create": (callback, vnode, oldProps) => {
    if (oldProps) {
      return;
    }

    addCallbackToSet(() => callback(vnode), ON_CREATE, vnode);
  },

  "v-update": (callback, vnode, oldProps) => {
    if (!oldProps) {
      return;
    }
    addCallbackToSet(() => callback(vnode, oldProps), ON_UPDATE, vnode);
  },

  "v-cleanup": (callback, vnode) => {
    (vnode[ON_CLEANUP] ||= new Set()).add(() => callback(vnode));
    markSubtreeLifecycle(vnode.dom);
  },

  "v-remove": (callback, vnode) => {
    (vnode[ON_REMOVE] ||= new Set()).add(() => callback(vnode));
    markSubtreeLifecycle(vnode.dom);
  },

  "v-ref": (ref, vnode) => {
    if (typeof ref === "function") {
      const cleanup = ref(vnode.dom, vnode);
      registerCleanup(() => {
        ref(null, vnode);
        if (typeof cleanup === "function") {
          cleanup();
        }
      }, vnode);
      return;
    }

    if (ref && typeof ref === "object") {
      ref.current = vnode.dom;
      registerCleanup(() => {
        if (ref.current === vnode.dom) {
          ref.current = null;
        }
      }, vnode);
    }
  },

  "v-if": (value, vnode) => {
    if (!Boolean(value)) {
      const parentNode = vnode.dom?.parentNode;
      if (parentNode) {
        strictReplaceChild(parentNode as DomElement, document.createTextNode(""), vnode.dom);
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
    if ("name" in vnode.props === false) {
      return;
    }

    let value;
    const property = vnode.props.name;
    if (property === "__proto__" || property === "constructor" || property === "prototype") {
      return;
    }
    let event = "oninput";

    // This function updates the model property when the input element's value changes
    let handler = (e: Event) => (model[property] = (e.target as unknown as DomElement & Record<string, any>).value);
    if (vnode.tag === "input") {
      // Depending on the type of input element, use a different handler function
      switch (vnode.props.type) {
        case "checkbox": {
          if (Array.isArray(model[property])) {
            // If the model property is an array, add or remove the value from the array when the checkbox is checked or unchecked
            handler = (e: Event) => {
              const val = (e.target as unknown as DomElement & Record<string, any>).value;
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
          vnode.props.checked = value;
          vnode.dom.checked = value;
          break;
        }
        case "radio": {
          // If the element is a radio button, set the "checked" attribute based on the value of the model property
          const isChecked = model[property] === vnode.dom.value;
          vnode.props.checked = isChecked;
          vnode.dom.checked = isChecked;
          break;
        }
        default: {
          // For all other input types, set the "value" attribute based on the value of the model property
          vnode.props.value = model[property];
          vnode.dom.value = model[property];
        }
      }
    } else if (vnode.tag === "select") {
      // If the element is a select element, use the "click" event by default
      event = "onclick";
      const isMultiple = Boolean(vnode.props.multiple);
      if (vnode.props.multiple) {
        // If the select element allows multiple selections, update the model property with an array of selected values
        handler = (e: Event & Record<string, any>) => {
          const val = (e.target as unknown as DomElement & Record<string, any>).value;
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
      }
      // Set the "selected" attribute on the options without changing their order.
      for (let i = 0; i < vnode.children.length; i++) {
        const child = vnode.children[i] as VnodeWithDom;
        if (child.tag === "option") {
          const optionValue = "value" in child.props ? child.props.value : child.children.join("").trim();
          child.props.selected = isMultiple
            ? model[property].indexOf(optionValue) !== -1
            : optionValue === model[property];
        }
      }
    } else if (vnode.tag === "textarea") {
      // Set the textarea's content to the value of the model property
      vnode.children = [model[property]];
    }

    // We assume that the prev handler if any will not be changed by the user across patchs
    const prevHandler = vnode.props[event];

    // Set the event handler on the element

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

  // Frequent properties are handled directly in updateAttributes.
  style: (value, newVnode) => {
    const vnodeDom = newVnode.dom;
    if (typeof value === "string") {
      if (newVnode[IS_SVG]) {
        vnodeDom.setAttribute("style", value);
        return;
      }
      vnodeDom.style = value;
      return;
    }

    if (typeof value === "object") {
      if (newVnode[IS_SVG]) {
        vnodeDom.setAttribute("style", "");
      } else {
        vnodeDom.style = "";
      }
      const domStyle = vnodeDom.style;
      for (const styleName in value) {
        domStyle[styleName] = value[styleName];
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

const preventedUpdates = new WeakMap<Event, boolean>();

export function preventUpdate() {
  const event = getRendererState().current.event;
  if (!event) {
    return;
  }

  preventedUpdates.set(event, true);
}

function sharedSetAttribute(name: string, value: any, newVnode: VnodeWithDom): void {
  if (typeof value === "function") {
    const state = getRendererState();
    if (!state.eventListenerNames.has(name)) {
      // We attach the delegated event listener to the main vnode dom element, which is the root of the component
      (state.mainVnode as VnodeWithDom).dom.addEventListener(name.slice(2), eventListener);
      state.eventListenerNames.add(name);
    }
    return;
  }

  const newVnodeDom = newVnode.dom;
  if (!newVnode[IS_SVG] && name in newVnodeDom) {
    newVnodeDom[name] = value;
    return;
  }

  if (value === false) {
    newVnodeDom.removeAttribute(name);
  } else {
    newVnodeDom.setAttribute(name, value);
  }
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof Reflect.get(value, "then") === "function"
  );
}

function eventListener(e: Event) {
  const currentState = getRendererState().current;
  const previousEvent = currentState.event;
  currentState.event = e;
  let dom = e.target as unknown as DomElement;
  const name = `on${e.type}`;

  while (dom) {
    const oldVnode = dom.vnode as VnodeWithDom;
    if (oldVnode && oldVnode.props[name]) {
      let result: unknown;
      try {
        result = oldVnode.props[name](e, oldVnode);
      } finally {
        currentState.event = previousEvent;
      }

      if (preventedUpdates.get(e) !== true) {
        update();
      }

      if (isThenable(result)) {
        Promise.resolve(result).finally(() => {
          if (preventedUpdates.get(e) !== true) {
            update();
          }
        });
      }

      return;
    }
    dom = dom.parentNode as DomElement;
  }

  currentState.event = previousEvent;
}

export function setAttribute(name: string, value: any, newVnode: VnodeWithDom): void {
  if (!reservedProps.has(name)) {
    newVnode.props[name] = value;
    sharedSetAttribute(name, value, newVnode);
  }
}

function updateSVGAttributes(newVnode: VnodeWithDom, oldVnode?: VnodeWithOrigin): void | false {
  const vnodeDom = newVnode.dom;
  const vnodeProps = newVnode.props;
  const oldVnodeProps = oldVnode?.props;
  // null means directive props have not been resolved yet.
  let oldDirectiveProps: Properties | undefined | null = null;
  vnodeDom.vnode = newVnode;

  if (oldVnodeProps) {
    const eventListenerNames = getRendererState().eventListenerNames;
    for (const name in oldVnodeProps) {
      if (name in vnodeProps === false && !eventListenerNames.has(name) && !reservedProps.has(name)) {
        vnodeDom.removeAttribute(name);
      }
    }
  }

  for (const name in vnodeProps) {
    const value = vnodeProps[name];

    if (name === "class") {
      if (oldVnodeProps && oldVnodeProps[name] === value) {
        continue;
      }
      if (vnodeDom.className !== value) {
        vnodeDom.setAttribute("class", value);
      }
      continue;
    }

    if (name === "id") {
      if (oldVnodeProps && oldVnodeProps[name] === value) {
        continue;
      }
      if (vnodeDom.id !== value) {
        vnodeDom.setAttribute("id", value);
      }
      continue;
    }

    if (name in directives) {
      if (oldDirectiveProps === null) {
        oldDirectiveProps = oldVnode?.[DOM_SNAPSHOT] ? void 0 : oldVnodeProps;
      }
      const runDirective = directives[name];
      const result = runDirective(value, newVnode, oldDirectiveProps);
      if (result === false) {
        return;
      }
      continue;
    }

    if (!reservedProps.has(name)) {
      if (oldVnodeProps && oldVnodeProps[name] === value) {
        continue;
      }
      sharedSetAttribute(name, value, newVnode);
    }
  }
}

function updateDomAttributes(newVnode: VnodeWithDom, oldVnode?: VnodeWithOrigin): void | false {
  const vnodeDom = newVnode.dom;
  const vnodeProps = newVnode.props;
  const oldVnodeProps = oldVnode?.props;
  let oldDirectiveProps: Properties | undefined | null = null;
  vnodeDom.vnode = newVnode;

  if (oldVnodeProps) {
    const eventListenerNames = getRendererState().eventListenerNames;
    for (const name in oldVnodeProps) {
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
    const value = vnodeProps[name];

    if (name === "class") {
      if (oldVnodeProps && oldVnodeProps[name] === value) {
        continue;
      }
      if (vnodeDom.className !== value) {
        vnodeDom.className = value;
      }
      continue;
    }

    if (name === "id") {
      if (oldVnodeProps && oldVnodeProps[name] === value) {
        continue;
      }
      if (vnodeDom.id !== value) {
        vnodeDom.id = value;
      }
      continue;
    }

    if (name in directives) {
      if (oldDirectiveProps === null) {
        oldDirectiveProps = oldVnode?.[DOM_SNAPSHOT] ? void 0 : oldVnodeProps;
      }
      const runDirective = directives[name];
      const result = runDirective(value, newVnode, oldDirectiveProps);
      if (result === false) {
        return;
      }
      continue;
    }

    if (!reservedProps.has(name)) {
      if (oldVnodeProps && oldVnodeProps[name] === value) {
        continue;
      }
      sharedSetAttribute(name, value, newVnode);
    }
  }
}

export function updateAttributes(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void | false {
  return newVnode[IS_SVG] ? updateSVGAttributes(newVnode, oldVnode) : updateDomAttributes(newVnode, oldVnode);
}

const SvgElementNS = "http://www.w3.org/2000/svg";

export function createElement(tag: string, isSVG?: boolean): DomElement {
  return isSVG
    ? (document.createElementNS(SvgElementNS, tag) as DomElement)
    : (document.createElement(tag) as DomElement);
}

function flatTree(newVnode: VnodeWithDom, mounting = false) {
  let children: Children;
  const newChildren = newVnode.children;
  const parentIsSVG = newVnode[IS_SVG];
  newVnode[HAS_KEYS] = false;
  newVnode[OLD_CHILD_COMPONENTS] = newVnode[CHILD_COMPONENTS];
  newVnode[CHILD_COMPONENTS] = void 0;

  if ("v-for" in newVnode.props) {
    const callback = newVnode.children[0];
    if (typeof callback !== "function") {
      console.warn("v-for directive must have a callback function as children");
      return [];
    }

    const set = newVnode.props["v-for"];
    const setLength = set.length;
    const simpleChildren = new Array(setLength) as Children;
    let fallbackChildren: Children | null = null;

    for (let i = 0; i < setLength; i++) {
      const newChild = callback(set[i], i);
      if (fallbackChildren === null && newChild instanceof Vnode && typeof newChild.tag === "string") {
        newChild.props = newChild.props || {};
        newChild[IS_SVG] = parentIsSVG || newChild.tag === "svg";
        newVnode[HAS_KEYS] = newVnode[HAS_KEYS] || typeof newChild.key !== "undefined";
        simpleChildren[i] = newChild;
        continue;
      }

      if (fallbackChildren === null) {
        fallbackChildren = new Array(setLength) as Children;
        for (let j = 0; j < i; j++) {
          fallbackChildren[setLength - 1 - j] = simpleChildren[j];
        }
      }
      fallbackChildren[setLength - 1 - i] = newChild;
    }

    if (fallbackChildren === null) {
      return simpleChildren;
    }

    children = fallbackChildren;
  } else {
    const newChildrenLength = newChildren.length;
    if (newChildrenLength === 0 && mounting) {
      return [];
    }
    children = new Array(newChildrenLength);
    for (let i = newChildrenLength - 1, l = 0; i >= 0; i--, l++) {
      children[l] = newChildren[i];
    }
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
      newChild[IS_SVG] = parentIsSVG || newChild.tag === "svg";

      if (newChild.tag === fragment) {
        for (let l = newChild.children.length - 1; l >= 0; l--) {
          children.push(newChild.children[l]);
        }
        continue;
      }

      if (typeof newChild.tag !== "string") {
        const component = (current.component = newChild.tag);
        (newVnode[CHILD_COMPONENTS] ||= new Set()).add(component);

        children.push(
          (typeof component === "function" ? component : component.view).call(
            component,
            newChild.props,
            newChild.children
          )
        );

        continue;
      }

      newVnode[HAS_KEYS] = newVnode[HAS_KEYS] || typeof newChild.key !== "undefined";
      out.push(newChild);
      continue;
    }

    out.push(newChild);
  }

  return out;
}

function processNewChild(
  newChild: VnodeWithDom,
  parentVnode: VnodeWithDom,
  oldDom?: DomElement,
  appendTarget?: Node,
  before?: Node
) {
  const dom = createElement(newChild.tag, newChild[IS_SVG]);

  if (oldDom) {
    newChild.dom = dom;
    strictReplaceChild(parentVnode.dom, newChild.dom, oldDom);
  } else if (before) {
    newChild.dom = parentVnode.dom.insertBefore(dom, before) as unknown as DomElement;
  } else {
    newChild.dom = (appendTarget || parentVnode.dom).appendChild(dom) as unknown as DomElement;
  }
  newChild[IS_SVG] ? updateSVGAttributes(newChild) : updateDomAttributes(newChild);
  if ("v-text" in newChild.props) {
    newChild.dom.textContent = newChild.props["v-text"];
  } else {
    const currentState = getRendererState().current;
    currentState.oldVnode = null;
    currentState.vnode = newChild;

    const children = flatTree(newChild, true);
    if (children.length === 0) {
      newChild.dom.textContent = "";
    } else {
      appendNewChildren({ parentVnode: newChild, children, start: 0, target: newChild.dom });
    }
  }

  if (newChild[ON_CREATE]?.size) {
    commitSet(newChild[ON_CREATE]);
  }
}

function appendNewChildren({
  parentVnode,
  children,
  start,
  target
}: {
  parentVnode: VnodeWithDom;
  children: Children;
  start: number;
  target: Node;
}): void {
  const dom = parentVnode.dom;
  const useFragment = target !== dom;
  let hasFragmentLifecycle = false;
  for (let i = start, length = children.length; i < length; i++) {
    const child = children[i] as VnodeWithDom;
    if (child instanceof Vnode === false) {
      target.appendChild(document.createTextNode(child));
      continue;
    }
    processNewChild(child, parentVnode, undefined, target);
    if (useFragment && (child.dom as any)[SUBTREE_LC]) {
      hasFragmentLifecycle = true;
    }
  }
  if (useFragment) {
    dom.appendChild(target);
    if (hasFragmentLifecycle) {
      markSubtreeLifecycle(dom);
    }
  }
}

// Indices are relative to the changed range. The values are old DOM positions.
// Leave the longest increasing subsequence in place. Each tail tracks the
// smallest old end position for a subsequence of that length.
function stableKeyedPositions(positions: number[]): Set<number> {
  const tails: number[] = [];
  const previous: number[] = [];
  for (let i = 0; i < positions.length; i++) {
    const position = positions[i];
    if (position === -1) {
      continue;
    }
    let low = tails.length;
    if (low > 0 && positions[tails[low - 1]] >= position) {
      let high = low - 1;
      low = 0;
      while (low < high) {
        const mid = (low + high) >>> 1;
        if (positions[tails[mid]] < position) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
    }
    previous[i] = low > 0 ? tails[low - 1] : -1;
    tails[low] = i;
  }

  const stable = new Set<number>();
  for (let i = tails[tails.length - 1]; i >= 0; i = previous[i]) {
    stable.add(i);
  }
  return stable;
}

function reconcileKeyedRange({
  dom,
  childNodes,
  children,
  start
}: {
  dom: DomElement;
  childNodes: DomElement[];
  children: Children;
  start: number;
}): { matches: (DomElement | null)[]; removals: DomElement[] } {
  const oldKeys = new Map<string | number, number>();
  for (let i = start; i < childNodes.length; i++) {
    const key = childNodes[i].vnode?.key;
    if (key != null) {
      oldKeys.set(key, i);
    }
  }

  const matches: (DomElement | null)[] = [];
  const positions: number[] = [];
  const retained: boolean[] = [];
  let lastPosition = -1;
  let reordered = false;
  for (let i = start; i < children.length; i++) {
    const child = children[i] as VnodeWithDom;
    const key = child instanceof Vnode ? child.key : null;
    const position = key == null ? i : oldKeys.get(key);
    const candidate = position == null ? null : childNodes[position];
    const match =
      candidate &&
      (key != null || candidate.vnode?.key == null) &&
      (child instanceof Vnode
        ? child.tag === (candidate.vnode?.tag || candidate.nodeName.toLowerCase())
        : candidate.nodeType === 3);

    if (!match || position == null || retained[position]) {
      matches.push(null);
      positions.push(-1);
      continue;
    }

    matches.push(candidate);
    positions.push(position);
    retained[position] = true;
    reordered = reordered || position < lastPosition;
    lastPosition = position;
  }

  // Keep unmatched children mounted until their surviving siblings have run directives.
  const removals: DomElement[] = [];
  for (let i = childNodes.length - 1; i >= start; i--) {
    if (!retained[i]) {
      removals.push(childNodes[i]);
    }
  }

  if (reordered) {
    const moveCommand = getRendererState().moveCommand;
    const stable = stableKeyedPositions(positions);
    let before: DomElement | null = null;
    for (let i = matches.length - 1; i >= 0; i--) {
      const child = matches[i];
      if (child) {
        if (!stable.has(i)) {
          dom[moveCommand](child, before);
        }
        before = child;
      }
    }
  }

  return { matches, removals };
}

function patch(newVnode: VnodeWithDom, oldVnode: VnodeWithDom | null): void {
  const currentState = getRendererState().current;
  currentState.oldVnode = oldVnode;
  currentState.vnode = newVnode;
  // Hydrated vnodes have never been flattened and have no rendered key state.
  const hydrating = typeof (oldVnode || newVnode)[HAS_KEYS] === "undefined";
  const children = flatTree(newVnode);
  const dom = newVnode.dom;

  if (children.length === 0) {
    if (dom.childNodes.length !== 0) {
      if (!(dom as any)[SUBTREE_LC]) {
        dom.textContent = "";
      } else {
        const childNodes = Array.from(dom.childNodes) as any[];
        for (let i = childNodes.length - 1; i >= 0; i--) {
          const child = childNodes[i];
          if (child && child.nodeType === 1) {
            strictRemoveNode(child);
          } else {
            child?.remove?.();
          }
        }
      }
    }
    if (newVnode[ON_CREATE]?.size) {
      commitSet(newVnode[ON_CREATE]);
    }
    if (newVnode[ON_UPDATE]?.size) {
      commitSet(newVnode[ON_UPDATE]);
    }
    return;
  }

  const childNodes = dom.childNodes as unknown as DomElement[];
  const oldChildrenLength = childNodes.length;
  const childrenLength = children.length;
  if (oldChildrenLength === 0) {
    const target = childrenLength > 1 ? document.createDocumentFragment() : dom;
    appendNewChildren({ parentVnode: newVnode, children, start: 0, target });
    if (newVnode[ON_CREATE]?.size) {
      commitSet(newVnode[ON_CREATE]);
    }
    return;
  }

  let keyedStart = 0;
  let keyedChildren: ReturnType<typeof reconcileKeyedRange> | null = null;
  let nextMatch = 0;
  for (let i = 0; i < childrenLength; i++) {
    const newChild = children[i] as VnodeWithDom;
    const currentChild = childNodes[i];
    if (newVnode[HAS_KEYS] && !hydrating && !keyedChildren && currentChild) {
      const key = newChild instanceof Vnode ? newChild.key : null;
      if ((key ?? null) !== (currentChild.vnode?.key ?? null)) {
        keyedStart = i;
        keyedChildren = reconcileKeyedRange({ dom, childNodes, children, start: i });
      }
    }
    const offset = i - keyedStart;
    const oldChild = keyedChildren ? keyedChildren.matches[offset] : currentChild;
    let before: DomElement | null = null;
    if (keyedChildren && !oldChild) {
      const { matches } = keyedChildren;
      nextMatch = Math.max(nextMatch, offset + 1);
      while (nextMatch < matches.length && !matches[nextMatch]) {
        nextMatch++;
      }
      before = matches[nextMatch] ?? null;
    }

    if (!oldChild && !keyedChildren) {
      const target = newVnode[HAS_KEYS] ? dom : document.createDocumentFragment();
      appendNewChildren({ parentVnode: newVnode, children, start: i, target });
      break;
    }

    if (newChild instanceof Vnode === false) {
      if (!oldChild) {
        dom.insertBefore(document.createTextNode(newChild), before);
        continue;
      }

      if (oldChild.nodeType !== 3) {
        strictReplaceChild(dom, document.createTextNode(newChild), oldChild);
        continue;
      }

      if (oldChild.nodeValue != newChild) {
        oldChild.nodeValue = newChild;
      }
      continue;
    }

    if (
      !oldChild ||
      newChild.tag !== ((oldChild.vnode as VnodeWithDom | undefined)?.tag || oldChild.nodeName.toLowerCase())
    ) {
      if (keyedChildren) {
        processNewChild(newChild, newVnode, undefined, undefined, before ?? undefined);
      } else {
        processNewChild(newChild, newVnode, oldChild ?? undefined);
      }
      continue;
    }

    newChild.dom = oldChild;
    const oldChildVnode = oldChild.vnode as VnodeWithDom;

    if ("v-keep" in newChild.props && oldChildVnode) {
      if (oldChildVnode.props["v-keep"] === newChild.props["v-keep"]) {
        continue;
      }
    }

    const cleanup = oldChildVnode?.[ON_CLEANUP];
    if (cleanup?.size) {
      callSet(cleanup);
    }
    newChild[IS_SVG]
      ? updateSVGAttributes(newChild as VnodeWithDom, oldChildVnode)
      : updateDomAttributes(newChild as VnodeWithDom, oldChildVnode);

    if ("v-text" in newChild.props) {
      if (oldChild.textContent != newChild.props["v-text"]) {
        oldChild.textContent = newChild.props["v-text"];
      }
      if (newChild[ON_CREATE]?.size) {
        commitSet(newChild[ON_CREATE]);
      }
      if (newChild[ON_UPDATE]?.size) {
        commitSet(newChild[ON_UPDATE]);
      }
      continue;
    }

    patch(newChild as VnodeWithDom, oldChildVnode || null);
  }

  const removals = keyedChildren?.removals;
  const removalCount = removals ? removals.length : childNodes.length - childrenLength;
  for (let i = 0; i < removalCount; i++) {
    const toRemove = removals ? removals[i] : childNodes[childNodes.length - 1];
    if (toRemove && toRemove.nodeType === 1) {
      strictRemoveNode(toRemove);
    } else {
      toRemove?.remove();
    }
  }

  // In here we could have new children or/and patched children
  // So we need to call the oncreate and onupdate callbacks
  if (newVnode[ON_CREATE]?.size) {
    commitSet(newVnode[ON_CREATE]);
  }
  if (newVnode[ON_UPDATE]?.size) {
    commitSet(newVnode[ON_UPDATE]);
  }
}

export function updateVnode(vnode: VnodeWithDom, shouldCleanup = true): string | void {
  const state = getRendererState();
  const currentState = state.current;
  vnode.props = vnode.props || {};
  const previousCommitQueue = state.commitQueue;
  state.commitQueue = null;
  const cleanup = vnode[ON_CLEANUP];
  if (shouldCleanup && cleanup?.size) {
    // The clean up must be from the old vnode
    // and in here the vnode is the old one
    // so, we need to call the cleanup before the patch
    // inside  the patch the clean up will be called only for the old children
    callSet(cleanup);
  }
  // Clone the old on remove set to call it after the patch
  const oldOnRemoveSet = vnode[ON_REMOVE]?.size ? new Set(vnode[ON_REMOVE]) : null;
  currentState.vnode = vnode;
  try {
    patch(vnode, shouldCleanup ? vnode : null);
    if (oldOnRemoveSet?.size) {
      callSet(oldOnRemoveSet);
    }
    const nextCommitQueue = state.commitQueue as Function[] | null;
    if (nextCommitQueue) {
      const previousIsFlushingCommit = state.isFlushingCommit;
      state.isFlushingCommit = true;
      try {
        for (let i = 0; i < nextCommitQueue.length; i++) {
          nextCommitQueue[i]();
        }
      } finally {
        state.isFlushingCommit = previousIsFlushingCommit;
      }
    }
    if (state.pendingUpdateAfterCommit) {
      state.pendingUpdateAfterCommit = false;
      updateVnode(vnode, true);
    }
    state.isMounted = true;
    currentState.oldVnode = null;
    currentState.vnode = null;
    currentState.component = null;
  } finally {
    state.commitQueue = previousCommitQueue;
  }
}

export function update(): string {
  const state = getRendererState();
  if (state.mainVnode) {
    if (state.isFlushingCommit) {
      state.pendingUpdateAfterCommit = true;
      if (isNodeJs) {
        return state.mainVnode.dom.innerHTML;
      }
      return "";
    }
    state.mainVnode.children = [state.mainComponent];
    // If the updateVnode method is called from outside the main lib (e.g. from a directive)
    // it always be considered as mounted, so the cleanup will be called before the patch
    // But in here, we need to pass the shouldCleanup as false if the app is not mounted
    updateVnode(state.mainVnode, state.isMounted);
    if (isNodeJs) {
      return state.mainVnode.dom.innerHTML;
    }
  }
  return "";
}

export function debouncedUpdate(timeout = 42) {
  preventUpdate();
  const state = getRendererState();
  const mainVnode = state.mainVnode;
  clearTimeout(state.debouncedUpdateTimeout);
  state.debouncedUpdateTimeout = setTimeout(() => {
    if (mainVnode !== null && state.mainVnode === mainVnode) {
      if (isNodeJs) {
        update();
        return;
      }

      requestAnimationFrame(() => {
        if (mainVnode !== null && state.mainVnode === mainVnode) {
          update();
        }
      });
    }
  }, timeout);
}

function removeEventListeners(state: RendererState) {
  if (!state.mainVnode) {
    return;
  }
  for (const name of state.eventListenerNames) {
    state.mainVnode.dom.removeEventListener(name.slice(2), eventListener);
  }
  state.eventListenerNames.clear();
}

export function unmount() {
  const state = getRendererState();
  if (state.mainVnode) {
    state.mainComponent = v(() => null, {}) as VnodeComponentInterface;
    const result = update();
    removeEventListeners(state);

    state.mainComponent = null;
    state.mainVnode = null;
    state.moveCommand = "insertBefore";
    state.isMounted = false;
    state.current.vnode = null;
    state.current.component = null;
    state.current.event = null;
    return result;
  }

  return "";
}

export function mount(dom: string | DomElement, component: ValyrianComponent | VnodeComponentInterface | any) {
  const state = getRendererState();
  const container =
    typeof dom === "string"
      ? isNodeJs
        ? document.querySelector(dom) || createElement(dom, dom === "svg")
        : document.querySelector(dom)
      : dom;

  if (!container) {
    throw new Error(`The container element "${dom}" was not found in the DOM.`);
  }

  if (state.mainVnode && state.mainVnode.dom !== container) {
    removeEventListeners(state);
  }

  if (isComponent(component)) {
    state.mainComponent = v(component, {}, []) as VnodeComponentInterface;
  } else if (isVnodeComponent(component)) {
    state.mainComponent = component;
  } else {
    state.mainComponent = v(() => component, {}, []) as VnodeComponentInterface;
  }

  state.mainVnode = hydrateDomToVnode(container) as VnodeWithDom;
  state.moveCommand =
    "moveBefore" in container && typeof container?.moveBefore === "function" ? "moveBefore" : "insertBefore";
  return update();
}
