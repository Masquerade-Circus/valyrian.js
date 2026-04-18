"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/jsx-runtime/index.ts
var index_exports = {};
__export(index_exports, {
  Fragment: () => Fragment,
  jsx: () => jsx,
  jsxs: () => jsxs
});
module.exports = __toCommonJS(index_exports);

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
