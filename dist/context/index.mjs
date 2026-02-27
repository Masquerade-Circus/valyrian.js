// lib/context/index.ts
import { isNodeJs } from "valyrian.js";
var NODE_CONTEXT_STORE_KEY = "__valyrian_context_values__";
var browserContextStore = /* @__PURE__ */ new Map();
function createContextScope(name) {
  return {
    key: Symbol(name),
    name
  };
}
function getNodeStoreObject() {
  if (!isNodeJs || typeof sessionStorage === "undefined") {
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
  if (!isNodeJs || typeof sessionStorage === "undefined") {
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
export {
  createContextScope,
  getContext,
  hasContext,
  isServerContextActive,
  runWithContext,
  setContext
};
