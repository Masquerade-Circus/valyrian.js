let plugin = (v) => {

  function keyExists(objectname, object, key) {
    if (key in object === false) {
      throw new Error(`The ${objectname} "${key}" does not exists.`);
    }
  };

  function deepFreeze(obj) {
    if (typeof obj === 'object' && obj !== null && !Object.isFrozen(obj)) {
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
  };

  v.Store = function ({ state = {}, getters = {}, actions = {}, mutations = {} } = {}) {
    let frozen = true;

    function isUnfrozen() {
      if (frozen) {
        throw new Error('You need to commit a mutation to change the state');
      }
    };

    let localState = typeof state === 'function' ? state() : state;

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
        }
      }
    });

    this.commit = (mutation, ...args) => {
      keyExists('mutation', mutations, mutation);
      frozen = false;
      mutations[mutation](this.state, ...args);
      frozen = true;
      v.isMounted && v.update();
    };

    this.dispatch = (action, ...args) => {
      keyExists('action', actions, action);
      return Promise.resolve(actions[action](this, ...args));
    };
  };

  v.useStore = (store) => v.$store = store instanceof v.Store ? store : new v.Store(store);
};

export default plugin;
