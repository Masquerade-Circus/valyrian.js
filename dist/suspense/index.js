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
var index_exports = {};
__export(index_exports, {
  Suspense: () => Suspense
});
module.exports = __toCommonJS(index_exports);
var import_valyrian = require("valyrian.js");
var domToSuspenseStores = /* @__PURE__ */ new WeakMap();
function getSuspenseStore(dom, key) {
  let stores = domToSuspenseStores.get(dom);
  if (!stores) {
    stores = /* @__PURE__ */ new Map();
    domToSuspenseStores.set(dom, stores);
  }
  let store = stores.get(key);
  if (!store) {
    store = {
      status: 0,
      value: null,
      error: null,
      version: 0,
      promise: null
    };
    stores.set(key, store);
  }
  return store;
}
function Suspense({
  key,
  fallback,
  error
}, children) {
  if (key === void 0 || key === null) {
    throw new Error("Suspense requires a 'key' prop");
  }
  return (0, import_valyrian.v)(() => {
    const hostVnode = import_valyrian.current.vnode;
    if (!hostVnode || !hostVnode.dom) {
      throw new Error("Suspense must be rendered inside a component");
    }
    const hostDom = hostVnode.dom;
    const store = getSuspenseStore(hostDom, key);
    if (store.status === 2 && store.error) {
      if (error) {
        return error(store.error);
      }
      return store.error.message;
    }
    if (store.status === 1) {
      return store.value;
    }
    if (!store.promise) {
      const version = ++store.version;
      const promise = Promise.all(
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
      );
      store.promise = promise;
      promise.then((newChildren) => {
        if (store.version !== version) {
          return;
        }
        store.status = 1;
        store.value = newChildren;
        store.error = null;
        store.promise = null;
        const vnodeToUpdate = hostDom.vnode;
        if (vnodeToUpdate) {
          (0, import_valyrian.updateVnode)(vnodeToUpdate);
        }
      }).catch((e) => {
        if (store.version !== version) {
          return;
        }
        store.status = 2;
        store.error = e instanceof Error ? e : new Error(String(e));
        store.promise = null;
        const vnodeToUpdate = hostDom.vnode;
        if (vnodeToUpdate) {
          (0, import_valyrian.updateVnode)(vnodeToUpdate);
        }
      });
    }
    return fallback;
  }, {});
}
