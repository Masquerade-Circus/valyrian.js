/* eslint-disable complexity */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */

// version 5.0.17

type VnodeOrUnknown = VnodeComponent | Vnode | TextVnode | any;

type DomAttribute = { nodeName: string; nodeValue: string };

type DomElement = (HTMLElement | SVGElement) & Record<string, any>;

type Props = {
  key?: string | number;
  state?: string;
  oncreate?: { (vnode: Vnode): never };
  onupdate?: { (vnode: Vnode, oldVnode: Vnode | TextVnode): never };
  onremove?: { (oldVnode: Vnode): never };
  shouldupdate?: { (vnode: Vnode, oldVnode: Vnode | TextVnode): undefined | boolean };
} & Record<string, any>;

type Component = (props?: Record<string, any> | null, children?: VnodeOrUnknown) => VnodeOrUnknown | VnodeOrUnknown[];

type ValyrianComponent =
  | Component
  | (Record<string, any> & {
      view: Component;
    });

type Current = { parentVnode?: Vnode; oldParentVnode?: Vnode; component?: VnodeComponent };

interface Plugin {
  (v: Valyrian, options?: Record<string, any>): never;
}

interface Directive {
  (value: any, vnode: Vnode, oldVnode?: Vnode | TextVnode): void | boolean;
}

interface ValyrianEventHandler {
  (a: Event, dom: DomElement): void;
}

interface Vnode {
  name: string;
  props: Props;
  children: VnodeOrUnknown[];
  dom?: DomElement;
  isSVG?: boolean;
  processed?: boolean;
  [key: string]: any;
}

class Vnode implements Vnode {
  name: string;
  props: Props;
  children: VnodeOrUnknown[];
  dom?: DomElement;
  isSVG?: boolean;
  processed?: boolean;

  constructor(name: string, props: Props, children: VnodeOrUnknown) {
    this.props = props;
    this.children = children;
    this.name = name;
  }
}

interface TextVnode {
  dom?: Text;
  nodeValue: string;
}

class TextVnode implements TextVnode {
  dom?: Text;
  nodeValue: string;

  constructor(nodeValue: string) {
    this.nodeValue = nodeValue;
  }
}

interface VnodeComponent {
  component: ValyrianComponent;
  props: Props;
  children: VnodeOrUnknown[];
}

class VnodeComponent implements VnodeComponent {
  component: ValyrianComponent;
  props: Props;
  children: VnodeOrUnknown[];

  constructor(component: ValyrianComponent, props: Props, children: VnodeOrUnknown[]) {
    this.props = props;
    this.children = children;
    this.component = component;
  }
}

interface Valyrian {
  (tagOrComponent: string | ValyrianComponent, props?: Props | null, children?: VnodeOrUnknown): Vnode | VnodeComponent;
  fragment: (props: Props, children: VnodeOrUnknown[]) => VnodeOrUnknown[];
  isMounted: boolean;
  isNode: boolean;
  reservedWords: string[];
  current: Current;
  trust: (htmlString: string) => Vnode[];
  use: (plugin: Plugin, options: Record<string, any>) => void;
  updateProperty: (name: string, newVnode: Vnode & { dom: DomElement }, oldNode: Vnode & { dom: DomElement }) => void;
  update: (props?: Props | null, ...children: VnodeOrUnknown) => string | void;
  mount: (
    container: string | DomElement,
    component: ValyrianComponent,
    props?: Props | null,
    ...children: VnodeOrUnknown[]
  ) => string | void;
  unmount: () => string | boolean | void;
  directive: (directive: string, handler: Directive) => void;
  newInstance: () => Valyrian;
  [x: string]: any;
}

const isNode = typeof window === "undefined" || typeof global !== "undefined";

// Create Node element
function createElement(tagName: string, isSVG: boolean = false): DomElement {
  return isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tagName) : document.createElement(tagName);
}

