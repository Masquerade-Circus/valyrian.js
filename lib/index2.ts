/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable complexity */

import { Children, Component, Plugin, Props, Valyrian, ValyrianComponent, Vnode, VnodeWithDom } from "./interfaces2";

const isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);

const elementsToClone: {
  svg: Record<string, Element>;
  notSvg: Record<string, Element>;
} = {
  svg: {},
  notSvg: {}
};

function createDomElement(tag: string, isSVG: boolean = false): Element {
  if (isSVG) {
    if (!elementsToClone.svg[tag]) {
      elementsToClone.svg[tag] = document.createElementNS("http://www.w3.org/2000/svg", tag);
    }

    let dom = elementsToClone.svg[tag].cloneNode(false) as any;
    dom.vProps = {};
    return dom;
  }

  if (!elementsToClone.notSvg[tag]) {
    elementsToClone.notSvg[tag] = document.createElement(tag);
  }

  let dom = elementsToClone.notSvg[tag].cloneNode(false) as any;
  dom.vProps = {};
  return dom;
}

function domToVnode(dom: any): void | Vnode {
  if (dom.nodeType === 3) {
    return {
      tag: "#text",
      props: {},
      children: [dom.nodeValue],
      dom
    };
  }

  if (dom.nodeType === 1) {
    let children = [];
    for (let i = 0; i < dom.childNodes.length; i++) {
      let child = domToVnode(dom.childNodes[i]);
      if (child) {
        children.push(child);
      }
    }

    let vProps: Props = {};
    if (dom.vProps) {
      vProps = dom.vProps;
    } else {
      [].forEach.call(dom.attributes, (prop: Attr) => (vProps[prop.nodeName] = prop.nodeValue));
    }

    return {
      tag: dom.tagName.toLowerCase(),
      props: vProps,
      children,
      dom
    };
  }
}

const trust = (htmlString: string): Children => {
  let div = createDomElement("div");
  div.innerHTML = htmlString.trim();

  return [].map.call(div.childNodes, (item) => domToVnode(item)) as Vnode[];
};

function createVnode(tag: string, props: Props, children: any[]): Vnode {
  return {
    tag,
    props,
    children
  };
}

function createValyrianComponent(component: Component, props: Record<string, any>, children: any[]): ValyrianComponent {
  return {
    view: component.bind(component),
    props,
    children
  };
}

const v: Valyrian = function (tagOrComponent: string | Component, props: Record<string, any> | null, ...children: any[]): Vnode | ValyrianComponent {
  if (typeof tagOrComponent === "string") {
    return createVnode(tagOrComponent, props || {}, children);
  }
  return createValyrianComponent(tagOrComponent, props || {}, children);
};

v.fragment = function (props: Props, ...children: any[]) {
  return children;
};

const reservedProps: Record<string, any> = {
  state: true
};
const directives: Record<string, any> = {};
const eventListenerNames: Record<string, any> = {};
function eventListener(e: Event) {
  let dom = e.target as any;
  let name = `v-on${e.type}`;
  while (dom) {
    if (dom[name]) {
      dom[name](e, dom);
      if (!e.defaultPrevented) {
        v.update();
      }
      return;
    }
    dom = dom.parentNode;
  }
}

function sharedSetAttribute(prop: string, vnode: Vnode, dom: Element & Record<string, any>, isSVG: boolean = false, oldVnode?: VnodeWithDom): void | boolean {
  // It is a reserved prop
  if (reservedProps[prop]) {
    // If it is a directive name call the directive
    if (directives[prop]) {
      if (!oldVnode) {
        oldVnode = domToVnode(dom) as VnodeWithDom;
      }
      return directives[prop](vnode.props[prop], vnode, oldVnode);
    }

    return;
  }

  let value = vnode.props[prop];

  // It is not a reserved prop so we add it to the dom
  if (typeof value === "function") {
    if (prop in eventListenerNames === false) {
      eventListenerNames[prop] = true;
      (v.container as Element).addEventListener(prop.slice(2), eventListener);
    }
    dom[`v-${prop}`] = value;
    return;
  }

  if (prop in dom && isSVG === false) {
    // eslint-disable-next-line eqeqeq
    if (dom[prop] != value) {
      dom.vProps[prop] = value;
      dom[prop] = value;
    }
    return;
  }

  // Use set attribute
  if (dom[prop] !== value) {
    if (value === false) {
      dom.removeAttribute(prop);
      Reflect.deleteProperty(dom.vProps, prop);
    } else {
      dom.setAttribute(prop, value);
      dom.vProps[prop] = value;
    }
  }
}

function setAttribute(name: string, value: any, vnode: VnodeWithDom, isSVG: boolean = false) {
  vnode.props[name] = value;
  sharedSetAttribute(name, vnode, vnode.dom, isSVG || vnode.tag === "svg");
}

