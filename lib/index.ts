/*** Vnode ***/

import {
  Children,
  Current,
  Directive,
  DomElement,
  IVnode,
  MountedValyrianApp,
  Props,
  Valyrian,
  ValyrianApp,
  ValyrianComponent,
  VnodeComponent,
  VnodeWithDom
} from "./interfaces";

export const Vnode = function Vnode(this: IVnode, tag: string, props: Props, children: Children) {
  this.props = props;
  this.children = children;
  this.tag = tag;
} as unknown as IVnode;

export function isVnode(component?: unknown): component is IVnode {
  return component instanceof Vnode;
}

export function isComponent(component?: unknown | ValyrianComponent): component is ValyrianComponent {
  return typeof component === "function" || (typeof component === "object" && component !== null && "view" in component);
}

export function isVnodeComponent(vnode?: unknown): vnode is VnodeComponent {
  return vnode instanceof Vnode && vnode.tag === "__component__";
}

/*** Util ***/

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

export const trust = (htmlString: string) => {
  let div = createDomElement("div");
  div.innerHTML = htmlString.trim();

  return [].map.call(div.childNodes, (item) => domToVnode(item)) as IVnode[];
};

/*** Mount ***/

const ValyrianSymbol = Symbol("Valyrian");

export function onCleanup(callback: Function) {
  if (v.current.app?.onCleanup.indexOf(callback) === -1) {
    v.current.app?.onCleanup.push(callback);
  }
}

export function onUnmount(callback: Function) {
  if (v.current.app?.onUnmount.indexOf(callback) === -1) {
    v.current.app?.onUnmount.push(callback);
  }
}

export function onMount(callback: Function) {
  if (v.current.app?.onMount.indexOf(callback) === -1) {
    v.current.app?.onMount.push(callback);
  }
}

export function onUpdate(callback: Function) {
  if (v.current.app?.onUpdate.indexOf(callback) === -1) {
    v.current.app?.onUpdate.push(callback);
  }
}

/*
  * Mounts a component to the DOM
  mount('#app', () => <div>Hello world</div>); // App is a Functional Component
  mount('#app', { view: () => <div>Hello world</div> }); // App is a POJO component with a view method
  mount('#app', classInstance); // App is a class instance with a view method
  mount('#app', <App><div>Hello world</div></App>); // App is a Vnode component (Vnode with tag __component__)
*/

export function mount(container: DomElement | string, component: ValyrianComponent | IVnode) {
  let appContainer = null;

  if (isNodeJs) {
    appContainer = typeof container === "string" ? createDomElement(container === "svg" ? "svg" : "div", container === "svg") : container;
  } else {
    appContainer = typeof container === "string" ? document.querySelectorAll(container)[0] : container;
  }

  if (!appContainer) {
    throw new Error("Container not found");
  }

  let vnodeComponent: VnodeComponent | IVnode;

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
      onCleanup: [],
      onMount: [],
      onUpdate: [],
      onUnmount: []
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
  }

  component[ValyrianSymbol].component = vnodeComponent;
  component[ValyrianSymbol].container = appContainer;
  component[ValyrianSymbol].mainVnode = domToVnode(appContainer);
  component[ValyrianSymbol].mainVnode.isSVG = component[ValyrianSymbol].tag === "svg";

  // update
  return update(component);
}

function callCleanup(valyrianApp: ValyrianApp) {
  for (let i = 0; i < valyrianApp.onCleanup.length; i++) {
    valyrianApp.onCleanup[i]();
  }
  valyrianApp.onCleanup = [];
}

function callUnmount(valyrianApp: ValyrianApp) {
  for (let i = 0; i < valyrianApp.onUnmount.length; i++) {
    valyrianApp.onUnmount[i]();
  }
  valyrianApp.onUnmount = [];
}

function callMount(valyrianApp: ValyrianApp) {
  for (let i = 0; i < valyrianApp.onMount.length; i++) {
    valyrianApp.onMount[i]();
  }
  valyrianApp.onMount = [];
}

