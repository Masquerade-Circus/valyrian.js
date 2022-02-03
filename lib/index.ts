// We will make a vdom library that will be used to create virtual dom elements and render them to the screen.
// We must try to have the less amount of assignments and if statements

interface DomElement extends Element {
  [key: string]: any;
}

interface Props {
  key?: string | number;
  data?: string;
  oncreate?: { (vnode: Vnode): never };
  onupdate?: { (vnode: Vnode, oldVnode: Vnode): never };
  onremove?: { (oldVnode: Vnode): never };
  shouldupdate?: { (vnode: Vnode, oldVnode: Vnode): undefined | boolean };
  "v-cleanup"?: Function;
  [key: string | number | symbol]: any;
}

interface Children extends Array<Vnode | any> {}

interface Vnode {
  new (tag: string, props: Props, children: Vnode[]): Vnode;
  tag: string;
  props: Props;
  children: Children;
  dom?: DomElement;
  isSVG?: boolean;
  processed?: boolean;
  component?: Component | POJOComponent;
  nodeValue?: string;
  [key: symbol]: any;
}

const Vnode = function Vnode(this: Vnode, tag: string, props: Props, children: Children) {
  this.props = props;
  this.children = children;
  this.tag = tag;
} as unknown as Vnode;

interface Component {
  (props?: Record<string, any> | null, children?: Children): Vnode | Children;
  [key: string | number | symbol]: any;
}

interface POJOComponent {
  view: Component;
  [key: string | number | symbol]: any;
}

type ValyrianComponent = Component | POJOComponent;

interface VnodeComponent extends Vnode {
  tag: "__component__";
  component: ValyrianComponent;
}

interface VnodeWithDom extends Vnode {
  dom: DomElement;
}

interface Directive {
  (value: any, vnode: Vnode, oldVnode?: Vnode): void;
}

interface Plugin {
  (v: v, options?: Record<string | number | symbol, any>): never;
}

interface ValyrianApp {
  isMounted: boolean;
  eventListenerNames: Record<string, true>;
  cleanup: Function[];

  eventListener?: EventListener;
  mainVnode?: VnodeWithDom;
  component?: VnodeComponent;
  container?: DomElement;

  [key: string | number | symbol]: any;
}

interface MountedValyrianApp extends ValyrianApp {
  eventListener: EventListener;
  mainVnode: VnodeWithDom;
  container: DomElement;
  component: VnodeComponent;
}
const ValyrianSymbol = Symbol("Valyrian");

function hideDirective(test: boolean): Directive {
  return (bool: boolean, vnode: Vnode, oldVnode?: Vnode) => {
    let value = test ? bool : !bool;
    if (value) {
      let newdom = document.createTextNode("");
      if (oldVnode && oldVnode.dom && oldVnode.dom.parentNode) {
        oldVnode.tag !== "#text" && onremove(oldVnode);
        oldVnode.dom.parentNode.replaceChild(newdom, oldVnode.dom);
      }
      vnode.tag = "#text";
      vnode.children = [];
      vnode.props = {};
      vnode.dom = newdom as unknown as DomElement;
    }
  };
}

export const trust = (htmlString: string) => {
  let div = createDomElement("div");
  div.innerHTML = htmlString.trim();

  return [].map.call(div.childNodes, (item) => domToVnode(item)) as Vnode[];
};

interface Current {
  app?: ValyrianApp;
  component?: ValyrianComponent;
  vnode?: VnodeWithDom;
  oldVnode?: VnodeWithDom;
}

interface v {
  (tagOrComponent: string | ValyrianComponent, props: Props, ...children: Children): Vnode | VnodeComponent;
  fragment: (props: Props, ...children: Children) => Children;
  current: Current;
}

export function v(tagOrComponent: string | ValyrianComponent, props: Props, ...children: Children): Vnode | VnodeComponent {
  if (typeof tagOrComponent === "string") {
    return new Vnode(tagOrComponent, props || {}, children);
  }

  const vnode = new Vnode("__component__", props || {}, children);
  vnode.component = tagOrComponent;
  return vnode as VnodeComponent;
}

v.fragment = (props: Props, ...children: Children): Children => {
  return children;
};

v.current = {} as Current;

interface Directives {
  [key: string]: Directive;
}

