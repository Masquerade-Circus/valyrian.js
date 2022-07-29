import { Valyrian } from "Valyrian";

interface StoreOptions {
  state?: Record<string, unknown> | (() => Record<string, unknown>);
  getters?: Record<string, Function>;
  mutations?: Record<string, Function>;
  actions?: Record<string, Function>;
}

interface StoreInstance {
  // eslint-disable-next-line no-unused-vars
  new (options: StoreOptions): StoreInstance;
  state: Record<string, any>;
  getters?: Record<string, any>;
  // eslint-disable-next-line no-unused-vars
  commit: (type: string, ...payload: any[]) => void;
  // eslint-disable-next-line no-unused-vars
  dispatch: (type: string, ...payload: any[]) => void;
}

declare module "Valyrian" {
  // eslint-disable-next-line no-unused-vars
  interface Valyrian {
    store?: StoreInstance;
    commit?: StoreInstance["commit"];
    dispatch?: StoreInstance["dispatch"];
    state?: StoreInstance["state"];
    getters?: StoreInstance["getters"];
  }
}

let localValyrian: Valyrian = {
  update: () => {}
} as unknown as Valyrian;

function keyExists(typeOfKey: string, object: Record<string, unknown>, key: string) {
  if (key in object === false) {
    throw new Error(`The ${typeOfKey} "${key}" does not exists.`);
  }
}

function deepFreeze(obj: any) {
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

export const Store = function Store(this: StoreInstance, { state = {}, getters = {}, actions = {}, mutations = {} }: StoreOptions = {}) {
  let frozen = true;

  function isUnfrozen() {
    if (frozen) {
      throw new Error("You need to commit a mutation to change the state");
    }
  }

  let localState = typeof state === "function" ? state() : state;

  this.state = new Proxy(localState || {}, {
    get: (state, prop: string) => deepFreeze(state[prop]),
    set: (state, prop: string, value: any) => {
      isUnfrozen();
      state[prop] = value;
      return true;
    },
    deleteProperty: (state, prop: string) => {
      isUnfrozen();
      Reflect.deleteProperty(state, prop);
      return true;
    }
  });

  this.getters = new Proxy(getters, {
    get: (getters, getter: string) => {
      try {
        return getters[getter](this.state, this.getters);
      } catch (e) {
        // Getters should fail silently
      }
    }
  });

  this.commit = (mutation, ...args) => {
    keyExists("mutation", mutations, mutation);
    frozen = false;
    mutations[mutation](this.state, ...args);
    frozen = true;
    localValyrian.update();
  };

  this.dispatch = (action, ...args) => {
    keyExists("action", actions, action);
    return Promise.resolve(actions[action](this, ...args));
  };
} as unknown as StoreInstance;

function plugin(v: Valyrian, optionsOrStore?: StoreOptions | StoreInstance) {
  localValyrian = v;
  if (optionsOrStore) {
    v.store = optionsOrStore instanceof Store ? optionsOrStore : new Store(optionsOrStore);
    v.commit = v.store.commit.bind(v.store);
    v.dispatch = v.store.dispatch.bind(v.store);
    v.state = v.store.state;
    v.getters = v.store.getters;
  }
  return Store;
}

export default plugin;
