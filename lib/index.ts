/* eslint-disable complexity */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */

type VnodeOrUnknown = VnodeComponent | Vnode | TextVnode | any;

type DomAttribute = { nodeName: string; nodeValue: string };

type DomElement = (HTMLElement | SVGElement) & Record<string, any>;

type Props = {
  key?: string | number;
  data?: string;
  oncreate?: { (vnode: Vnode): never };
  onupdate?: { (vnode: Vnode, oldVnode: Vnode | TextVnode): never };
  onremove?: { (oldVnode: Vnode): never };
  onbeforeupdate?: { (vnode: Vnode, oldVnode: Vnode | TextVnode): undefined | boolean };
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

interface Vnode {
  name: string;
  props: Props;
  children: VnodeOrUnknown[];
  dom?: DomElement;
  onCleanup?: FunctionConstructor[];
  isSVG?: boolean;
  processed?: boolean;
}

class Vnode implements Vnode {
  name: string;
  props: Props;
  children: VnodeOrUnknown[];
  dom?: DomElement;
  onCleanup?: FunctionConstructor[];
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
  isMounted: boolean;
  isNode: boolean;
  reservedWords: string[];
  current: Current;
  trust: (htmlString: string) => Vnode[];
  usePlugin: (plugin: Plugin, options: Record<string, any>) => void;
  onCleanup: (callback: typeof Function) => void;
  updateProperty: (name: string, newVnode: Vnode & { dom: DomElement }, oldNode: Vnode & { dom: DomElement }) => void;
  update: (props?: Props | null, ...children: VnodeOrUnknown) => string | void;
  mount: (container: string | DomElement, component: ValyrianComponent, props?: Props | null, ...children: VnodeOrUnknown[]) => string | void;
  unMount: () => string | boolean | void;
  directive: (directive: string, handler: Directive) => void;
  newInstance: () => Valyrian;
  [x: string]: any;
}

let isNode = typeof window === "undefined" || typeof global !== "undefined";

// Create Node element
function createElement(tagName: string, isSVG: boolean = false): DomElement {
  return isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tagName) : document.createElement(tagName);
}

// Transforms a DOM node to a VNode
function domToVnode(dom: DomElement): Vnode & { dom: DomElement } {
  const el = dom;
  const nodeName = el.nodeName.toLowerCase();
  const props: Props = {};
  const children: VnodeOrUnknown[] = [];
  let i: number;
  let childNode;
  let attr: Attr;

  // attributes
  for (i = 0; i < el.attributes.length; i++) {
    attr = el.attributes[i];
    props[attr.nodeName] = attr.nodeValue;
  }

  // children
  for (i = 0; i < el.childNodes.length; i++) {
    childNode = el.childNodes[i];
    if (childNode.nodeType === 1) {
      children.push(domToVnode(childNode as DomElement));
    } else if (childNode.nodeType === 3) {
      let textVnode = new TextVnode(childNode.nodeValue || "");
      textVnode.dom = childNode as Text;
      children.push(textVnode);
    }
  }

  let newNode = new Vnode(nodeName, props, children);
  newNode.dom = dom;
  return newNode as Vnode & { dom: DomElement };
}