function callUpdate(valyrianApp: ValyrianApp) {
  for (let i = 0; i < valyrianApp.onUpdate.length; i++) {
    valyrianApp.onUpdate[i]();
  }
  valyrianApp.onUpdate = [];
}

export function update(component?: ValyrianComponent | IVnode) {
  if (component && component[ValyrianSymbol]) {
    let valyrianApp = component[ValyrianSymbol];
    v.current.app = valyrianApp;
    valyrianApp.onCleanup.length && callCleanup(valyrianApp);
    let oldVnode: VnodeWithDom | null = valyrianApp.mainVnode as VnodeWithDom;
    valyrianApp.mainVnode = new Vnode(valyrianApp.mainVnode.tag, valyrianApp.mainVnode.props, [valyrianApp.component]) as VnodeWithDom;
    valyrianApp.mainVnode.dom = oldVnode.dom;
    valyrianApp.mainVnode.isSVG = oldVnode.isSVG;
    patch(valyrianApp.mainVnode, oldVnode, valyrianApp);
    oldVnode = null;
    if (valyrianApp.isMounted === false) {
      valyrianApp.onMount.length && callMount(valyrianApp);
      valyrianApp.isMounted = true;
    } else {
      valyrianApp.onUpdate.length && callUpdate(valyrianApp);
    }

    if (isNodeJs) {
      return valyrianApp.mainVnode.dom.innerHTML;
    }
  }
}

export function unmount(component?: ValyrianComponent | IVnode) {
  if (!component || !component[ValyrianSymbol]) {
    return;
  }

  let valyrianApp = component[ValyrianSymbol] as MountedValyrianApp;

  if (valyrianApp.isMounted) {
    valyrianApp.onCleanup.length && callCleanup(valyrianApp);
    valyrianApp.onUnmount.length && callUnmount(valyrianApp);
    let oldVnode: VnodeWithDom | null = valyrianApp.mainVnode as VnodeWithDom;
    valyrianApp.mainVnode = new Vnode(valyrianApp.mainVnode.tag, valyrianApp.mainVnode.props, []) as VnodeWithDom;
    valyrianApp.mainVnode.dom = oldVnode.dom;
    valyrianApp.mainVnode.isSVG = oldVnode.isSVG;
    patch(valyrianApp.mainVnode, oldVnode, valyrianApp);
    oldVnode = null;

    if (isNodeJs) {
      return valyrianApp.mainVnode.dom.innerHTML;
    }

    (valyrianApp as any) = null;
    Reflect.deleteProperty(component, ValyrianSymbol);
  }
}

let emptyVnode = new Vnode("__empty__", {}, []);

function onremove(vnode: IVnode) {
  for (let i = 0; i < vnode.children.length; i++) {
    vnode.children[i].tag !== "#text" && onremove(vnode.children[i]);
  }

  vnode.props.onremove && vnode.props.onremove(vnode);
}

