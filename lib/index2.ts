/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable complexity */

import {
  Children,
  Component,
  Current,
  Directive,
  Directives,
  DomElement,
  Plugin,
  Props,
  Valyrian,
  ValyrianComponent,
  Vnode,
  VnodeText,
  VnodeWithDom,
  VnodeComponent
} from "./interfaces2";

const current: Current = {};
const onCleanupList: Function[] = [];
const onMountList: Function[] = [];
const onUpdateList: Function[] = [];
const onUnmountList: Function[] = [];
const emptyComponent: Component = () => "";

const eventListenerNames: Record<string, true> = {};
function eventListener(e: Event) {
  let dom = e.target as DomElement;
  let name = `v-on${e.type}`;
  while (dom) {
    if (dom[name]) {
      dom[name](e, dom);
      if (!e.defaultPrevented) {
        v.update();
      }
      return;
    }
    dom = dom.parentNode as DomElement;
  }
}

const reservedProps: Record<string, true> = {
  key: true,
  state: true,
  oncreate: true,
  onupdate: true,
  onremove: true,
  shouldupdate: true,
  "v-once": true,

  // Built in directives
  "v-if": true,
  "v-unless": true,
  "v-for": true,
  "v-show": true,
  "v-class": true,
  "v-html": true,
  "v-model": true
};

const elementsToClone: Record<string, DomElement> = {};
const elementsToCloneSvg: Record<string, DomElement> = {};

function createDomElement(tag: string, isSVG: boolean = false): DomElement {
  return isSVG ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
  // if (isSVG) {
  //   if (!elementsToCloneSvg[tag]) {
  //     elementsToCloneSvg[tag] = document.createElementNS(
  //       "http://www.w3.org/2000/svg",
  //       tag
  //     ) as any;
  //   }

  //   return elementsToCloneSvg[tag].cloneNode(false) as any;
  // }

  // if (!elementsToClone[tag]) {
  //   elementsToClone[tag] = document.createElement(tag) as any;
  // }

  // return elementsToClone[tag].cloneNode(false) as any;
}

const Vnode = (function Vnode(
  this: Vnode,
  tag: string,
  props: Props,
  children: Children
) {
  this.tag = tag;
  this.props = props;
  this.children = children;
} as unknown) as Vnode;

const VnodeText = (function VnodeText(this: VnodeText, nodeValue: string) {
  this.nodeValue = nodeValue;
} as unknown) as VnodeText;

const VnodeComponent = (function VnodeComponent(
  this: VnodeComponent,
  component: Component | ValyrianComponent,
  props: Props,
  children: Children
) {
  this.component = component;
  this.props = props;
  this.children = children;
} as unknown) as VnodeComponent;

// Transforms a DOM node to a VNode
function domToVnode(dom: any): VnodeWithDom {
  let children = [];
  for (let i = 0; i < dom.childNodes.length; i++) {
    let childDom = dom.childNodes[i];
    if (childDom.nodeType === 3) {
      let vnode = new VnodeText(childDom.nodeValue);
      vnode.dom = childDom;
      children.push(vnode);
      continue;
    }

    if (childDom.nodeType === 1) {
      children.push(domToVnode(childDom));
    }
  }

  let props: Props = {};
  for (let i = 0; i < dom.attributes.length; i++) {
    let attr = dom.attributes[i];
    props[attr.nodeName] = attr.nodeValue;
  }

  let vnode = new Vnode(dom.tagName.toLowerCase(), props, children);
  vnode.dom = dom;
  return vnode as VnodeWithDom;
}

const v: Valyrian = (tagOrComponent, props, ...children) => {
  if (typeof tagOrComponent === "string") {
    return new Vnode(tagOrComponent, props || {}, children);
  }

  return new VnodeComponent(tagOrComponent, props || {}, children);
};

v.fragment = (props: Props, ...vnodes: Children) => {
  return vnodes;
};