function setAttributes(vnode: Vnode, dom: Element & Record<string, any>, isSVG: boolean = false) {
  let oldProps = { ...dom.vProps };
  let oldVnode;

  for (let prop in vnode.props) {
    if (sharedSetAttribute(prop, vnode, dom, isSVG, oldVnode) === false) {
      break;
    }
  }

  for (let prop in oldProps) {
    if (prop in vnode.props === false) {
      if (prop in dom && isSVG === false) {
        dom[prop] = null;
      } else {
        dom.removeAttribute(prop);
      }
      Reflect.deleteProperty(dom.vProps, prop);
    }
  }
}

function patch(newTree: any[], parent: Element, isSVG: boolean = false) {
  for (let i = 0; i < newTree.length; i++) {
    let childVnode = newTree[i];
    if (childVnode === null || childVnode === undefined) {
      newTree.splice(i--, 1);
    } else if (Array.isArray(childVnode)) {
      newTree.splice(i--, 1, ...childVnode);
    } else if (typeof childVnode === "object" && ("tag" in childVnode || "view" in childVnode)) {
      if (childVnode.view) {
        let result = childVnode.view(childVnode.props, ...childVnode.children);

        newTree.splice(i--, 1, result);
        continue;
      }
    } else {
      newTree[i] = v("#text", {}, childVnode);
    }
  }

  let oldTreeLength = parent.childNodes.length;
  let newTreeLength = newTree.length;

  // If new tree is empty, remove all old nodes
  if (newTreeLength === 0) {
    for (let i = oldTreeLength - 1; i >= 0; i--) {
      parent.removeChild(parent.childNodes[i]);
    }
    return;
  }

  // If new tree and old tree have more than one child, we should update the dom
  if (newTreeLength) {
    for (let i = 0; i < newTreeLength; i++) {
      let newChild = newTree[i];
      let oldDom = parent.childNodes[i] as Element;

      if (!oldDom) {
        if (newChild.tag === "#text") {
          parent.appendChild(document.createTextNode(newChild.children[0]));
          continue;
        }

        isSVG = isSVG || newChild.tag === "svg";
        let newDom = createDomElement(newChild.tag, isSVG);
        setAttributes(newChild, newDom, isSVG);
        parent.appendChild(newDom);
        if (newChild.children.length > 0) {
          patch(newChild.children, newDom, isSVG);
        }
        continue;
      }

      if (newChild.tag === "#text") {
        if (oldDom.nodeType === 3) {
          // eslint-disable-next-line eqeqeq
          if (oldDom.textContent != newChild.children[0]) {
            oldDom.textContent = newChild.children[0];
          }
          continue;
        }

        let newDom = document.createTextNode(newChild.children[0]);
        parent.replaceChild(newDom, oldDom);
        continue;
      }

      isSVG = isSVG || newChild.tag === "svg";
      if (oldDom.tagName.toLowerCase() !== newChild.tag) {
        let newDom = createDomElement(newChild.tag, isSVG);
        setAttributes(newChild, newDom, isSVG);
        parent.replaceChild(newDom, oldDom);
        if (newChild.children.length > 0) {
          patch(newChild.children, newDom, isSVG);
        }
        continue;
      }

      setAttributes(newChild, oldDom, isSVG);
      if (newChild.children.length > 0) {
        patch(newChild.children, oldDom, isSVG);
      }
    }
  }
}

function update() {
  if (v.component && v.container) {
    let result = v.component.view(v.component.props || {}, v.component.children);

    patch(Array.isArray(result) ? result : [result], v.container);

    if (isNodeJs) {
      return v.container.innerHTML;
    }
  }
}

function mount(container: string | Element, normalComponent: Component | ValyrianComponent) {
  if (v.isMounted) {
    v.unmount();
  }

  if (isNodeJs) {
    v.container = typeof container === "string" ? createDomElement(container === "svg" ? "svg" : "div", container === "svg") : container;
  } else {
    v.container = typeof container === "string" ? document.querySelectorAll(container)[0] : container;
  }

  v.component = (normalComponent.view ? normalComponent : createValyrianComponent(normalComponent as Component, {}, [])) as ValyrianComponent;

  return update();
}

function unmount() {
  if (v.component && v.container) {
    patch([], v.container);
    v.component = null;
    v.isMounted = false;
    if (isNodeJs) {
      return v.mainVnode.dom.innerHTML;
    }
  }
}

const plugins = new Map<Plugin, any>();

function use(plugin: Plugin, options?: Record<string | number | symbol, any>): void | any {
  if (plugins.has(plugin)) {
    return plugins.get(plugin);
  }

  let result = plugin(v, options);
  plugins.set(plugin, result);
  return result;
}

v.isNodeJs = isNodeJs;
v.isMounted = false;
v.directives = directives;
v.reservedProps = reservedProps;
v.mount = mount;
v.unmount = unmount;
v.update = update;
v.use = use;
v.trust = trust;
v.setAttribute = setAttribute;

export default v;
