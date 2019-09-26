let plugin = (v) => {
  let signals = new Map();

  function makeUnsubscribe(subscriptions, computed, handler, cleanUp) {
    if (typeof cleanUp === 'function') {
      computed.cleanUp = cleanUp;
    }
    computed.unsubscribe = () => {
      subscriptions.delete(handler);
      computed.cleanUp();
    };
  }

  function createGetter(signal, subscriptions, getters, nameOrHandler, getter) {
    if (typeof nameOrHandler === 'function') {
      if (subscriptions.has(nameOrHandler) === false) {
        let computed = v.Signal(() => nameOrHandler(signal.value));
        let cleanUp = computed(); // Execute to register itself
        makeUnsubscribe(subscriptions, computed, nameOrHandler, cleanUp);
        subscriptions.set(nameOrHandler, computed);
      }

      return subscriptions.get(nameOrHandler);
    }

    if (nameOrHandler in getters) {
      throw new Error('Named computed already exists.');
    }

    getters[nameOrHandler] = getter;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  v.Signal = function (value, key) {
    if (typeof key !== 'undefined' && signals.has(key)) {
      let signal = signals.get(key);
      signal.cleanUp();
      return signal;
    }

    let subscriptions = new Map();
    let getters = {};

    let forceUpdate = false;

    let signal = new Proxy(function (valOrPath, handler) {
      if (typeof valOrPath === 'undefined') {
        return signal.value;
      } else if (typeof valOrPath === 'function') {
        return createGetter(signal, subscriptions, getters, valOrPath);
      } else if (typeof valOrPath === 'string' && typeof handler !== 'undefined') {
        let parsed = valOrPath.split('.');
        let result = signal.value;
        let next;
        while (parsed.length) {
          next = parsed.shift();
          if (parsed.length > 0) {
            if (typeof result[next] !== 'object') {
              result[next] = {};
            }
            result = result[next];
          } else {
            result[next] = typeof handler === 'function' ? handler(result[next]) : handler;
          }
        }
        forceUpdate = true;
        signal.value = signal.value;
      } else {
        signal.value = valOrPath;
      }
    }, {
      set(state, prop, val) {
        if (prop === 'value' || prop === 'unsubscribe' || prop === 'cleanUp') {
          let old = state[prop];
          state[prop] = val;
          if (prop === 'value' && (forceUpdate || val !== old)) {
            forceUpdate = false;
            for (let [handler, computed] of subscriptions) {
              computed.cleanUp();
              let cleanUp = handler(val);
              makeUnsubscribe(subscriptions, computed, handler, cleanUp);
            }
          }
          return true;
        }
      },
      get(state, prop) {
        if (prop === 'value') {
          return typeof state.value === 'function' ? state.value() : state.value;
        }

        if (prop === 'cleanUp' || prop === 'unsubscribe' || prop === 'getter') {
          return state[prop];
        }

        if (prop in getters) {
          return getters[prop](state.value);
        }
      }
    });

    Object.defineProperties(signal, {
      value: {value, writable: true, enumerable: true},
      cleanUp: {
        value() {
          for (let [handler, computed] of subscriptions) {
            computed.unsubscribe();
          }
        },
        writable: true,
        enumerable: true
      },
      getter: {
        value(name, handler) {
          createGetter(signal, subscriptions, getters, name, handler);
        },
        enumerable: true
      }
    });

    if (typeof key !== 'undefined') {
      signals.set(key, signal);
    }

    return signal;
  };

};

export default plugin;