const directives: Directives = {
  "v-if": hideDirective(false),
  "v-unless": hideDirective(true),
  "v-for": (set: unknown[], vnode: Vnode) => {
    vnode.children = set.map(vnode.children[0] as (value: unknown) => Function);
  },
  "v-show": (bool: boolean, vnode: Vnode) => {
    (vnode.dom as unknown as { style: { display: string } }).style.display = bool ? "" : "none";
  },
  "v-class": (classes: { [x: string]: boolean }, vnode: Vnode) => {
    for (let name in classes) {
      (vnode.dom as DomElement).classList.toggle(name, classes[name]);
    }
  },
  "v-html": (html: string, vnode: Vnode) => {
    vnode.children = [trust(html)];
  },
  "v-cleanup"(cleanupFunction: Function) {
    if (typeof cleanupFunction === "function") {
      (this as unknown as ValyrianApp).cleanup.push(cleanupFunction);
    }
  }
};

interface ReservedProps {
  [key: string]: true;
}

const reservedProps: ReservedProps = {
  key: true,
  state: true,
  oncreate: true,
  onupdate: true,
  onremove: true,
  shouldupdate: true,
  "v-cleanup": true,
  "v-once": true,

  // Built in directives
  "v-if": true,
  "v-unless": true,
  "v-for": true,
  "v-show": true,
  "v-class": true,
  "v-html": true
};

const plugins = new Set<Plugin>();

export const isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);

function createDomElement(tag: string, isSVG: boolean = false) {
  return isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
}

function domToVnode(dom: DomElement): VnodeWithDom {
  let vnode = v(
    dom.tagName.toLowerCase(),
    {},
    ...Array.from(dom.childNodes)
      .filter((child) => (child as DomElement).nodeType === 1 || (child as DomElement).nodeType === 3)
      .map((child) => {
        if ((child as DomElement).nodeType === 1) {
          return domToVnode(child as DomElement);
        }

        let text = new Vnode("#text", {}, []);
        text.nodeValue = String((child as DomElement).nodeValue);
        text.dom = child as DomElement;
        return text;
      })
  );
  [].forEach.call(dom.attributes, (prop: Attr) => (vnode.props[prop.nodeName] = prop.nodeValue));
  vnode.dom = dom;
  return vnode as VnodeWithDom;
}

export function isComponent(component?: unknown | ValyrianComponent): component is ValyrianComponent {
  return typeof component === "function" || (typeof component === "object" && component !== null && "view" in component);
}

export function isVnodeComponent(vnode?: unknown): vnode is VnodeComponent {
  return vnode instanceof Vnode && vnode.tag === "__component__";
}

export function isVnode(component?: unknown): component is Vnode {
  return component instanceof Vnode;
}

/*
  * Mounts a component to the DOM
  mount('#app', () => <div>Hello world</div>); // App is a Functional Component
  mount('#app', { view: () => <div>Hello world</div> }); // App is a POJO component with a view method
  mount('#app', classInstance); // App is a class instance with a view method
  mount('#app', <App><div>Hello world</div></App>); // App is a Vnode component (Vnode with tag __component__)
*/

export function mount(container: DomElement | string, component: ValyrianComponent | Vnode) {
  let appContainer = null;

  if (isNodeJs) {
    appContainer = typeof container === "string" ? createDomElement(container === "svg" ? "svg" : "div", container === "svg") : container;
  } else {
    appContainer = typeof container === "string" ? document.querySelectorAll(container)[0] : container;
  }

  if (!appContainer) {
    throw new Error("Container not found");
  }

  // If component is a POJO component or a Functional component or a Vnode

  let vnodeComponent: VnodeComponent | Vnode;

  if (isVnodeComponent(component)) {
    vnodeComponent = component;
  } else if (isComponent(component)) {
    vnodeComponent = v(component, {});
  } else {
    throw new Error("Component must be a Valyrian Component or a Vnode component");
  }

  if (component[ValyrianSymbol]) {
    unmount(component);
  } else {
    component[ValyrianSymbol] = {
      isMounted: false,
      eventListenerNames: {},
      isNodeJs,
      cleanup: []
    };
    function eventListener(e: Event) {
      let dom = e.target as DomElement & Record<string, any>;
      let name = `v-on${e.type}`;
      while (dom) {
        if (dom[name]) {
          dom[name](e, dom);
          if (!e.defaultPrevented) {
            update(component);
          }
          return;
        }
        dom = dom.parentNode as DomElement;
      }
    }
    component[ValyrianSymbol].eventListener = eventListener;
    for (let plugin of plugins) {
      plugin(v, component);
    }
  }

  component[ValyrianSymbol].component = vnodeComponent;
  component[ValyrianSymbol].container = appContainer;
  component[ValyrianSymbol].mainVnode = domToVnode(appContainer);

  // update
  return update(component);
}

