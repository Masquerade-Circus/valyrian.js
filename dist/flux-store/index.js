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

// lib/flux-store/index.ts
var index_exports = {};
__export(index_exports, {
  FluxStore: () => FluxStore
});
module.exports = __toCommonJS(index_exports);
var import_valyrian = require("valyrian.js");
var import_utils = require("valyrian.js/utils");
var FluxStore = class _FluxStore {
  state;
  getters;
  init;
  // eslint-disable-next-line no-use-before-define
  rootStore;
  namespace;
  // eslint-disable-next-line sonarjs/cognitive-complexity
  constructor({
    state = {},
    mutations = {},
    actions = {},
    getters = {},
    modules = {},
    shouldFreeze = true,
    namespace,
    rootStore
  } = {}) {
    const localState = typeof state === "function" ? state() : state;
    this.state = new Proxy(localState || {}, {
      // Every time we try to access a property from the state we try to deep freeze the property
      // to prevent direct modifications to the state
      get: (state2, prop) => {
        if ((this.rootStore || this).init.modules[prop]) {
          return state2[prop];
        }
        if (shouldFreeze) {
          if (this.init.frozen) {
            return (0, import_utils.deepFreeze)(state2[prop]);
          }
          const newState = (0, import_utils.deepCloneUnfreeze)(state2);
          for (const key of Reflect.ownKeys(newState)) {
            localState[key] = newState[key];
          }
        }
        return state2[prop];
      },
      // If the user tries to set directly it will throw an error, only if we have unfrozen the state via commit
      // this will proceed to set the value
      set: (state2, prop, value) => {
        this.isUnfrozen();
        const old = state2[prop];
        state2[prop] = value;
        if (this.namespace) {
          prop = `${this.namespace}.${prop}`;
        }
        (this.rootStore || this).trigger("set", prop, value, old);
        return true;
      },
      // If the user tries to delete directly it will throw an error, only if we have unfrozen the state via commit
      // this will proceed to delete the property
      deleteProperty: (state2, prop) => {
        this.isUnfrozen();
        const old = state2[prop];
        Reflect.deleteProperty(state2, prop);
        if (this.namespace) {
          prop = `${this.namespace}.${prop}`;
        }
        (this.rootStore || this).trigger("delete", prop, old);
        return true;
      }
    });
    this.rootStore = rootStore || null;
    this.namespace = namespace || null;
    this.init = {
      frozen: true,
      plugins: [],
      modules: {},
      childModuleNamespaces: Object.keys(modules || {}),
      listeners: {
        set: [],
        delete: [],
        beforecommit: [],
        commit: [],
        beforedispatch: [],
        dispatch: [],
        getter: [],
        addlistener: [],
        removelistener: [],
        plugin: [],
        registerModule: [],
        unregisterModule: []
      },
      getters: getters || {},
      mutations: mutations || {},
      actions: actions || {}
    };
    this.getters = new Proxy(getters || {}, {
      // When we try to get a property of the getter we will call the original
      // getter method passing the state as first argument and the other getters as second
      // if we try to get a non existent getter it will fail silently as if
      // we were trying to get an undefined property
      get: (getters2, getter) => {
        try {
          const { store, key } = this.getStore(this, getter);
          if (store instanceof _FluxStore && store.init.getters[key]) {
            const value = store.init.getters[key](store.state, store.getters, this.state, this.getters);
            if (this.namespace) {
              getter = `${this.namespace}.${getter}`;
            }
            (this.rootStore || this).trigger("getter", getter, value);
            return value;
          }
        } catch (error) {
          return;
        }
      }
    });
    if (modules) {
      Object.keys(modules).forEach((namespace2) => {
        const n = this.namespace ? `${this.namespace}.${namespace2}` : namespace2;
        (this.rootStore || this).registerModule(n, modules[namespace2]);
      });
    }
  }
  keyExists(objectname, object, key) {
    if (!object[key]) {
      throw new Error(`The ${objectname} "${key}" does not exists.`);
    }
  }
  isFunction(type, callback) {
    if (typeof callback !== "function") {
      throw new Error(`You need to provide a valid function as ${type}.`);
    }
  }
  // Giving a dot based namespace this method will be used to find the module to be called
  getStore(store, namespace) {
    let key = namespace;
    if (key.indexOf(".") > -1) {
      const parts = key.split(".");
      key = parts.pop();
      const moduleName = parts.join(".");
      this.keyExists("module", store.init.modules, moduleName);
      store = store.init.modules[moduleName];
    }
    return {
      store,
      key
    };
  }
  isUnfrozen() {
    if (this.init.frozen) {
      throw new Error("You need to commit a mutation to change the state");
    }
  }
  // This method unfroze the state and process a mutation
  commit(mutation, ...args) {
    const { store, key } = this.getStore(this, mutation);
    this.keyExists("mutation", store.init.mutations, key);
    store.init.frozen = false;
    this.trigger("beforecommit", mutation, ...args);
    store.init.mutations[key](store.state, ...args);
    this.trigger("commit", mutation, ...args);
    store.init.frozen = true;
    (0, import_valyrian.debouncedUpdate)();
  }
  // This method will dispatch an action
  async dispatch(action, ...args) {
    const { store, key } = this.getStore(this, action);
    this.keyExists("action", store.init.actions, key);
    this.trigger("beforedispatch", action, ...args);
    try {
      const result = await store.init.actions[key](store, ...args);
      this.trigger("dispatch", action, ...args);
      return result;
    } finally {
      (0, import_valyrian.debouncedUpdate)();
    }
  }
  // This method will trigger an event
  trigger(event, ...args) {
    this.init.listeners[event].forEach((callback) => callback(this, ...args));
  }
  // This method will add a listener to the store
  on(event, listener, namespace) {
    this.isFunction("listener", listener);
    if (namespace) {
      const { store, key } = this.getStore(this, namespace);
      this.keyExists("event", store.init.listeners, event);
      if (store.init.listeners[event].indexOf(listener) === -1) {
        store.init.listeners[event].push(listener);
        this.trigger("addlistener", event, listener);
      }
      return () => this.off(event, listener);
    }
    this.keyExists("event", this.init.listeners, event);
    if (this.init.listeners[event].indexOf(listener) === -1) {
      this.init.listeners[event].push(listener);
      this.trigger("addlistener", event, listener);
    }
    return () => this.off(event, listener);
  }
  // Remove a listener from the store
  off(event, listener) {
    this.isFunction("listener", listener);
    this.keyExists("event", this.init.listeners, event);
    const index = this.init.listeners[event].indexOf(listener);
    if (index > -1) {
      this.init.listeners[event].splice(index, 1);
      this.trigger("removelistener", event, listener);
    }
  }
  // This method will add a plugin to the store
  use(plugin, ...options) {
    this.isFunction("plugin", plugin);
    if (this.init.plugins.indexOf(plugin) === -1) {
      plugin(this, ...options);
      this.init.plugins.push(plugin);
      this.trigger("plugin", plugin, ...options);
    }
  }
  // This method will register a module to the store
  registerModule(namespace, module2) {
    const rootStore = this;
    if (rootStore.init.modules[namespace]) {
      throw new Error(`A module with the namespace "${namespace}" is already registered.`);
    }
    const newStore = new _FluxStore({ ...module2, rootStore, namespace });
    rootStore.init.frozen = false;
    rootStore.init.modules[namespace] = newStore;
    rootStore.state[namespace] = newStore.state;
    rootStore.init.frozen = true;
    rootStore.trigger("registerModule", namespace, module2, newStore);
    (0, import_valyrian.debouncedUpdate)();
  }
  // This method will unregister a module from the store
  unregisterModule(namespace) {
    const rootStore = this;
    const store = rootStore.init.modules[namespace];
    if (store) {
      store.init.childModuleNamespaces.forEach((n) => rootStore.unregisterModule(`${namespace}.${n}`));
      rootStore.init.frozen = false;
      Reflect.deleteProperty(rootStore.init.modules, namespace);
      Reflect.deleteProperty(rootStore.state, namespace);
      rootStore.init.frozen = true;
      rootStore.trigger("unregisterModule", namespace, store);
      (0, import_valyrian.debouncedUpdate)();
    }
  }
};