// Transforms a DOM node to a VNode
function domToVnode(dom: DomElement): Vnode {
  const props: Props = {};
  [].forEach.call(dom.attributes, (prop: Attr) => (props[prop.nodeName] = prop.nodeValue));

  const vnode: Vnode = new Vnode(dom.nodeName.toLowerCase(), props, []);
  vnode.dom = dom;

  for (let i = 0, l = dom.childNodes.length; i < l; i++) {
    if (dom.childNodes[i].nodeType === 1) {
      vnode.children.push(domToVnode(dom.childNodes[i] as DomElement));
    } else if (dom.childNodes[i].nodeType === 3) {
      const textVnode = new TextVnode(dom.childNodes[i].nodeValue || "");
      textVnode.dom = dom.childNodes[i] as unknown as Text;
      vnode.children.push(textVnode);
    }
  }
  return vnode;
}

const trust = (htmlString: string) => {
  const div = createElement("div");
  div.innerHTML = htmlString.trim();

  return [].map.call(div.childNodes, (item) => domToVnode(item)) as Vnode[];
};

// eslint-disable-next-line max-lines-per-function
function valyrian(): Valyrian {
  const v: Valyrian = (tagOrComponent, props, ...children) => {
    if (typeof tagOrComponent === "string") {
      return new Vnode(tagOrComponent, props || {}, children);
    } else {
      return new VnodeComponent(tagOrComponent, props || {}, children);
    }
  };

  v.fragment = (props: Props, vnodes: VnodeOrUnknown[]) => {
    return vnodes;
  };

  v.isMounted = false;
  v.isNode = isNode;
  const reservedWords = ["key", "state", "v-once", "oncreate", "onupdate", "onremove", "shouldupdate"];
  v.reservedWords = reservedWords;
  v.trust = trust;

  const current: Current = {
    parentVnode: undefined,
    oldParentVnode: undefined,
    component: undefined
  };
  v.current = current;

  const plugins = new Map();

  v.use = (plugin: Plugin, options: Record<string, any> = {}) =>
    !plugins.has(plugin) && plugins.set(plugin, true) && plugin(v as Valyrian, options);

  let vnodesToCleanup: Vnode[] = [];

  v.onCleanup = (callback: FunctionConstructor) => {
    const parentVnode = v.current.parentVnode as Vnode;
    if (!parentVnode.onCleanup) {
      parentVnode.onCleanup = [] as FunctionConstructor[];
    }

    parentVnode.onCleanup.push(callback);

    if (vnodesToCleanup.indexOf(parentVnode) === -1) {
      vnodesToCleanup.push(parentVnode);
    }
  };

  const cleanupVnodes = () => {
    for (let l = vnodesToCleanup.length; l--; ) {
      for (const callback of vnodesToCleanup[l].onCleanup as FunctionConstructor[]) {
        callback();
      }
    }
    vnodesToCleanup = [];
  };

  let mainContainer: DomElement | null = null;
  const emptyComponent: ValyrianComponent = () => "";
  let mountedComponent: ValyrianComponent = emptyComponent;

  const attachedListeners: string[] = [];
  function eventListener(e: Event) {
    let dom = e.target as DomElement;
    const name = `v-on${e.type}`;
    while (dom) {
      if (dom[name]) {
        (dom[name] as ValyrianEventHandler)(e, dom);
        if (!e.defaultPrevented) {
          v.update();
        }
        return;
      }
      dom = dom.parentNode as DomElement;
    }
  }

  function updateProperty(prop: string, newVnode: Vnode & { dom: DomElement }, oldVnode?: Vnode): void | boolean {
    if (reservedWords.indexOf(prop) !== -1) {
      if (prop in directives) {
        return directives[prop](newVnode.props[prop], newVnode, oldVnode);
      }
    } else if (typeof newVnode.props[prop] === "function") {
      if (attachedListeners.indexOf(prop) === -1) {
        (mainContainer as DomElement).addEventListener(prop.slice(2), eventListener);
        attachedListeners.push(prop);
      }
      newVnode.dom[`v-${prop}`] = newVnode.props[prop];
    } else if (prop in newVnode.dom && !newVnode.isSVG) {
      // eslint-disable-next-line eqeqeq
      if (newVnode.dom[prop] != newVnode.props[prop]) {
        newVnode.dom[prop] = newVnode.props[prop];
      }
    } else if (oldVnode === undefined || newVnode.props[prop] !== oldVnode.props[prop]) {
      if (newVnode.props[prop] === false) {
        newVnode.dom.removeAttribute(prop);
      } else {
        newVnode.dom.setAttribute(prop, newVnode.props[prop]);
      }
    }
  }
  v.updateProperty = updateProperty;

  // Update a Vnode.dom HTMLElement with new Vnode props that are different from old Vnode props
  function updateProperties(newVnode: Vnode & { dom: DomElement }, oldVnode?: Vnode): void {
    for (const prop in newVnode.props) {
      if (updateProperty(prop, newVnode, oldVnode) === false) {
        return;
      }
    }
  }

  function removeProperties(newVnode: Vnode & { dom: DomElement }, oldVnode: Vnode) {
    for (const name in oldVnode.props) {
      if (
        name in newVnode.props === false &&
        typeof oldVnode.props[name] !== "function" &&
        reservedWords.indexOf(name) === -1
      ) {
        if (name in newVnode.dom && newVnode.isSVG === false) {
          newVnode.dom[name] = null;
        } else {
          newVnode.dom.removeAttribute(name);
        }
      }
    }
  }

  const callRemove = (vnode: Vnode) => {
    for (let i = 0, l = vnode.children.length; i < l; i++) {
      vnode.children[i] instanceof Vnode && callRemove(vnode.children[i]);
    }

    vnode.props.onremove && vnode.props.onremove(vnode);
  };
  // Patch a DOM node with a new VNode tree
  function patch(newParentVnode: Vnode & { dom: DomElement }, oldParentVnode?: Vnode & { dom: DomElement }): void {
    const oldTree = oldParentVnode?.children || [];
    const newTree = newParentVnode.children;
    const oldTreeLength = oldTree.length;

    current.parentVnode = newParentVnode;
    current.oldParentVnode = oldParentVnode;

    // Flat newTree
    for (let i = 0; i < newTree.length; i++) {
      const childVnode = newTree[i];

      if (childVnode instanceof Vnode) {
        childVnode.isSVG = newParentVnode.isSVG || childVnode.name === "svg";
      } else if (childVnode === null || childVnode === undefined) {
        newTree.splice(i--, 1);
      } else if (Array.isArray(childVnode)) {
        newTree.splice(i--, 1, ...childVnode);
      } else if (childVnode instanceof VnodeComponent) {
        v.current.component = childVnode;
        newTree.splice(
          i--,
          1,
          ...[
            "view" in childVnode.component
              ? childVnode.component.view.call(childVnode.component, childVnode.props, childVnode.children)
              : (childVnode.component as Component).call(childVnode.component, childVnode.props, childVnode.children)
          ]
        );
      } else {
        if (i > 0 && newTree[i - 1].nodeValue) {
          newTree[i - 1].nodeValue += childVnode;
          newTree.splice(i--, 1);
        } else if (childVnode instanceof TextVnode === false) {
          newTree[i] = new TextVnode(String(childVnode));
        }
      }
    }

    const newTreeLength = newTree.length;

    // if newTree is empty, remove it
    if (newTreeLength === 0) {
      if (oldTreeLength > 0) {
        for (let i = oldTreeLength; i--; ) {
          oldTree[i] instanceof Vnode && callRemove(oldTree[i]);
        }
        // Fast node remove by setting textContent
        newParentVnode.dom.textContent = "";
      }
      // If the tree is keyed list and is not first render
    } else if (oldTreeLength && newTree[0] instanceof Vnode && "key" in newTree[0].props && "key" in oldTree[0].props) {
      // 1. Mutate the old key list to match the new key list
      let oldKeyedList;

      // if the oldTree does not have a keyed list fast remove all nodes
      if (oldTree[0] instanceof Vnode === false || "key" in oldTree[0].props === false) {
        for (let i = oldTreeLength; i--; ) {
          oldTree[i] instanceof Vnode && callRemove(oldTree[i]);
        }
        // Fast node remove by setting textContent
        newParentVnode.dom.textContent = "";
        oldKeyedList = [];
      } else {
        oldKeyedList = oldTree.map((vnode) => vnode.props.key);
      }

      // 2. Obtain the max length of both lists
      const newKeyedList = newTree.map((vnode) => vnode.props.key);
      const maxListLength = Math.max(newTreeLength, oldKeyedList.length);

      // 3. Cycle over all the elements of the list until the max length
      for (let i = 0; i < maxListLength; i++) {
        if (i < newTreeLength) {
          const childVnode = newTree[i];
          const oldChildVnode =
            oldKeyedList[i] === newKeyedList[i] ? oldTree[i] : oldTree[oldKeyedList.indexOf(childVnode.props.key)];
          let shouldPatch = true;

          if (oldChildVnode) {
            childVnode.dom = oldChildVnode.dom;
            oldChildVnode.processed = true;
            if (
              "v-once" in childVnode.props ||
              (childVnode.props.shouldupdate && childVnode.props.shouldupdate(childVnode, oldChildVnode) === false)
            ) {
              // skip this patch
              childVnode.children = oldChildVnode.children;
              shouldPatch = false;
            } else {
              removeProperties(childVnode as Vnode & { dom: DomElement }, oldChildVnode);
              updateProperties(childVnode as Vnode & { dom: DomElement }, oldChildVnode);
              if (v.isMounted) {
                childVnode.props.onupdate && childVnode.props.onupdate(childVnode, oldChildVnode);
              } else {
                childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
              }
            }
          } else {
            childVnode.dom = createElement(childVnode.name, childVnode.isSVG);
            updateProperties(childVnode as Vnode & { dom: DomElement });
            childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
          }

          if (newParentVnode.dom.childNodes[i] === undefined) {
            newParentVnode.dom.appendChild(childVnode.dom);
          } else if (newParentVnode.dom.childNodes[i] !== childVnode.dom) {
            oldTree[i] instanceof Vnode &&
              !oldTree[i].processed &&
              newKeyedList.indexOf(oldTree[i].props.key) === -1 &&
              callRemove(oldTree[i]);
            newParentVnode.dom.replaceChild(childVnode.dom, newParentVnode.dom.childNodes[i]);
          }

          shouldPatch && patch(childVnode as Vnode & { dom: DomElement }, oldChildVnode);
        } else {
          if (!oldTree[i].processed) {
            oldTree[i] instanceof Vnode && callRemove(oldTree[i]);
            oldTree[i].dom.parentNode && newParentVnode.dom.removeChild(oldTree[i].dom);
          }
        }
      }
    } else {
      for (let i = 0; i < newTreeLength; i++) {
        const childVnode = newTree[i];
        const oldChildVnode = oldTree[i];

        // if oldChildVnode is undefined, it's a new node, append it
        if (oldChildVnode === undefined) {
          if (childVnode instanceof Vnode) {
            childVnode.dom = createElement(childVnode.name, childVnode.isSVG);
            updateProperties(childVnode as Vnode & { dom: DomElement });
            childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
            patch(childVnode as Vnode & { dom: DomElement });
          } else {
            childVnode.dom = document.createTextNode(childVnode.nodeValue);
          }
          newParentVnode.dom.appendChild(childVnode.dom);
        } else {
          // if childVnode is Vnode, replace it with its DOM node
          if (childVnode instanceof Vnode) {
            if (childVnode.name === oldChildVnode.name) {
              childVnode.dom = oldChildVnode.dom;

              if (
                "v-once" in childVnode.props ||
                (childVnode.props.shouldupdate && childVnode.props.shouldupdate(childVnode, oldChildVnode) === false)
              ) {
                // skip this patch
                childVnode.children = oldChildVnode.children;
                continue;
              }

              removeProperties(childVnode as Vnode & { dom: DomElement }, oldChildVnode);
              updateProperties(childVnode as Vnode & { dom: DomElement }, oldChildVnode);
              if (v.isMounted) {
                childVnode.props.onupdate && childVnode.props.onupdate(childVnode, oldChildVnode);
              } else {
                childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
              }
              patch(childVnode as Vnode & { dom: DomElement }, oldChildVnode);
            } else {
              childVnode.dom = createElement(childVnode.name, childVnode.isSVG);
              updateProperties(childVnode as Vnode & { dom: DomElement });
              childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
              oldChildVnode instanceof Vnode && callRemove(oldChildVnode);
              newParentVnode.dom.replaceChild(childVnode.dom, oldChildVnode.dom);
              patch(childVnode as Vnode & { dom: DomElement });
            }
          } else {
            if (oldChildVnode instanceof Vnode) {
              childVnode.dom = document.createTextNode(childVnode.nodeValue);
              callRemove(oldChildVnode);
              newParentVnode.dom.replaceChild(childVnode.dom, oldChildVnode.dom as DomElement);
            } else {
              childVnode.dom = oldChildVnode.dom;
              // eslint-disable-next-line eqeqeq
              if (childVnode.nodeValue != childVnode.dom.nodeValue) {
                childVnode.dom.nodeValue = childVnode.nodeValue;
              }
            }
          }
        }
      }

      // For remaining old children: remove from DOM, garbage collect
      for (let i = oldTreeLength - 1; i >= newTreeLength; --i) {
        oldTree[i] instanceof Vnode && callRemove(oldTree[i]);
        oldTree[i].dom.parentNode && newParentVnode.dom.removeChild(oldTree[i].dom);
      }
    }

    newParentVnode.children = newTree;
  }

  let mainVnode: Vnode | null = null;
  let oldMainVnode: Vnode | null = null;

  v.unmount = () => {
    mountedComponent = emptyComponent;
    const result = v.update();
    v.isMounted = false;
    mainContainer = null;
    return result;
  };

  v.update = (props, ...children) => {
    if (mainVnode) {
      cleanupVnodes();
      oldMainVnode = mainVnode;
      mainVnode = new Vnode(mainVnode.name, mainVnode.props, [v(mountedComponent, props, ...children)]);
      mainVnode.dom = oldMainVnode.dom;
      mainVnode.isSVG = oldMainVnode.isSVG;
      patch(mainVnode as Vnode & { dom: Node }, oldMainVnode as Vnode & { dom: Node });
      v.isMounted = true;
      if (v.isNode) {
        return (mainVnode.dom as HTMLElement).innerHTML;
      }
    }
  };

  v.mount = (container, component, props, ...children) => {
    if (v.isMounted) {
      v.unmount();
    }

    if (isNode) {
      mainContainer = typeof container === "string" ? createElement(container, container === "svg") : container;
    } else {
      mainContainer =
        typeof container === "string" ? (document.querySelectorAll(container)[0] as DomElement) : container;
    }

    if (mainContainer !== null) {
      mainVnode = domToVnode(mainContainer);
      mainVnode.isSVG = mainVnode.name === "svg";
      oldMainVnode = mainVnode;
      mountedComponent = component;
    }

    return v.update(props, ...children);
  };

  const directives: Record<string, Directive> = {};

  v.directive = (name: string, directive: Directive) => {
    const fullName = `v-${name}`;
    if (reservedWords.indexOf(fullName) === -1) {
      reservedWords.push(fullName);
      directives[fullName] = directive;
    }
  };

  const hideDirective = (test: boolean) => (bool: boolean, vnode: Vnode, oldnode?: Vnode | TextVnode) => {
    const value = test ? bool : !bool;
    if (value) {
      const newdom = document.createTextNode("");
      if (oldnode && oldnode.dom && oldnode.dom.parentNode) {
        oldnode instanceof Vnode && callRemove(oldnode);
        oldnode.dom.parentNode.replaceChild(newdom, oldnode.dom);
      }
      vnode.name = "#text";
      vnode.children = [];
      vnode.props = {};
      vnode.dom = newdom as unknown as DomElement;
      return false;
    }
  };

  v.directive("if", hideDirective(false));
  v.directive("unless", hideDirective(true));
  v.directive("for", (set: unknown[], vnode: Vnode) => {
    vnode.children = set.map(vnode.children[0] as (value: unknown) => Function);
  });
  v.directive("show", (bool: boolean, vnode: Vnode) => {
    (vnode.dom as { style: { display: string } }).style.display = bool ? "" : "none";
  });
  v.directive("class", (classes: { [x: string]: boolean }, vnode: Vnode) => {
    for (const name in classes) {
      (vnode.dom as DomElement).classList.toggle(name, classes[name]);
    }
  });
  v.directive("html", (html: string, vnode: Vnode) => {
    vnode.children = [trust(html)];
  });

  v.newInstance = valyrian;

  return v;
}

export const v = valyrian();
