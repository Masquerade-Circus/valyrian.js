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

// lib/native-store/index.ts
var index_exports = {};
__export(index_exports, {
  StorageType: () => StorageType,
  createNativeStore: () => createNativeStore
});
module.exports = __toCommonJS(index_exports);
var import_valyrian = require("valyrian.js");
var StorageType = /* @__PURE__ */ ((StorageType2) => {
  StorageType2["Session"] = "session";
  StorageType2["Local"] = "local";
  return StorageType2;
})(StorageType || {});
var ids = /* @__PURE__ */ new Set();
function getStorage(storageType) {
  if (import_valyrian.isNodeJs && typeof localStorage === "undefined") {
    throw new Error(
      `localStorage and sessionStorage are not available in Node.js, to use it in your project, you need to "import "valyrian.js/node"`
    );
  }
  return storageType === "session" /* Session */ ? sessionStorage : localStorage;
}
function createNativeStore(key, definition = {}, storageType = "local" /* Local */, reuseIfExist = false) {
  const nativeStore = getStorage(storageType);
  if (ids.has(key)) {
    if (reuseIfExist) {
      console.warn(`Store with key ${key} already exists and will be reused`);
    } else {
      throw new Error(`Store with key ${key} already exists`);
    }
  }
  ids.add(key);
  const id = key;
  const Store = {
    state: {},
    set(key2, value) {
      try {
        this.state[key2] = value;
        nativeStore.setItem(id, JSON.stringify(this.state));
      } catch (e) {
        console.error("Error setting item in storage:", e);
      }
    },
    get(key2) {
      if (Object.keys(this.state).length === 0) {
        this.load();
      }
      return this.state[key2];
    },
    delete(key2) {
      try {
        Reflect.deleteProperty(this.state, key2);
        nativeStore.setItem(id, JSON.stringify(this.state));
      } catch (e) {
        console.error("Error deleting item in storage:", e);
      }
    },
    load() {
      try {
        const state = nativeStore.getItem(id);
        if (!state) {
          this.state = {};
          nativeStore.setItem(id, JSON.stringify(this.state));
          return;
        }
        this.state = JSON.parse(state);
      } catch (e) {
        console.error("Error loading state from storage:", e);
        this.state = {};
      }
    },
    clear() {
      try {
        this.state = {};
        nativeStore.removeItem(id);
      } catch (e) {
        console.error("Error clearing storage:", e);
      }
    },
    ...definition
  };
  Store.load();
  return Store;
}