const trust = (htmlString: string) => {
  let div = createElement("div");
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

  v.isMounted = false;
  v.isNode = isNode;
  v.reservedWords = ["key", "data", "v-once", "oncreate", "onupdate", "onremove", "onbeforeupdate"];
  v.trust = trust;

  const current: Current = {
    parentVnode: undefined,
    oldParentVnode: undefined,
    component: undefined
  };
  v.current = current;

  const plugins = new Map();

  v.usePlugin = (plugin: Plugin, options: Record<string, any> = {}) => !plugins.has(plugin) && plugins.set(plugin, true) && plugin(v as Valyrian, options);

  let vnodesToCleanup: Vnode[] = [];

  v.onCleanup = (callback: FunctionConstructor) => {
    let parentVnode = v.current.parentVnode as Vnode;
    if (!parentVnode.onCleanup) {
      parentVnode.onCleanup = [] as FunctionConstructor[];
    }

    parentVnode.onCleanup.push(callback);

    if (vnodesToCleanup.indexOf(parentVnode) === -1) {
      vnodesToCleanup.push(parentVnode);
    }
  };

  let cleanupVnodes = () => {
    for (let l = vnodesToCleanup.length; l--; ) {
      for (let callback of vnodesToCleanup[l].onCleanup as FunctionConstructor[]) {
        callback();
      }
    }
    vnodesToCleanup = [];
  };

  let mainContainer: DomElement | null = null;
  let emptyComponent: ValyrianComponent = () => "";
  let mountedComponent: ValyrianComponent = emptyComponent;

  const attachedListeners: string[] = [];
  function eventListener(e: Event) {
    let dom = e.target as DomElement;
    let name = `v-on${e.type}`;
    while (dom) {
      if (dom[name]) {
        (dom[name] as (a: Event, dom: DomElement) => void)(e, dom);
        if (!e.defaultPrevented) {
          v.update();
        }
        return;
      }
      dom = dom.parentNode as DomElement;
    }
  }

  function updateProperty(prop: string, newVnode: Vnode & { dom: DomElement }, oldVnode?: Vnode): void | boolean {
    if (v.reservedWords.indexOf(prop) !== -1) {
      if (directives[prop]) {
        return directives[prop](newVnode.props[prop], newVnode, oldVnode);
      }
    } else if (typeof newVnode.props[prop] === "function" && newVnode.dom[`v-${prop}`] === undefined) {
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
    for (let prop in newVnode.props) {
      if (updateProperty(prop, newVnode, oldVnode) === false) {
        return;
      }
    }
  }

  function removeProperties(newVnode: Vnode & { dom: DomElement }, oldVnode: Vnode) {
    for (let name in oldVnode.props) {
      if (v.reservedWords.indexOf(name) === -1 && name in newVnode.props === false && typeof oldVnode.props[name] !== "function") {
        if (name in newVnode.dom) {
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

  let moveDom = (dom: DomElement, $parent: DomElement, oldDom: DomElement) => {
    oldDom ? $parent.replaceChild(dom, oldDom) : $parent.appendChild(dom);
  };

  let updateKeyedNode = ($parent: DomElement, newVnode: Vnode & { dom: DomElement }, newIndex: number, compareNode?: Vnode & { dom: DomElement }) => {
    let oldDom = $parent.childNodes[newIndex];

    if (compareNode === undefined) {
      // Moved or updated
      newVnode.dom = createElement(newVnode.name, newVnode.isSVG);
      updateProperties(newVnode);
      newVnode.dom !== oldDom && moveDom(newVnode.dom, $parent, oldDom as DomElement);
      newVnode.props.oncreate && newVnode.props.oncreate(newVnode);
      patch(newVnode);
    } else {
      newVnode.dom = compareNode.dom;
      if ("v-once" in newVnode.props || (newVnode.props.onbeforeupdate && newVnode.props.onbeforeupdate(newVnode, compareNode) === false)) {
        newVnode.children = compareNode.children;
        newVnode.dom !== oldDom && moveDom(newVnode.dom as DomElement, $parent, oldDom as DomElement);
      } else {
        removeProperties(newVnode, compareNode);
        updateProperties(newVnode, compareNode);
        newVnode.dom !== oldDom && moveDom(newVnode.dom as DomElement, $parent, oldDom as DomElement);
        newVnode.props.onupdate && newVnode.props.onupdate(newVnode, compareNode);
        patch(newVnode, compareNode);
      }
    }
  };

  // Patch a DOM node with a new VNode tree
  function patch(newParentVnode: Vnode & { dom: DomElement }, oldParentVnode?: Vnode & { dom: DomElement }): void {
    let oldTree = oldParentVnode?.children || [];
    let newTree = newParentVnode.children;
    let oldTreeLength = oldTree.length;

    current.parentVnode = newParentVnode;
    current.oldParentVnode = oldParentVnode;

    // Flat newTree
    for (let i = 0; i < newTree.length; i++) {
      let childVnode = newTree[i];

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
          newTree[i] = new TextVnode(childVnode);
        }
      }
    }

    let newTreeLength = newTree.length;

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
    } else if (oldTreeLength && newTree[0] instanceof Vnode && "key" in newTree[0].props) {
      let oldKeys = oldTree[0] instanceof Vnode && "key" in oldTree[0].props ? oldTree.map((vnode) => vnode.props.key) : [];
      let newKeys = newTree.map((vnode) => vnode.props.key);

      for (let i = 0, l = newKeys.length; i < l; i++) {
        let key = newKeys[i];
        let newNode = newTree[i];

        // Updated: Same key
        if (key === oldKeys[i]) {
          oldTree[i].processed = true;
          updateKeyedNode(newParentVnode.dom, newNode, i, oldTree[i]);
        } else {
          let oldIndex = oldKeys.indexOf(key);
          let newIndex = i >= oldKeys.length ? -1 : i;

          // Moved: Key exists in old keys
          if (oldIndex !== -1) {
            oldTree[oldIndex].processed = true;
            updateKeyedNode(newParentVnode.dom, newNode, newIndex, oldTree[oldIndex]);
            // Added: Key does not exists in old keys
          } else {
            updateKeyedNode(newParentVnode.dom, newNode, newIndex);
          }
        }
      }

      // Delete unprocessed old keys
      for (let i = oldTreeLength; i--; ) {
        if (!oldTree[i].processed) {
          oldTree[i] instanceof Vnode && callRemove(oldTree[i]);
          newParentVnode.dom === oldTree[i].dom.parentNode && newParentVnode.dom.removeChild(oldTree[i].dom);
        }
      }
    } else {
      for (let i = 0; i < newTreeLength; i++) {
        let childVnode = newTree[i];
        let oldChildVnode = oldTree[i];

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

              if ("v-once" in childVnode.props || (childVnode.props.onbeforeupdate && childVnode.props.onbeforeupdate(childVnode, oldChildVnode) === false)) {
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
              patch(childVnode as Vnode & { dom: DomElement }, oldChildVnode);
            }
          } else {
            if (oldChildVnode instanceof Vnode) {
              childVnode.dom = document.createTextNode(childVnode.nodeValue);
              callRemove(oldChildVnode);
              newParentVnode.dom.replaceChild(childVnode.dom, oldChildVnode.dom as DomElement);
            } else {
              childVnode.dom = oldChildVnode.dom;
              // eslint-disable-next-line eqeqeq
              if (childVnode.nodeValue != oldChildVnode.nodeValue) {
                childVnode.dom.nodeValue = childVnode.nodeValue;
              }
            }
          }
        }
      }

      // For remaining old children: remove from DOM, garbage collect
      for (let i = oldTreeLength - 1; i >= newTreeLength; --i) {
        oldTree[i] instanceof Vnode && callRemove(oldTree[i]);
        newParentVnode.dom === oldTree[i].dom.parentNode && newParentVnode.dom.removeChild(oldTree[i].dom);
      }
    }

    newParentVnode.children = newTree;
  }

  let mainVnode: Vnode | null = null;
  let oldMainVnode: Vnode | null = null;

  v.unMount = () => {
    mountedComponent = emptyComponent;
    let result = v.update();
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
      v.unMount();
    }

    if (isNode) {
      mainContainer = typeof container === "string" ? createElement(container, container === "svg") : container;
    } else {
      mainContainer = typeof container === "string" ? document.querySelector(container) : container;
    }

    if (mainContainer !== null) {
      mainVnode = domToVnode(mainContainer);
      mainVnode.isSVG = mainVnode.name === "svg";
      oldMainVnode = mainVnode;
      mountedComponent = component;
    }

    return v.update(props, ...children);
  };

  let directives: Record<string, Directive> = {};

  v.directive = (name: string, directive: Directive) => {
    let fullName = `v-${name}`;
    if (v.reservedWords.indexOf(fullName) === -1) {
      v.reservedWords.push(fullName);
      directives[fullName] = directive;
    }
  };

  let hideDirective = (test: boolean) => (bool: boolean, vnode: Vnode, oldnode?: Vnode | TextVnode) => {
    let value = test ? bool : !bool;
    if (value) {
      let newdom = document.createTextNode("");
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
    for (let name in classes) {
      (vnode.dom as DomElement).classList.toggle(name, classes[name]);
    }
  });
  v.directive("html", (html: string, vnode: Vnode) => {
    vnode.children = [trust(html)];
  });

  v.newInstance = valyrian;

  return v;
}

((isNode ? global : window) as unknown as { v: Valyrian }).v = valyrian();