v.trust = (htmlString: string) => {
  let div = createDomElement("div");
  div.innerHTML = htmlString.trim();

  return [].map.call(div.childNodes, (item) => domToVnode(item)) as Vnode[];
};

v.isVnode = (object?: unknown | Vnode): object is Vnode => {
  return object instanceof Vnode;
};

v.isVnodeComponent = (
  object?: unknown | VnodeComponent
): object is VnodeComponent => {
  return object instanceof VnodeComponent;
};

v.isValyrianComponent = (
  component?: unknown | ValyrianComponent
): component is ValyrianComponent => {
  return Boolean(
    component && typeof component === "object" && "view" in component
  );
};

v.isComponent = (
  component?: unknown | ValyrianComponent
): component is ValyrianComponent => {
  return Boolean(
    (component && typeof component === "function") ||
      v.isValyrianComponent(component) ||
      v.isVnodeComponent(component)
  );
};

v.onCleanup = (callback: Function): void => {
  if (onCleanupList.indexOf(callback) === -1) {
    onCleanupList.push(callback);
  }
};
v.onUnmount = (callback: Function): void => {
  if (onUnmountList.indexOf(callback) === -1) {
    onUnmountList.push(callback);
  }
};
v.onMount = (callback: Function): void => {
  if (onMountList.indexOf(callback) === -1) {
    onMountList.push(callback);
  }
};
v.onUpdate = (callback: Function): void => {
  if (onUpdateList.indexOf(callback) === -1) {
    onUpdateList.push(callback);
  }
};

function callCallbackList(list: Function[]): void {
  for (let i = 0; i < list.length; i++) {
    list[i]();
  }
  list.length = 0;
}

function sharedSetAttribute(
  prop: string,
  newVnode: VnodeWithDom,
  oldVnode?: VnodeWithDom
): void | boolean {
  if (reservedProps[prop]) {
    if (directives[prop]) {
      return directives[prop](newVnode.props[prop], newVnode, oldVnode);
    }
    return;
  }

  let value = newVnode.props[prop];
  let dom = newVnode.dom;

  if (typeof value === "function") {
    if (!eventListenerNames[prop]) {
      (v.mainVnode as VnodeWithDom).dom.addEventListener(
        prop.slice(2),
        eventListener
      );
      eventListenerNames[prop] = true;
    }
    dom[`v-${prop}`] = value;
    return;
  }

  if (prop in dom && !newVnode.isSVG) {
    // eslint-disable-next-line eqeqeq
    if (dom[prop] != value) {
      dom[prop] = value;
    }

    return;
  }

  if (!oldVnode || value !== oldVnode.props[prop]) {
    if (value === false) {
      dom.removeAttribute(prop);
    } else {
      dom.setAttribute(prop, value);
    }
  }
}

function setAttribute(
  name: string,
  value: any,
  vnode: Vnode,
  oldVnode?: VnodeWithDom
): void {
  vnode.props[name] = value;
  sharedSetAttribute(name, vnode as VnodeWithDom, oldVnode);
}

