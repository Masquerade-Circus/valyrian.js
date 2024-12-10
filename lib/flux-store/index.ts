import { debouncedUpdate } from "valyrian.js";
import { deepCloneUnfreeze, deepFreeze } from "valyrian.js/utils";

interface StoreOptions {
  state?: Record<string, any> | (() => Record<string, any>);
  // eslint-disable-next-line no-unused-vars
  mutations?: Record<string, (state: Record<string, any>, ...args: any[]) => void>;
  // eslint-disable-next-line no-unused-vars, no-use-before-define
  actions?: Record<string, (store: FluxStore, ...args: any[]) => any>;
  getters?: Record<
    string,
    // eslint-disable-next-line no-unused-vars
    (state: Record<string, any>, getters: Record<string, any>, globalState?: any, globalGetters?: any) => any
  >;
  modules?: Record<string, StoreOptions>;
  shouldFreeze?: boolean;
  namespace?: string;
  // eslint-disable-next-line no-use-before-define
  rootStore?: FluxStore;
}

// This is the store entity
export class FluxStore {
  public state: Record<string, any>;
  public getters: Record<string, any>;
  private init: {
    frozen: boolean;
    plugins: Function[];
    // eslint-disable-next-line no-use-before-define
    modules: Record<string, FluxStore>;
    childModuleNamespaces: string[];
    listeners: Record<string, Function[]>;
    getters: StoreOptions["getters"];
    mutations: StoreOptions["mutations"];
    actions: StoreOptions["actions"];
  };
  // eslint-disable-next-line no-use-before-define
  public rootStore: FluxStore | null;
  public namespace: string | null;

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
  }: StoreOptions = {}) {
    // Initialize the localState for this store
    const localState = typeof state === "function" ? state() : state;

    // We create a proxy for the state
    this.state = new Proxy(localState || {}, {
      // Every time we try to access a property from the state we try to deep freeze the property
      // to prevent direct modifications to the state
      get: (state, prop: string) => {
        if ((this.rootStore || this).init.modules[prop]) {
          return state[prop];
        }
        if (shouldFreeze) {
          // We are accessing a property from outside the store
          if (this.init.frozen) {
            return deepFreeze(state[prop]);
          }

          // We are accessing a property from inside the store
          // So we need to unfreeze the state
          const newState = deepCloneUnfreeze(state);
          for (const key of Reflect.ownKeys(newState)) {
            localState[key] = newState[key];
          }
        }
        return state[prop];
      },
      // If the user tries to set directly it will throw an error, only if we have unfrozen the state via commit
      // this will proceed to set the value
      set: (state, prop: string, value: any) => {
        this.isUnfrozen();
        const old = state[prop];
        state[prop] = value;
        if (this.namespace) {
          prop = `${this.namespace}.${prop}`;
        }
        (this.rootStore || this).trigger("set", prop, value, old);
        return true;
      },
      // If the user tries to delete directly it will throw an error, only if we have unfrozen the state via commit
      // this will proceed to delete the property
      deleteProperty: (state, prop: string) => {
        this.isUnfrozen();
        const old = state[prop];
        Reflect.deleteProperty(state, prop);
        if (this.namespace) {
          prop = `${this.namespace}.${prop}`;
        }
        (this.rootStore || this).trigger("delete", prop, old);
        return true;
      }
    });

    // If this is a store been attached to another store
    // this will have the rootStore for future reference
    this.rootStore = rootStore || null;

    // If this is a store been attached to another store
    // this will have the namespace attached
    this.namespace = namespace || null;

    // We initialize the store with the initial values
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

    // We create a proxy for the getters
    this.getters = new Proxy(getters || {}, {
      // When we try to get a property of the getter we will call the original
      // getter method passing the state as first argument and the other getters as second
      // if we try to get a non existent getter it will fail silently as if
      // we were trying to get an undefined property
      get: (getters, getter: string) => {
        try {
          const { store, key } = this.getStore(this, getter);
          if (store instanceof FluxStore && store.init.getters![key]) {
            const value = store.init.getters![key](store.state, store.getters, this.state, this.getters);
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

    // Finally we attach the initial modules
    if (modules) {
      Object.keys(modules).forEach((namespace) => {
        const n = this.namespace ? `${this.namespace}.${namespace}` : namespace;
        (this.rootStore || this).registerModule(n, modules[namespace]);
      });
    }
  }

  private keyExists(objectname: string, object: Record<string, any>, key: string) {
    if (!object[key]) {
      throw new Error(`The ${objectname} "${key}" does not exists.`);
    }
  }

  private isFunction(type: string, callback: Function) {
    if (typeof callback !== "function") {
      throw new Error(`You need to provide a valid function as ${type}.`);
    }
  }

  // Giving a dot based namespace this method will be used to find the module to be called
  private getStore(store: FluxStore, namespace: string) {
    let key = namespace;
    if (key.indexOf(".") > -1) {
      const parts = key.split(".");
      key = parts.pop()!;
      const moduleName = parts.join(".");
      this.keyExists("module", store.init.modules, moduleName);
      store = store.init.modules[moduleName];
    }
    return {
      store,
      key
    };
  }

  private isUnfrozen() {
    if (this.init.frozen) {
      throw new Error("You need to commit a mutation to change the state");
    }
  }

  // This method unfroze the state and process a mutation
  public commit(mutation: string, ...args: any[]) {
    const { store, key } = this.getStore(this, mutation);
    this.keyExists("mutation", store.init.mutations!, key);
    store.init.frozen = false;
    this.trigger("beforecommit", mutation, ...args);
    store.init.mutations![key](store.state, ...args);
    this.trigger("commit", mutation, ...args);
    store.init.frozen = true;

    // We call the debounced update to notify the changes
    debouncedUpdate();
  }

  // This method will dispatch an action
  public async dispatch(action: string, ...args: any[]): Promise<any> {
    const { store, key } = this.getStore(this, action);
    this.keyExists("action", store.init.actions!, key);
    this.trigger("beforedispatch", action, ...args);
    try {
      const result = await store.init.actions![key](store, ...args);
      this.trigger("dispatch", action, ...args);
      return result;
    } finally {
      debouncedUpdate();
    }
  }

  // This method will trigger an event
  public trigger(event: string, ...args: any[]) {
    this.init.listeners[event].forEach((callback) => callback(this, ...args));
  }

  // This method will add a listener to the store
  public on(event: string, listener: Function) {
    this.isFunction("listener", listener);
    this.keyExists("event", this.init.listeners, event);
    if (this.init.listeners[event].indexOf(listener) === -1) {
      this.init.listeners[event].push(listener);
      this.trigger("addlistener", event, listener);
    }
    return () => this.off(event, listener);
  }

  // Remove a listener from the store
  public off(event: string, listener: Function) {
    this.isFunction("listener", listener);
    this.keyExists("event", this.init.listeners, event);
    const index = this.init.listeners[event].indexOf(listener);
    if (index > -1) {
      this.init.listeners[event].splice(index, 1);
      this.trigger("removelistener", event, listener);
    }
  }

  // This method will add a plugin to the store
  public use(plugin: Function, ...options: any[]) {
    this.isFunction("plugin", plugin);
    if (this.init.plugins.indexOf(plugin) === -1) {
      plugin(this, ...options);
      this.init.plugins.push(plugin);
      this.trigger("plugin", plugin, ...options);
    }
  }

  // This method will register a module to the store
  public registerModule(namespace: string, module: StoreOptions) {
    const rootStore = this;
    if (rootStore.init.modules[namespace]) {
      throw new Error(`A module with the namespace "${namespace}" is already registered.`);
    }
    const newStore = new FluxStore({ ...module, rootStore, namespace });
    rootStore.init.frozen = false;
    rootStore.init.modules[namespace] = newStore;
    rootStore.state[namespace] = newStore.state;
    rootStore.init.frozen = true;
    rootStore.trigger("registerModule", namespace, module, newStore);

    // We call the debounced update to notify the changes
    debouncedUpdate();
  }

  // This method will unregister a module from the store
  public unregisterModule(namespace: string) {
    const rootStore = this;
    const store = rootStore.init.modules[namespace];
    if (store) {
      store.init.childModuleNamespaces.forEach((n) => rootStore.unregisterModule(`${namespace}.${n}`));
      rootStore.init.frozen = false;
      Reflect.deleteProperty(rootStore.init.modules, namespace);
      Reflect.deleteProperty(rootStore.state, namespace);
      rootStore.init.frozen = true;
      rootStore.trigger("unregisterModule", namespace, store);

      // We call the debounced update to notify the changes
      debouncedUpdate();
    }
  }
}
