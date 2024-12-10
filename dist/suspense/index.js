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

// lib/suspense/index.ts
var suspense_exports = {};
__export(suspense_exports, {
  Suspense: () => Suspense
});
module.exports = __toCommonJS(suspense_exports);
var import_valyrian = require("valyrian.js");
var import_hooks = require("valyrian.js/hooks");
function Suspense({
  fallback,
  error
}, children) {
  const [loadedChildren, setLoadedChildren] = (0, import_hooks.useState)(null);
  const [err, setErr] = (0, import_hooks.useState)(null);
  return (0, import_valyrian.v)(() => {
    if (err()) {
      if (error) {
        return error(err());
      }
      return err().message;
    }
    if (loadedChildren()) {
      return loadedChildren();
    }
    Promise.all(
      children.map((child) => {
        if ((0, import_valyrian.isVnodeComponent)(child)) {
          if ((0, import_valyrian.isPOJOComponent)(child.tag)) {
            return child.tag.view.bind(child.tag)(child.props || {}, child.children);
          }
          return child.tag(child.props || {}, child.children);
        }
        if ((0, import_valyrian.isPOJOComponent)(child)) {
          return child.view.bind(child)({}, []);
        }
        if ((0, import_valyrian.isComponent)(child)) {
          return child({}, []);
        }
        return child;
      })
    ).then((newChildren) => {
      setLoadedChildren(newChildren);
    }).catch((e) => {
      setErr(e);
    });
    return fallback;
  }, {});
}
