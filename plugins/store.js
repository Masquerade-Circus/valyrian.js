module.exports = (v) => {

  function keyExists(objectname, object, key) {
    if (!object[key]) {
      throw new Error(`The ${objectname} "${key}" does not exists.`);
    }
  };

  function deepFreeze(obj) {
    if (!Object.isFrozen(obj)) {
      Object.getOwnPropertyNames(obj).forEach(
        prop => typeof obj[prop] === 'object' && obj[prop] !== null && deepFreeze(obj[prop])
      );
      Object.freeze(obj);
    }

    return obj;
  };

  v.Store = function (options) {
    let { state, getters, actions, mutations } = Object.assign({
      state: {},
      getters: {},
      actions: {},
      mutations: {}
    }, options);
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
        } catch (error) {
        }
      }
    });

    this.commit = (mutation, ...args) => {
      keyExists('mutation', mutations, mutation);
      frozen = false;
      mutations[mutation](this.state, ...args);
      frozen = true;
      v.update();
    };

    this.dispatch = (action, ...args) => {
      keyExists('action', actions, action);
      return Promise.resolve(actions[action](this, ...args));
    };
  };
};