function cleanupVnodes(valyrianApp: ValyrianApp) {
  for (let i = 0; i < valyrianApp.cleanup.length; i++) {
    valyrianApp.cleanup[i]();
  }
  valyrianApp.cleanup = [];
}

export function update(component?: ValyrianComponent | Vnode) {
  if (component && component[ValyrianSymbol]) {
    let valyrianApp = component[ValyrianSymbol];
    v.current.app = valyrianApp;
    cleanupVnodes(valyrianApp);
    let oldVnode: VnodeWithDom | null = valyrianApp.mainVnode as VnodeWithDom;
    valyrianApp.mainVnode = new Vnode(valyrianApp.mainVnode.tag, valyrianApp.mainVnode.props, [valyrianApp.component]) as VnodeWithDom;
    valyrianApp.mainVnode.dom = oldVnode.dom;
    valyrianApp.mainVnode.isSVG = oldVnode.isSVG;
    patch(valyrianApp.mainVnode, oldVnode, valyrianApp);
    oldVnode = null;
    valyrianApp.isMounted = true;

    if (isNodeJs) {
      return valyrianApp.mainVnode.dom.innerHTML;
    }
  }
}

export function unmount(component?: ValyrianComponent | Vnode) {
  if (!component || !component[ValyrianSymbol]) {
    return;
  }

  let valyrianApp = component[ValyrianSymbol] as MountedValyrianApp;

  if (valyrianApp.isMounted) {
    cleanupVnodes(valyrianApp);
    let oldVnode: VnodeWithDom | null = valyrianApp.mainVnode as VnodeWithDom;
    valyrianApp.mainVnode = new Vnode(valyrianApp.mainVnode.tag, valyrianApp.mainVnode.props, []) as VnodeWithDom;
    valyrianApp.mainVnode.dom = oldVnode.dom;
    valyrianApp.mainVnode.isSVG = oldVnode.isSVG;
    patch(valyrianApp.mainVnode, oldVnode, valyrianApp);
    oldVnode = null;
    valyrianApp.isMounted = false;
  }
}

let emptyVnode = new Vnode("__empty__", {}, []);

function onremove(vnode: Vnode) {
  for (let i = 0; i < vnode.children.length; i++) {
    vnode.children[i].tag !== "#text" && onremove(vnode.children[i]);
  }

  vnode.props.onremove && vnode.props.onremove(vnode);
}

