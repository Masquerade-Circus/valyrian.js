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

// lib/context/index.ts
var index_exports = {};
__export(index_exports, {
  createContextScope: () => createContextScope,
  getContext: () => getContext,
  hasContext: () => hasContext,
  isServerContextActive: () => isServerContextActive,
  runWithContext: () => runWithContext,
  setContext: () => setContext
});
module.exports = __toCommonJS(index_exports);
var import_valyrian = require("valyrian.js");
var NODE_CONTEXT_STORE_KEY = "__valyrian_context_values__";
var browserContextStore = /* @__PURE__ */ new Map();
function createContextScope(name) {
  return {
    key: Symbol(name),
    name
  };
}
function getNodeStoreObject() {
  if (!import_valyrian.isNodeJs || typeof sessionStorage === "undefined") {
    return null;
  }
  const storage = sessionStorage;
  if (!storage.store || typeof storage.store !== "object") {
    return null;
  }
  return storage.store;
}
function getScopeMap(create = false) {
  const nodeStore = getNodeStoreObject();
  if (nodeStore) {
    const existingMap = nodeStore[NODE_CONTEXT_STORE_KEY];
    if (existingMap) {
      return existingMap;
    }
    if (create) {
      const nextMap = /* @__PURE__ */ new Map();
      nodeStore[NODE_CONTEXT_STORE_KEY] = nextMap;
      return nextMap;
    }
    return null;
  }
  if (create) {
    return browserContextStore;
  }
  return browserContextStore.size > 0 ? browserContextStore : null;
}
function isServerContextActive() {
  if (!import_valyrian.isNodeJs || typeof sessionStorage === "undefined") {
    return false;
  }
  const maybeServerStorage = sessionStorage;
  if (typeof maybeServerStorage.isContextActive === "function") {
    return Boolean(maybeServerStorage.isContextActive());
  }
  return false;
}
function getContext(scope) {
  const map = getScopeMap(false);
  if (!map) {
    return void 0;
  }
  return map.get(scope.key);
}
function hasContext(scope) {
  const map = getScopeMap(false);
  if (!map) {
    return false;
  }
  return map.has(scope.key);
}
function setContext(scope, value) {
  const map = getScopeMap(true);
  const hasPrevious = map.has(scope.key);
  const previousValue = map.get(scope.key);
  map.set(scope.key, value);
  return () => {
    if (!hasPrevious) {
      map.delete(scope.key);
      return;
    }
    map.set(scope.key, previousValue);
  };
}
function runWithContext(scope, value, callback) {
  const restore = setContext(scope, value);
  try {
    const result = callback();
    if (result instanceof Promise) {
      return result.finally(restore);
    }
    restore();
    return result;
  } catch (error) {
    restore();
    throw error;
  }
}