function setAttributes(newVnode: VnodeWithDom, oldVnode?: VnodeWithDom): void {
  for (let prop in newVnode.props) {
    if (sharedSetAttribute(prop, newVnode, oldVnode) === false) {
      return;
    }
  }

  if (oldVnode) {
    for (let name in oldVnode.props) {
      if (
        name in newVnode.props === false &&
      typeof oldVnode.props[name] !== "function" &&
      !reservedProps[name]
      ) {
        if (name in newVnode.dom && newVnode.isSVG === false) {
          newVnode.dom[name] = null;
        } else {
          newVnode.dom.removeAttribute(name);
        }
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
function patch(
  newParentVnode: VnodeWithDom,
  oldParentVnode?: VnodeWithDom
): void {
  let oldTree = oldParentVnode?.children || [];
  let newTree = newParentVnode.children;
  let oldTreeLength = oldTree.length;

  current.vnode = newParentVnode;
  current.oldVnode = oldParentVnode;

  if (
    newTree[0] instanceof Vnode &&
    oldTree[0] instanceof Vnode &&
    "key" in newTree[0].props &&
    "key" in oldTree[0].props
  ) {
    let newTreeLength = newTree.length;
    let oldKeyedList: { [key: string]: number } = {};
    for (let i = 0; i < oldTreeLength; i++) {
      oldKeyedList[oldTree[i].props.key] = i;
    }

    let newKeyedList: { [key: string]: number } = {};
    for (let i = 0; i < newTreeLength; i++) {
      newKeyedList[newTree[i].props.key] = i;
    }

    for (let i = 0; i < newTreeLength; i++) {
      let childVnode = newTree[i];
      let oldChildVnode = oldTree[oldKeyedList[childVnode.props.key]];
      let shouldPatch = true;

      if (oldChildVnode) {
        childVnode.dom = oldChildVnode.dom;
        if (
          childVnode.props["v-once"] ||
          (childVnode.props.shouldupdate &&
            childVnode.props.shouldupdate(childVnode, oldChildVnode) === false)
        ) {
          childVnode.children = oldChildVnode.children;
          shouldPatch = false;
        } else {
          setAttributes(childVnode, oldChildVnode);
          if (v.isMounted) {
            childVnode.props.onupdate &&
              childVnode.props.onupdate(childVnode, oldChildVnode);
          } else {
            childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
          }
        }
      } else {
        childVnode.dom = createDomElement(childVnode.tag, childVnode.isSVG);
        setAttributes(childVnode);
        childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
      }

      if (!newParentVnode.dom.childNodes[i]) {
        newParentVnode.dom.appendChild(childVnode.dom);
      } else if (newParentVnode.dom.childNodes[i] !== childVnode.dom) {
        oldTree[i] &&
          !newKeyedList[oldTree[i].props.key] &&
          callRemove(oldTree[i]);
        newParentVnode.dom.replaceChild(
          childVnode.dom,
          newParentVnode.dom.childNodes[i]
        );
      }

      shouldPatch && patch(childVnode, oldChildVnode);
    }

    // For the rest of the children, we should remove them
    for (let i = newTreeLength; i < oldTreeLength; i++) {
      if (!newKeyedList[oldTree[i].props.key]) {
        let oldChildVnode = oldTree[i];
        callRemove(oldChildVnode);
        oldChildVnode.dom.parentNode &&
          oldChildVnode.dom.parentNode.removeChild(oldChildVnode.dom);
      }
    }
    return;
  }

  // Flat newTree
  for (let i = 0; i < newTree.length; i++) {
    let childVnode = newTree[i];

    if (childVnode instanceof Vnode) {
      let oldChildVnode = oldTree[i];
      childVnode.isSVG = newParentVnode.isSVG || childVnode.tag === "svg";

      if (!oldChildVnode) {
        childVnode.dom = createDomElement(childVnode.tag, childVnode.isSVG);
        setAttributes(childVnode as VnodeWithDom);
        childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
        patch(childVnode as VnodeWithDom);
        newParentVnode.dom.appendChild(childVnode.dom);
        continue;
      }

      if (childVnode.tag === oldChildVnode.tag) {
        childVnode.dom = oldChildVnode.dom;

        if (
          childVnode.props["v-once"] ||
          (childVnode.props.shouldupdate &&
            childVnode.props.shouldupdate(childVnode, oldChildVnode) === false)
        ) {
          childVnode.children = oldChildVnode.children;
          continue;
        }

        setAttributes(childVnode as VnodeWithDom, oldChildVnode);
        if (v.isMounted) {
          childVnode.props.onupdate &&
            childVnode.props.onupdate(childVnode, oldChildVnode);
        } else {
          childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
        }
        patch(childVnode as VnodeWithDom, oldChildVnode);
        continue;
      }

      childVnode.dom = createDomElement(childVnode.tag, childVnode.isSVG);
      setAttributes(childVnode as VnodeWithDom);
      childVnode.props.oncreate && childVnode.props.oncreate(childVnode);
      oldChildVnode instanceof Vnode && callRemove(oldChildVnode);
      newParentVnode.dom.replaceChild(childVnode.dom, oldChildVnode.dom);
      patch(childVnode as VnodeWithDom);
      continue;
    }

    if (childVnode === null || childVnode === undefined) {
      newTree.splice(i--, 1);
      continue;
    }

    if (Array.isArray(childVnode)) {
      newTree.splice(i--, 1, ...childVnode);
      continue;
    }

    if (childVnode instanceof VnodeComponent) {
      current.component = childVnode.component;
      newTree.splice(
        i--,
        1,
        (childVnode.component.view
          ? childVnode.component.view.bind(childVnode.component)
          : childVnode.component.bind(childVnode.component))(
          childVnode.props,
          ...childVnode.children
        )
      );
      continue;
    }

    if (childVnode instanceof VnodeText === false) {
      newTree[i] = childVnode = new VnodeText(String(childVnode));
    }

    let oldChildVnode = oldTree[i];

    if (!oldChildVnode) {
      childVnode.dom = document.createTextNode(childVnode.nodeValue);
      newParentVnode.dom.appendChild(childVnode.dom);
      continue;
    }

    if (oldChildVnode instanceof VnodeText) {
      childVnode.dom = oldChildVnode.dom;
      // eslint-disable-next-line eqeqeq
      if (childVnode.nodeValue != childVnode.dom.nodeValue) {
        childVnode.dom.nodeValue = childVnode.nodeValue;
      }
      continue;
    }

    childVnode.dom = document.createTextNode(childVnode.nodeValue);
    callRemove(oldChildVnode);
    newParentVnode.dom.replaceChild(childVnode.dom, oldChildVnode.dom);
  }

  let newTreeLength = newTree.length;

  // If new tree is empty, fast remove all old nodes
  if (newTreeLength === 0) {
    for (let i = oldTreeLength; i--; ) {
      oldTree[i] instanceof Vnode && callRemove(oldTree[i]);
    }
    newParentVnode.dom.textContent = "";
    return;
  }

  // For the rest of the children, we should remove them
  for (let i = oldTreeLength - 1; i >= newTreeLength; --i) {
    oldTree[i] instanceof Vnode && callRemove(oldTree[i]);
    oldTree[i].dom.parentNode &&
      oldTree[i].dom.parentNode.removeChild(oldTree[i].dom);
  }
}

v.update = () => {
  if (v.mainVnode) {
    onCleanupList.length && callCallbackList(onCleanupList);
    let oldMainVnode = v.mainVnode;
    let newMainVnode = new Vnode(oldMainVnode.tag, oldMainVnode.props, [
      v.component instanceof VnodeComponent
        ? v.component
        : v(v.component as Component, null)
    ]) as VnodeWithDom;
    newMainVnode.dom = oldMainVnode.dom;
    newMainVnode.isSVG = oldMainVnode.isSVG;
    v.mainVnode = newMainVnode;
    patch(newMainVnode, oldMainVnode);
    if (v.isMounted === false) {
      onMountList.length && callCallbackList(onMountList);
      v.isMounted = true;
    } else {
      onUpdateList.length && callCallbackList(onUpdateList);
    }
    if (v.isNodeJs) {
      return (newMainVnode.dom as HTMLElement).innerHTML;
    }
  }
};

v.unmount = () => {
  if (v.mainVnode) {
    onCleanupList.length && callCallbackList(onCleanupList);
    onUnmountList.length && callCallbackList(onUnmountList);
    v.component = emptyComponent;
    let result = v.update();
    v.mainVnode = null;
    v.component = null;
    v.isMounted = false;
    return result;
  }
};

v.mount = (container, component) => {
  if (v.isMounted) {
    v.unmount();
  }

  let mainContainer;
  if (v.isNodeJs) {
    mainContainer =
      typeof container === "string"
        ? createDomElement(container, container === "svg")
        : container;
  } else {
    mainContainer =
      typeof container === "string"
        ? (document.querySelectorAll(container)[0] as DomElement)
        : container;
  }

  v.mainVnode = domToVnode(mainContainer);
  v.mainVnode.isSVG = v.mainVnode.tag === "svg";
  v.component = component;

  return v.update();
};

const plugins = new Map<Plugin, any>();

v.use = (
  plugin: Plugin,
  options?: Record<string | number | symbol, any>
): void | any => {
  if (plugins.has(plugin)) {
    return plugins.get(plugin);
  }

  let result = plugin(v, options);
  plugins.set(plugin, result);
  return result;
};

let hideDirective = (test: boolean) => (
  bool: boolean,
  vnode: Vnode,
  oldnode?: Vnode | VnodeText
) => {
  let value = test ? bool : !bool;
  if (value) {
    let newdom = document.createTextNode("");
    if (oldnode && oldnode.dom && oldnode.dom.parentNode) {
      oldnode instanceof Vnode && callRemove(oldnode);
      oldnode.dom.parentNode.replaceChild(newdom, oldnode.dom);
    }
    vnode.tag = "#text";
    vnode.children = [];
    vnode.props = {};
    vnode.dom = (newdom as unknown) as DomElement;
    return false;
  }
};

const directives: Directives = {
  "v-if": hideDirective(false),
  "v-unless": hideDirective(true),
  "v-for": (set: unknown[], vnode: VnodeWithDom) => {
    vnode.children = set.map(vnode.children[0]);
  },
  "v-show": (bool: boolean, vnode: VnodeWithDom) => {
    ((vnode.dom as unknown) as {
      style: { display: string };
    }).style.display = bool ? "" : "none";
  },
  "v-class": (classes: { [x: string]: boolean }, vnode: VnodeWithDom) => {
    for (let name in classes) {
      (vnode.dom as DomElement).classList.toggle(name, classes[name]);
    }
  },
  "v-html": (html: string, vnode: VnodeWithDom) => {
    vnode.children = [v.trust(html)];
  },
  "v-model": (
    [model, property, event]: any[],
    vnode: VnodeWithDom,
    oldVnode?: VnodeWithDom
  ) => {
    let value;
    let handler;
    if (vnode.tag === "input") {
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
          setAttribute("checked", value, vnode, oldVnode);
          break;
        }
        case "radio": {
          setAttribute(
            "checked",
            model[property] === vnode.dom.value,
            vnode,
            oldVnode
          );
          break;
        }
        default: {
          setAttribute("value", model[property], vnode, oldVnode);
        }
      }
    } else if (vnode.tag === "select") {
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
        vnode.children.forEach((child: Vnode) => {
          if (child.tag === "option") {
            let value =
              "value" in child.props
                ? child.props.value
                : child.children.join("").trim();
            child.props.selected = model[property].indexOf(value) !== -1;
          }
        });
      } else {
        vnode.children.forEach((child: Vnode) => {
          if (child.tag === "option") {
            let value =
              "value" in child.props
                ? child.props.value
                : child.children.join("").trim();
            child.props.selected = value === model[property];
          }
        });
      }
    } else if (vnode.tag === "textarea") {
      event = event || "oninput";
      vnode.children = [model[property]];
    }

    if (!vnode.props[event]) {
      if (!handler) {
        handler = (e: Event) =>
          (model[property] = (e.target as DomElement &
            Record<string, any>).value);
      }
      setAttribute(event, handler, vnode, oldVnode);
    }
  }
};

v.directive = (name: string, directive: Directive) => {
  let fullName = `v-${name}`;
  directives[fullName] = directive;
  reservedProps[fullName] = true;
};

v.isNodeJs = Boolean(
  typeof process !== "undefined" && process.versions && process.versions.node
);
v.isMounted = false;

v.component = null;
v.mainVnode = null;

v.directives = directives;
v.reservedProps = reservedProps;
v.current = current;

v.setAttribute = setAttribute;

export default v;