function sharedUpdateProperty(prop: string, value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom, valyrianApp?: MountedValyrianApp) {
  // It is a reserved prop
  if (reservedProps[prop]) {
    // If it is a directive name call the directive
    if (directives[prop]) {
      directives[prop](vnode.props[prop], vnode, oldVnode);
    }
    return;
  }

  // It is not a reserved prop so we add it to the dom
  if (typeof value === "function") {
    if (valyrianApp && prop in valyrianApp.eventListenerNames === false) {
      valyrianApp.eventListenerNames[prop] = true;
      valyrianApp.container.addEventListener(prop.slice(2), valyrianApp.eventListener);
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

export function updateProperty(name: string, value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom, valyrianApp?: MountedValyrianApp) {
  if (name in vnode.props === false) {
    vnode.props[name] = value;
  }

  sharedUpdateProperty(name, value, vnode, oldVnode, valyrianApp);
}

function updateProperties(vnode: VnodeWithDom, oldVnode?: VnodeWithDom, valyrianApp?: MountedValyrianApp) {
  for (let prop in vnode.props) {
    // We asume that we clean the props in some directive
    if (prop in vnode.props === false) {
      return;
    }

    sharedUpdateProperty(prop, vnode.props[prop], vnode, oldVnode, valyrianApp);
  }

  if (oldVnode) {
    for (let prop in oldVnode.props) {
      if (prop in vnode.props === false && typeof oldVnode.props[prop] !== "function" && prop in reservedProps === false) {
        if (prop in oldVnode.dom && vnode.isSVG === false) {
          oldVnode.dom[prop] = null;
        } else {
          oldVnode.dom.removeAttribute(prop);
        }
      }
    }
  }
}

function flatTree(newVnode: Vnode): void {
  let newTree = newVnode.children;
  for (let i = 0; i < newTree.length; i++) {
    let childVnode = newTree[i];
    if (childVnode instanceof Vnode) {
      if (childVnode.tag !== "#text") {
        if (childVnode.tag === "__component__") {
          let component = childVnode.component as ValyrianComponent;
          v.current.component = component;
          let result = ("view" in component ? component.view : component).call(component, childVnode.props, ...childVnode.children);

          newTree.splice(i--, 1, result);
          continue;
        }
        childVnode.isSVG = newVnode.isSVG || childVnode.tag === "svg";
      }
    } else if (childVnode === null || childVnode === undefined) {
      newTree.splice(i--, 1);
    } else if (Array.isArray(childVnode)) {
      newTree.splice(i--, 1, ...childVnode);
    } else {
      if (i > 0 && newTree[i - 1].tag === "#text") {
        newTree[i - 1].nodeValue += childVnode;
        newTree.splice(i--, 1);
      } else {
        newTree[i] = new Vnode("#text", {}, []);
        newTree[i].nodeValue = String(childVnode);
      }
    }
  }
}

function patchKeyedTree(
  newVnode: VnodeWithDom,
  newTree: (VnodeWithDom & { props: Props & { key: string } })[],
  oldTree: (VnodeWithDom & { props: Props & { key: string } })[],
  newTreeLength: number,
  oldTreeLength: number,
  valyrianApp?: MountedValyrianApp
) {
  let oldKeyedList = oldTree.reduce((acc, vnode, i) => {
    acc[vnode.props.key] = i;
    return acc;
  }, {} as { [key: string]: number });
  let newKeyedList = newTree.reduce((acc, vnode, i) => {
    acc[vnode.props.key] = i;
    return acc;
  }, {} as { [key: string]: number });

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
        updateProperties(childVnode, oldChildVnode, valyrianApp);
        if (valyrianApp && valyrianApp.isMounted) {
          childVnode.props.onupdate && childVnode.props.onupdate(childVnode, oldChildVnode);
        } else {
          childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
        }
      }
    } else {
      childVnode.dom = createDomElement(childVnode.tag, childVnode.isSVG);
      updateProperties(childVnode, undefined, valyrianApp);
      childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
    }

    if (newVnode.dom.childNodes[i] === undefined) {
      newVnode.dom.appendChild(childVnode.dom);
    } else if (newVnode.dom.childNodes[i] !== childVnode.dom) {
      oldTree[i] && newKeyedList[oldTree[i].props.key] === undefined && onremove(oldTree[i]);
      newVnode.dom.replaceChild(childVnode.dom, newVnode.dom.childNodes[i]);
    }

    shouldPatch && patch(childVnode, oldChildVnode, valyrianApp);
  }

  // For the rest of the children, we should remove them
  for (let i = newTreeLength; i < oldTreeLength; i++) {
    if (newKeyedList[oldTree[i].props.key] === undefined) {
      let oldChildVnode = oldTree[i];
      onremove(oldChildVnode);
      oldChildVnode.dom.parentNode && oldChildVnode.dom.parentNode.removeChild(oldChildVnode.dom);
    }
  }
}