function sharedUpdateProperty(prop: string, value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom) {
  // It is a reserved prop
  if (v.reservedProps[prop]) {
    // If it is a directive name call the directive
    if (v.directives[prop]) {
      v.directives[prop](vnode.props[prop], vnode, oldVnode);
    }
    return;
  }

  // It is not a reserved prop so we add it to the dom
  if (typeof value === "function") {
    let valyrianApp = v.current.app as MountedValyrianApp;
    if (prop in valyrianApp.eventListenerNames === false) {
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

export function setProperty(name: string, value: any, vnode: VnodeWithDom, oldVnode?: VnodeWithDom) {
  if (name in vnode.props === false) {
    vnode.props[name] = value;
  }

  sharedUpdateProperty(name, value, vnode, oldVnode);
}

function updateProperties(vnode: VnodeWithDom, oldVnode?: VnodeWithDom) {
  for (let prop in vnode.props) {
    // We asume that we clean the props in some directive
    if (prop in vnode.props === false) {
      return;
    }

    sharedUpdateProperty(prop, vnode.props[prop], vnode, oldVnode);
  }

  if (oldVnode) {
    for (let prop in oldVnode.props) {
      if (prop in vnode.props === false && typeof oldVnode.props[prop] !== "function" && prop in v.reservedProps === false) {
        if (prop in oldVnode.dom && vnode.isSVG === false) {
          oldVnode.dom[prop] = null;
        } else {
          oldVnode.dom.removeAttribute(prop);
        }
      }
    }
  }
}

function flatTree(newVnode: IVnode): void {
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
  valyrianApp: MountedValyrianApp
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
        updateProperties(childVnode, oldChildVnode);
        if (valyrianApp.isMounted) {
          childVnode.props.onupdate && childVnode.props.onupdate(childVnode, oldChildVnode);
        } else {
          childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
        }
      }
    } else {
      childVnode.dom = createDomElement(childVnode.tag, childVnode.isSVG);
      updateProperties(childVnode);
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
  valyrianApp: MountedValyrianApp
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
      updateProperties(newChildVnode);
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
      updateProperties(newChildVnode, oldChildVnode);
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
    updateProperties(newChildVnode);
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
function patch(newVnode: VnodeWithDom, oldVnode: VnodeWithDom = emptyVnode as VnodeWithDom, valyrianApp: MountedValyrianApp) {
  v.current.vnode = newVnode;
  v.current.oldVnode = oldVnode;

  flatTree(newVnode);

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

/*** Directives ***/

export function directive(name: string, directive: Directive) {
  let fullName = `v-${name}`;
  v.directives[fullName] = directive;
  v.reservedProps[fullName] = true;
}

function hideDirective(test: boolean): Directive {
  return (bool: boolean, vnode: IVnode, oldVnode?: IVnode) => {
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

const builtInDirectives = {
  "v-if": hideDirective(false),
  "v-unless": hideDirective(true),
  "v-for": (set: unknown[], vnode: VnodeWithDom) => {
    vnode.children = set.map(vnode.children[0] as (value: unknown) => Function);
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
    if (vnode.name === "input") {
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
          setProperty("checked", value, vnode, oldVnode);
          break;
        }
        case "radio": {
          setProperty("checked", model[property] === vnode.dom.value, vnode, oldVnode);
          break;
        }
        default: {
          setProperty("value", model[property], vnode, oldVnode);
        }
      }
    } else if (vnode.name === "select") {
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
        vnode.children.forEach((child) => {
          if (child.name === "option") {
            let value = "value" in child.props ? child.props.value : child.children.join("").trim();
            child.props.selected = model[property].indexOf(value) !== -1;
          }
        });
      } else {
        vnode.children.forEach((child) => {
          if (child.name === "option") {
            let value = "value" in child.props ? child.props.value : child.children.join("").trim();
            child.props.selected = value === model[property];
          }
        });
      }
    } else if (vnode.name === "textarea") {
      event = event || "oninput";
      vnode.children = [model[property]];
    }

    if (!vnode.props[event]) {
      if (!handler) {
        handler = (e: Event) => (model[property] = (e.target as DomElement & Record<string, any>).value);
      }
      setProperty(event, handler, vnode, oldVnode);
    }
  }
};

/*** Hyperscript ***/

export const v: Valyrian = function v(tagOrComponent: string | ValyrianComponent, props: Props, ...children: Children): IVnode | VnodeComponent {
  if (typeof tagOrComponent === "string") {
    return new Vnode(tagOrComponent, props || {}, children);
  }

  const vnode = new Vnode("__component__", props || {}, children);
  vnode.component = tagOrComponent;
  return vnode as VnodeComponent;
};

v.fragment = (props: Props, ...children: Children): Children => {
  return children;
};

v.current = {} as Current;

v.directives = { ...builtInDirectives };

v.reservedProps = {
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

((isNodeJs ? global : window) as unknown as { v: Valyrian }).v = v as Valyrian;
