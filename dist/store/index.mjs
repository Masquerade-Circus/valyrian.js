// lib/store/index.ts
import { update } from "valyrian.js";
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
  updateTimeout = setTimeout(update);
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
export {
  Store
};
