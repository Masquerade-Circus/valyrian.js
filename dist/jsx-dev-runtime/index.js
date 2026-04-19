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

// lib/jsx-dev-runtime/index.ts
var index_exports = {};
__export(index_exports, {
  Fragment: () => import_jsx_runtime.Fragment,
  jsx: () => import_jsx_runtime.jsx,
  jsxDEV: () => jsxDEV,
  jsxs: () => import_jsx_runtime.jsxs
});
module.exports = __toCommonJS(index_exports);
var import_valyrian = require("valyrian.js");
var import_jsx_runtime = require("valyrian.js/jsx-runtime");
function jsxDEV(type, props, key, isStaticChildren, source, self) {
  let children = [];
  if ("children" in props) {
    children = Array.isArray(props.children) ? props.children : [props.children];
    Reflect.deleteProperty(props, "children");
  }
  return new import_valyrian.Vnode(type, props, children, key);
}
