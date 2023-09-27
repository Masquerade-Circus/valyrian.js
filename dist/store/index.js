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

// lib/store/index.ts
var store_exports = {};
__export(store_exports, {
  Store: () => Store
});
module.exports = __toCommonJS(store_exports);
var import_valyrian = require("valyrian.js");
function keyExists(typeOfKey, object, key) {
  if (key in object === false) {
    throw new Error(`The ${typeOfKey} "${key}" does not exists.`);
  }
}
function deepFreeze(obj) {
  if (typeof obj === "object" && obj !== null && !Object.isFrozen(obj)) {
    if (Array.isArray(obj)) {
      for (let i = 0, l = obj.length; i < l; i++) {
        deepFreeze(obj[i]);
      }
    } else {
      let props = Reflect.ownKeys(obj);
      for (let i = 0, l = props.length; i < l; i++) {
        deepFreeze(obj[props[i]]);
      }
    }
    Object.freeze(obj);
  }
  return obj;
}
var updateTimeout;
function delayedUpdate() {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(import_valyrian.update);
}
var Store = function Store2({ state = {}, getters = {}, actions = {}, mutations = {} } = {}) {
  let frozen = true;
  function isUnfrozen() {
    if (frozen) {
      throw new Error("You need to commit a mutation to change the state");
    }
  }
  let localState = typeof state === "function" ? state() : state;
  this.state = new Proxy(localState || {}, {
    get: (state2, prop) => deepFreeze(state2[prop]),
    set: (state2, prop, value) => {
      isUnfrozen();
      state2[prop] = value;
      return true;
    },
    deleteProperty: (state2, prop) => {
      isUnfrozen();
      Reflect.deleteProperty(state2, prop);
      return true;
    }
  });
  this.getters = new Proxy(getters, {
    get: (getters2, getter) => {
      try {
        return getters2[getter](this.state, this.getters);
      } catch (e) {
      }
    }
  });
  this.commit = (mutation, ...args) => {
    keyExists("mutation", mutations, mutation);
    frozen = false;
    mutations[mutation](this.state, ...args);
    frozen = true;
    delayedUpdate();
  };
  this.dispatch = (action, ...args) => {
    keyExists("action", actions, action);
    return Promise.resolve(actions[action](this, ...args));
  };
};
