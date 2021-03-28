/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
type VnodeOrUnknown = unknown[] | Vnode | TextVnode | unknown | VnodeOrUnknown[];

type DomElement = (Element | SVGElement | HTMLElement) & Record<string, unknown>;

type DomAttribute = { nodeName: string; nodeValue: string };

type Props = { [propName in string | number]: unknown } & {
  key?: string | number;
  data?: string;
  oncreate?: { (vnode: Vnode): never };
  onupdate?: { (vnode: Vnode, oldVnode: Vnode | TextVnode): never };
  onremove?: { (oldVnode: Vnode): never };
  onbeforeupdate?: { (vnode: Vnode, oldVnode: Vnode | TextVnode): undefined | boolean };
};

interface Valyrian {
  (tagOrComponent: string | Component, props?: Props | null, children?: VnodeOrUnknown): Vnode | Component;
  isMounted: boolean;
  isNode: boolean;
  reservedWords: string[];
  current: Current;
  usePlugin: (plugin: Plugin, options: Record<string, unknown>) => void;
  trust: (htmlString: string) => Vnode[];
  onCleanup: (callback: typeof Function) => void;
  updateProperty: (name: string, newNode: Vnode, oldNode?: Vnode) => void;
  update: (props?: Props, ...children: VnodeOrUnknown[]) => string | boolean | void;
  mount: (container: string, component: Component, props: Props, ...children: VnodeOrUnknown[]) => string | boolean | void;
  unMount: () => string | boolean | void;
  directive: (directive: string, handler: Directive) => void;
  newInstance: () => Valyrian;
}

interface Directive {
  (value: any, vnode: Vnode, oldVnode?: Vnode | TextVnode): unknown;
}

interface Plugin {
  (v: Valyrian, options: Record<string, unknown>): unknown;
}

type Current = { parentVnode: Vnode | undefined; oldParentVnode: Vnode | undefined; component: Component | undefined };

class Vnode {
  name: string;
  props: Props;
  children: VnodeOrUnknown[];
  dom?: DomElement;
  onCleanup?: unknown;
  isSVG?: boolean;
  processed?: boolean;

  constructor(name: string, props: Props | null, children: VnodeOrUnknown[]) {
    this.props = props || {};
    this.children = children;
    this.name = name;
  }
}

class TextVnode {
  dom?: DomElement;

  constructor(dom?: DomElement) {
    this.dom = dom;
  }
}

class Component {
  component: Component;
  props: Props | null;
  children: VnodeOrUnknown;

  constructor(component: Component, props: Props | null, children: VnodeOrUnknown) {
    this.props = props;
    this.children = children;
    this.component = component;
  }
}

const UND: undefined = undefined;
const NULL = null;
const isArray = Array.isArray;
const functionstr = "function";
const once = "v-once";
const key = "key";
const svg = "svg";
const str = "string";

const createElement = (tag: string, isSVG: boolean = false): DomElement =>
  isSVG ? (document.createElementNS("http://www.w3.org/2000/svg", tag) as DomElement) : (document.createElement(tag) as DomElement);

// Hydrates the current dom before mount
const domToVnode = (dom: DomElement) => {
  if (dom.nodeType === 1) {
    let props = {};
    [].forEach.call(dom.attributes, (prop) => ((props as Props)[(prop as DomAttribute).nodeName] = (prop as DomAttribute).nodeValue));

    let vnode: Vnode = new Vnode(dom.nodeName as string, props, []);
    vnode.dom = dom;

    for (let i = 0, l = dom.childNodes.length; i < l; i++) {
      let childVnode = domToVnode(dom.childNodes[i] as DomElement);
      childVnode && vnode.children.push(childVnode);
    }
    return vnode;
  }
  if (dom.nodeType === 3) {
    return new TextVnode(dom);
  }
};

const emptyNode = new Vnode("empty", NULL, []);

