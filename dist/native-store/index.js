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
var native_store_exports = {};
__export(native_store_exports, {
  createNativeStore: () => createNativeStore
});
module.exports = __toCommonJS(native_store_exports);
var nativeStore = sessionStorage || localStorage;
var ids = /* @__PURE__ */ new Set();
function createNativeStore(key, definition = {}, reuseIfExist = false) {
  if (ids.has(key)) {
    if (reuseIfExist) {
      console.warn(`Store with key ${key} already exists and will be reused`);
    } else {
      throw new Error(`Store with key ${key} already exists`);
    }
  }
  ids.add(key);
  const Store = {
    state: {},
    set(key2, value) {
      this.state[key2] = value;
      nativeStore.setItem(key2, JSON.stringify(this.state));
    },
    get(key2) {
      if (!this.state) {
        this.load();
      }
      return this.state[key2];
    },
    delete(key2) {
      Reflect.deleteProperty(this.state, key2);
      nativeStore.setItem(key2, JSON.stringify(this.state));
    },
    load() {
      const state = nativeStore.getItem(key);
      if (!state) {
        this.state = {};
        nativeStore.setItem(key, JSON.stringify(this.state));
        return;
      }
      this.state = JSON.parse(state);
    },
    clear() {
      this.state = {};
      nativeStore.removeItem(key);
    },
    ...definition
  };
  Store.load();
  return Store;
}
