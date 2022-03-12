let update = () => {};
let current = {};

function keyExists(objectname, object, key) {
  if (key in object === false) {
    throw new Error(`The ${objectname} "${key}" does not exists.`);
  }
}

function deepFreeze(obj) {
  if (typeof obj === "object" && obj !== null && !Object.isFrozen(obj)) {
    if (Array.isArray(obj)) {
      for (let i = 0, l = obj.length; i < l; i++) {
        deepFreeze(obj[i]);
      }
    } else {
      for (let prop in obj) {
        deepFreeze(obj[prop]);
      }
    }
    Object.freeze(obj);
  }

  return obj;
}

function Store({ state = {}, getters = {}, actions = {}, mutations = {} } = {}) {
  let frozen = true;

  function isUnfrozen() {
    if (frozen) {
      throw new Error("You need to commit a mutation to change the state");
    }
  }

  let localState = typeof state === "function" ? state() : state;

  this.state = new Proxy(localState || {}, {
    get: (state, prop) => deepFreeze(state[prop]),
    set: (state, prop, value) => {
      isUnfrozen();
      state[prop] = value;
      return true;
    },
    deleteProperty: (state, prop) => {
      isUnfrozen();
      delete state[prop];
      return true;
    }
  });

  this.getters = new Proxy(getters, {
    get: (getters, getter) => {
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
    update();
  };

  this.dispatch = (action, ...args) => {
    keyExists("action", actions, action);
    return Promise.resolve(actions[action](this, ...args));
  };
}

function plugin(v, options) {
  current = v.current;
  update = () => {
    if (current.app) {
      v.update(v.current.app.component);
    }
  };

  if (options) {
    v.store = new Store(options);
    v.commit = v.store.commit.bind(v.store);
    v.dispatch = v.store.dispatch.bind(v.store);
    v.state = v.store.state;
    v.getters = v.store.getters;
  }
}

plugin.Store = Store;
plugin.default = plugin;
module.exports = plugin;