const callRemove = (vnode: Vnode) => {
  for (let i = 0, l = vnode.children.length; i < l; i++) {
    vnode.children[i] instanceof Vnode && callRemove(vnode.children[i] as Vnode);
  }

  vnode.props.onremove && vnode.props.onremove(vnode);
};

const isNode = typeof window === "undefined" || typeof global !== "undefined";

const trust = (htmlString: string) => {
  let div = createElement("div");
  div.innerHTML = htmlString.trim();

  return [].map.call(div.childNodes, (item) => domToVnode(item)) as Vnode[];
};

//eslint-disable-next-line max-lines-per-function
function valyrian(): Valyrian {
  function v(tagOrComponent: string | Component, props: Props | null = NULL, ...children: VnodeOrUnknown[]) {
    if (typeof tagOrComponent === str) {
      return new Vnode(tagOrComponent as string, props, children);
    }

    return new Component(tagOrComponent as Component, props, children);
  }

  v.isMounted = false;

  v.isNode = isNode;

  let mainContainer: DomElement | null = NULL;
  let mainNode: Vnode;
  let oldMainNode: Vnode;
  let mountedComponent: Component;

  const reservedWords: string[] = [key, "data", once, "oncreate", "onupdate", "onremove", "onbeforeupdate"];
  v.reservedWords = reservedWords;

  const current: Current = {
    parentVnode: UND,
    oldParentVnode: UND,
    component: UND
  };
  v.current = current;

  // Plugin system
  const plugins = new Map();
  v.usePlugin = (plugin: Plugin, options: Record<string, unknown> = {}) => !plugins.has(plugin) && plugins.set(plugin, true) && plugin(v as Valyrian, options);

  let attachedListeners: { [x: string]: boolean } = {};
  function eventListener(e: Event) {
    let dom = e.target as DomElement;
    let name = `__on${e.type}`;
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

  v.trust = trust;

  let vnodesToCleanup: Vnode[] = [];

  v.onCleanup = (callback: typeof Function) => {
    let parentVnode = v.current.parentVnode as Vnode;
    if (!parentVnode.onCleanup) {
      parentVnode.onCleanup = [];
    }

    (parentVnode.onCleanup as FunctionConstructor[]).push(callback);

    if (vnodesToCleanup.indexOf(parentVnode) === -1) {
      vnodesToCleanup.push(parentVnode);
    }
  };

  let cleanupVnodes = () => {
    for (let l = vnodesToCleanup.length; l--; ) {
      for (let callback of (vnodesToCleanup[l] as Vnode & { onCleanup: any }).onCleanup) {
        callback();
      }
    }
    vnodesToCleanup = [];
  };

  const addProps = (newNode: Vnode) => {
    for (let name in newNode.props) {
      let value = newNode.props[name];
      if (reservedWords.indexOf(name) !== -1) {
        if (directives[name]) {
          directives[name](value, newNode);
        }
      } else if (typeof value === functionstr) {
        name = `__${name}`;
        if (!attachedListeners[name]) {
          (mainContainer as DomElement).addEventListener(name.slice(4), eventListener);
          attachedListeners[name] = true;
        }
        (newNode.dom as DomElement)[name] = value;
      } else if (name in (newNode.dom as DomElement) && !newNode.isSVG) {
        // eslint-disable-next-line eqeqeq
        if ((newNode.dom as DomElement)[name] != value) {
          (newNode.dom as DomElement)[name] = value;
        }
      } else {
        (newNode.dom as DomElement).setAttribute(name, value as string);
      }
    }
  };

  const updateProperty = (name: string, newNode: Vnode, oldNode?: Vnode) => {
    if (name in newNode.props) {
      let value = newNode.props[name];
      if (reservedWords.indexOf(name) !== -1) {
        if (directives[name]) {
          directives[name](value, newNode, oldNode);
        }
      } else if (typeof value === functionstr) {
        name = `__${name}`;
        if (!attachedListeners[name]) {
          (mainContainer as DomElement).addEventListener(name.slice(4), eventListener);
          attachedListeners[name] = true;
        }
        (newNode.dom as DomElement)[name] = value;
      } else if (name in (newNode.dom as DomElement) && !newNode.isSVG) {
        // eslint-disable-next-line eqeqeq
        if ((newNode.dom as DomElement)[name] != value) {
          (newNode.dom as DomElement)[name] = value;
        }
      } else if (!oldNode || value !== oldNode.props[name]) {
        (newNode.dom as DomElement).setAttribute(name, value as string);
      }
    }
  };

  v.updateProperty = updateProperty;

  let updateProps = (newNode: Vnode, oldNode?: Vnode) => {
    for (let name in newNode.props) {
      updateProperty(name, newNode, oldNode);
    }
  };

  let removeProps = (newNode: Vnode, oldNode: Vnode) => {
    for (let name in oldNode.props) {
      if (reservedWords.indexOf(name) === -1 && name in newNode.props === false && (oldNode === emptyNode || typeof oldNode.props[name] !== functionstr)) {
        if (name in (newNode.dom as DomElement)) {
          (newNode.dom as DomElement)[name] = UND;
        } else {
          (newNode.dom as DomElement).removeAttribute(name);
        }
      }
    }
  };

  let moveDom = (dom: DomElement, $parent: DomElement, oldDom: DomElement) => {
    oldDom ? $parent.replaceChild(dom, oldDom) : $parent.appendChild(dom);
  };

  let updateKeyedNode = ($parent: DomElement, newNode: Vnode, newIndex: number, compareNode?: Vnode) => {
    let oldDom = $parent.childNodes[newIndex];

    // Moved or updated
    if (compareNode) {
      newNode.dom = compareNode.dom;
      if (once in newNode.props || (newNode.props.onbeforeupdate && newNode.props.onbeforeupdate(newNode, compareNode) === false)) {
        newNode.children = compareNode.children;
        newNode.dom !== oldDom && moveDom(newNode.dom as DomElement, $parent, oldDom as DomElement);
      } else {
        removeProps(newNode, compareNode);
        updateProps(newNode, compareNode);
        newNode.dom !== oldDom && moveDom(newNode.dom as DomElement, $parent, oldDom as DomElement);
        if (v.isMounted) {
          newNode.props.onupdate && newNode.props.onupdate(newNode, compareNode);
        } else {
          newNode.props.oncreate && newNode.props.oncreate(newNode);
        }
        patch(newNode, compareNode);
      }
    } else {
      newNode.dom = createElement(newNode.name, newNode.isSVG);
      addProps(newNode);
      newNode.dom !== oldDom && moveDom(newNode.dom, $parent, oldDom as DomElement);
      newNode.props.oncreate && newNode.props.oncreate(newNode);
      patch(newNode);
    }
  };

  // eslint-disable-next-line complexity,sonarjs/cognitive-complexity
  let patch = (parentNode: Vnode, oldParentNode: Vnode = emptyNode) => {
    let newTree = isArray(parentNode.children) ? parentNode.children : [parentNode.children];
    let oldTree = oldParentNode.children;

    current.parentVnode = parentNode;
    current.oldParentVnode = oldParentNode;

    // Flatten children
    for (let i = 0; i < newTree.length; i++) {
      let childVnode: unknown = newTree[i];

      if (childVnode instanceof Vnode) {
        (childVnode as Vnode).isSVG = parentNode.isSVG || childVnode.name === svg;
      } else if (childVnode === NULL || childVnode === UND) {
        newTree.splice(i--, 1);
      } else if (childVnode instanceof Component) {
        current.component = childVnode;
        newTree.splice(
          i--,
          1,
          ("view" in (childVnode as Component).component ? ((childVnode.component as unknown) as { view: any }).view : childVnode.component).call(
            childVnode.component,
            childVnode.props,
            ...(childVnode.children as VnodeOrUnknown[])
          )
        );
      } else if (isArray(childVnode)) {
        newTree.splice(i--, 1, ...childVnode);
      }
    }

    // New Tree is empty
    if (newTree.length === 0) {
      if (oldTree.length > 0) {
        for (let i = oldTree.length; i--; ) {
          oldTree[i] instanceof Vnode && callRemove(oldTree[i] as Vnode);
        }
        // Fast node remove by setting textContent
        (parentNode.dom as DomElement).textContent = "";
      }

      // If the tree is keyed list and is not first render
    } else if (oldTree.length && newTree[0] instanceof Vnode && key in newTree[0].props) {
      let oldKeys = oldTree.map((vnode) => (vnode as Vnode).props.key);
      let newKeys = newTree.map((vnode) => vnode.props.key);

      for (let i = 0, l = newKeys.length; i < l; i++) {
        let key = newKeys[i];
        let newNode = newTree[i];

        // Updated: Same key
        if (key === oldKeys[i]) {
          (oldTree[i] as Vnode).processed = true;
          updateKeyedNode(parentNode.dom as DomElement, newNode, i, oldTree[i] as Vnode);
        } else {
          let oldIndex = oldKeys.indexOf(key);
          let newIndex = i >= oldKeys.length ? -1 : i;

          // Moved: Key exists in old keys
          if (oldIndex !== -1) {
            (oldTree[oldIndex] as Vnode).processed = true;
            updateKeyedNode(parentNode.dom as DomElement, newNode, newIndex, oldTree[oldIndex] as Vnode);
            // Added: Key does not exists in old keys
          } else {
            updateKeyedNode(parentNode.dom as DomElement, newNode, newIndex);
          }
        }
      }

      // Delete unprocessed old keys
      let l = oldTree.length;

      while (l--) {
        if (!(oldTree[l] as Vnode).processed) {
          let oldVnode = oldTree[l];
          callRemove(oldVnode as Vnode);
          (oldVnode as Vnode).dom &&
            ((oldVnode as Vnode).dom as DomElement).parentNode &&
            (((oldVnode as Vnode).dom as DomElement).parentNode as DomElement).removeChild((oldVnode as Vnode).dom as DomElement);
        }
      }

      // Not keyed list or first render so use the simple algorithm
    } else {
      let i = oldTree.length;
      let l = newTree.length;

      // Remove deleted nodes
      while (i-- > l) {
        let oldVnode = oldTree[i];
        oldVnode instanceof Vnode && callRemove(oldVnode);
        (oldVnode as Vnode).dom &&
          ((oldVnode as Vnode).dom as DomElement).parentNode &&
          (((oldVnode as Vnode).dom as DomElement).parentNode as DomElement).removeChild((oldVnode as Vnode).dom as DomElement);
      }

      for (i = 0; i < l; i++) {
        let newNode = newTree[i] as Vnode | TextVnode | unknown;
        let oldNode = oldTree[i] as Vnode | TextVnode;

        // Is vnode
        if (newNode instanceof Vnode) {
          // Same node name
          if (oldNode && newNode.name === (oldNode as Vnode).name) {
            newNode.dom = (oldNode as Vnode).dom;
            if (once in newNode.props || (newNode.props.onbeforeupdate && newNode.props.onbeforeupdate(newNode, oldNode) === false)) {
              newNode.children = (oldNode as Vnode).children;
            } else {
              removeProps(newNode, oldNode as Vnode);
              updateProps(newNode, oldNode as Vnode);
              if (v.isMounted) {
                newNode.props.onupdate && newNode.props.onupdate(newNode, oldNode);
              } else {
                newNode.props.oncreate && newNode.props.oncreate(newNode);
              }
              patch(newNode, oldNode as Vnode);
            }

            // Different node name
          } else {
            newNode.dom = createElement(newNode.name, newNode.isSVG);
            addProps(newNode);
            if (oldNode) {
              oldNode instanceof Vnode && callRemove(oldNode);
              (parentNode.dom as DomElement).replaceChild(newNode.dom, (parentNode.dom as DomElement).childNodes[i]);
            } else {
              (parentNode.dom as DomElement).appendChild(newNode.dom);
            }
            newNode.props.oncreate && newNode.props.oncreate(newNode);
            patch(newNode);
          }

          // Is TextVnode or will be
        } else {
          let dom;

          // If we are getting a TextVnode could be from the domToVnode method
          let value = newNode instanceof TextVnode ? (newNode.dom as DomElement).nodeValue : String(newNode);

          // Same node
          if (oldNode instanceof TextVnode) {
            dom = oldNode.dom;
            // eslint-disable-next-line eqeqeq
            if (value != (dom as DomElement).nodeValue) {
              (dom as DomElement).nodeValue = value;
            }
            // Different node
          } else {
            dom = document.createTextNode(value as string);
            // Old node is vnode
            if (oldNode) {
              callRemove(oldNode);
              (parentNode.dom as DomElement).replaceChild(dom, oldNode.dom as DomElement);
              // New node
            } else {
              (parentNode.dom as DomElement).appendChild(dom);
            }
          }
          newTree[i] = new TextVnode(dom as DomElement);
        }
      }
    }

    parentNode.children = newTree;
  };

  v.update = (props?: Props, ...children: VnodeOrUnknown[]) => {
    if (mainNode) {
      if (mountedComponent) {
        cleanupVnodes();
        oldMainNode = mainNode;
        mainNode = new Vnode(mainNode.name, mainNode.props, [v(mountedComponent, props, ...children)]);
        mainNode.dom = oldMainNode.dom;
        mainNode.isSVG = mainNode.name === svg;
        patch(mainNode, oldMainNode);
        v.isMounted = true;
      }

      return v.isNode && (mainNode.dom as DomElement).innerHTML;
    }
  };

  v.mount = (container: string, component: Component, props: Props, ...children: VnodeOrUnknown[]) => {
    mainContainer = v.isNode ? createElement(container) : (document.querySelectorAll(container)[0] as DomElement);
    mainNode = domToVnode(mainContainer) as Vnode;
    mountedComponent = component;

    return v.update(props, ...children);
  };

  v.unMount = () => {
    mainContainer = NULL;
    mountedComponent = ((() => "") as unknown) as Component;
    let result = v.update();
    v.isMounted = false;
    return result;
  };

  const directives: { [x: string]: Directive } = {};

  v.directive = (directive: string, handler: Directive) => {
    let directiveName = `v-${directive}`;
    if (reservedWords.indexOf(directiveName) === -1) {
      reservedWords.push(directiveName);
      directives[directiveName] = handler;
    }
  };

  let hideDirective = (test: boolean) => (bool: boolean, vnode: Vnode, oldnode?: Vnode | TextVnode) => {
    let value = test ? bool : !bool;
    if (value) {
      let newdom = createElement("i");
      if (oldnode && oldnode.dom && oldnode.dom.parentNode) {
        oldnode instanceof Vnode && callRemove(oldnode);
        oldnode.dom.parentNode.replaceChild(newdom, oldnode.dom);
      }
      vnode.name = "i";
      vnode.children = [];
      vnode.props = {};
      vnode.dom = (newdom as unknown) as DomElement;
    }
  };

  v.directive("if", hideDirective(false));
  v.directive("unless", hideDirective(true));
  v.directive("for", (set: unknown[], vnode: Vnode) => (vnode.children = set.map(vnode.children[0] as (value: unknown) => Function)));
  v.directive("show", (bool: boolean, vnode: Vnode) => ((vnode.dom as { style: { display: string } }).style.display = bool ? "" : "none"));
  v.directive("class", (classes: { [x: string]: boolean }, vnode: Vnode) => {
    for (let name in classes) {
      (vnode.dom as DomElement).classList.toggle(name, classes[name]);
    }
  });
  v.directive("html", (html: string, vnode: Vnode) => (vnode.children = trust(html)));

  v.newInstance = valyrian;

  return v;
}

(((isNode ? global : window) as unknown) as { v: Valyrian }).v = valyrian();