// eslint-disable-next-line complexity
function patchNormalTree(
  newVnode: VnodeWithDom,
  newTree: (VnodeWithDom & { props: Props & { key: string } })[],
  oldTree: (VnodeWithDom & { props: Props & { key: string } })[],
  newTreeLength: number,
  oldTreeLength: number,
  valyrianApp?: MountedValyrianApp
) {
  // If new tree and old tree have more than one child, we should update the dom
  for (let i = 0; i < newTreeLength; i++) {
    let oldChildVnode = oldTree[i];
    let newChildVnode = newTree[i];

    // Old child does not exists
    if (!oldChildVnode) {
      // New child is a text node
      if (newChildVnode.tag === "#text") {
        newChildVnode.dom = document.createTextNode(newChildVnode.nodeValue as string) as unknown as DomElement;
        newVnode.dom.appendChild(newChildVnode.dom);
        continue;
      }

      // New child is a normal node
      newChildVnode.dom = createDomElement(newChildVnode.tag, newChildVnode.isSVG);
      updateProperties(newChildVnode, undefined, valyrianApp);
      newVnode.dom.appendChild(newChildVnode.dom);
      newChildVnode.props.oncreate && newChildVnode.props.oncreate(newChildVnode);
      patch(newChildVnode, undefined, valyrianApp);
      continue;
    }

    // Old child exists
    // New child is a text node
    if (newChildVnode.tag === "#text") {
      // Old child is a text node
      if (oldChildVnode.tag === "#text") {
        newChildVnode.dom = oldChildVnode.dom;
        // eslint-disable-next-line eqeqeq
        if (newChildVnode.dom.nodeValue != newChildVnode.nodeValue) {
          newChildVnode.dom.nodeValue = newChildVnode.nodeValue as string;
        }
        continue;
      }

      // Old child is a normal node
      newChildVnode.dom = document.createTextNode(newChildVnode.nodeValue as string) as unknown as DomElement;
      onremove(oldChildVnode);
      newVnode.dom.replaceChild(newChildVnode.dom, oldChildVnode.dom);

      continue;
    }

    // New child is a normal node
    // Old child is the same type as new child
    if (oldChildVnode.tag === newChildVnode.tag) {
      newChildVnode.dom = oldChildVnode.dom;
      // If we have a v-once directive or a shouldupdate method that returns false, we skip the update
      if (newChildVnode.props["v-once"] || (newChildVnode.props.shouldupdate && newChildVnode.props.shouldupdate(newChildVnode, oldChildVnode) === false)) {
        newChildVnode.children = oldChildVnode.children;
        continue;
      }

      // We update the dom element
      updateProperties(newChildVnode, oldChildVnode, valyrianApp);
      if (valyrianApp && valyrianApp.isMounted) {
        newChildVnode.props.onupdate && newChildVnode.props.onupdate(newChildVnode, oldChildVnode);
      } else {
        newChildVnode.props.oncreate && newChildVnode.props.oncreate(newChildVnode);
      }
      patch(newChildVnode, oldChildVnode, valyrianApp);

      continue;
    }

    // Old child is of a different type than new child
    newChildVnode.dom = createDomElement(newChildVnode.tag, newChildVnode.isSVG);
    updateProperties(newChildVnode, undefined, valyrianApp);
    if (oldChildVnode.tag !== "#text") {
      onremove(oldChildVnode);
    }
    newChildVnode.props.oncreate && newChildVnode.props.oncreate(newChildVnode);
    newVnode.dom.replaceChild(newChildVnode.dom, oldChildVnode.dom);
    patch(newChildVnode, undefined, valyrianApp);
  }

  // For the rest of the children, we should remove them
  for (let i = newTreeLength; i < oldTreeLength; i++) {
    let oldChildVnode = oldTree[i];
    if (oldChildVnode.tag !== "#text") {
      onremove(oldChildVnode);
    }
    oldChildVnode.dom.parentNode && oldChildVnode.dom.parentNode.removeChild(oldChildVnode.dom);
  }
}

// eslint-disable-next-line complexity
function patch(newVnode: VnodeWithDom, oldVnode: VnodeWithDom = emptyVnode as VnodeWithDom, valyrianApp?: MountedValyrianApp) {
  flatTree(newVnode);

  v.current.vnode = newVnode;
  v.current.oldVnode = oldVnode;

  let newTree = newVnode.children;
  let oldTree = oldVnode.children;
  let oldTreeLength = oldTree.length;
  let newTreeLength = newTree.length;

  // If new tree is empty, remove all old nodes
  if (newTreeLength === 0) {
    for (let i = 0; i < oldTreeLength; i++) {
      onremove(oldTree[i]);
    }

    newVnode.dom.textContent = "";
    return;
  }

  // If the tree is keyed list and is not first render and old tree is keyed list too
  if (oldTreeLength && "key" in newTree[0].props && "key" in oldTree[0].props) {
    patchKeyedTree(newVnode, newTree, oldTree, newTreeLength, oldTreeLength, valyrianApp);
    return;
  }

  patchNormalTree(newVnode, newTree, oldTree, newTreeLength, oldTreeLength, valyrianApp);
}

export function directive(name: string, directive: Directive) {
  let fullName = `v-${name}`;
  if (reservedProps[fullName]) {
    throw new Error(`Directive ${name} already exists`);
  }

  directives[fullName] = directive;
  reservedProps[fullName] = true;
}

export function plugin(plugin: Plugin) {
  if (!plugins.has(plugin)) {
    plugins.add(plugin);
  }
}

((isNodeJs ? global : window) as unknown as { v: v }).v = v;
