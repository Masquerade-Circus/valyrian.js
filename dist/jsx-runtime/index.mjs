// lib/index.ts
var isNodeJs = Boolean(typeof process !== "undefined" && process.versions && process.versions.node);
var fragment = /* @__PURE__ */ Symbol.for("valyrian.fragment");
var Vnode = class {
  constructor(tag, props, children, key, dom, isSVG, oldChildComponents, childComponents, hasKeys, oncreate, oncleanup, onupdate, onremove) {
    this.tag = tag;
    this.props = props;
    this.children = children;
    this.key = key;
    this.dom = dom;
    this.isSVG = isSVG;
    this.oldChildComponents = oldChildComponents;
    this.childComponents = childComponents;
    this.hasKeys = hasKeys;
    this.oncreate = oncreate;
    this.oncleanup = oncleanup;
    this.onupdate = onupdate;
    this.onremove = onremove;
  }
};
function v(tagOrComponent, props, ...children) {
  const key = props?.key;
  if (typeof key !== "undefined") {
    Reflect.deleteProperty(props, "key");
  }
  return new Vnode(tagOrComponent, props, children, key);
}
v.fragment = (_, ...children) => children;

// lib/jsx-runtime/index.ts
function jsx(tag, props, key) {
  let children = [];
  if ("children" in props) {
    children = [props.children];
    Reflect.deleteProperty(props, "children");
  }
  return new Vnode(tag, props, children, key);
}
function jsxs(tag, props, key) {
  let children = props.children;
  Reflect.deleteProperty(props, "children");
  return new Vnode(tag, props, children, key);
}
var Fragment = fragment;
export {
  Fragment,
  jsx,
  jsxs
};
