let signals = new Map();

function makeUnsubscribe(subscriptions, computed, handler, cleanup) {
  if (typeof cleanup === "function") {
    computed.cleanup = cleanup;
  }
  computed.unsubscribe = () => {
    subscriptions.delete(handler);
    computed.cleanup();
  };
}

function createGetter(signal, subscriptions, getters, nameOrHandler, getter) {
  if (typeof nameOrHandler === "function") {
    if (subscriptions.has(nameOrHandler) === false) {
      // eslint-disable-next-line no-use-before-define
      let computed = Signal(() => nameOrHandler(signal.value));
      let cleanup = computed(); // Execute to register itself
      makeUnsubscribe(subscriptions, computed, nameOrHandler, cleanup);
      subscriptions.set(nameOrHandler, computed);
    }

    return subscriptions.get(nameOrHandler);
  }

  if (nameOrHandler in getters) {
    throw new Error("Named computed already exists.");
  }

  getters[nameOrHandler] = getter;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
function Signal(value, key) {
  if (typeof key !== "undefined" && signals.has(key)) {
    let signal = signals.get(key);
    signal.cleanup();
    return signal;
  }

  let subscriptions = new Map();
  let getters = {};

  let forceUpdate = false;

  let signal = new Proxy(
    function (valOrPath, handler) {
      if (typeof valOrPath === "undefined") {
        return signal.value;
      } else if (typeof valOrPath === "function") {
        return createGetter(signal, subscriptions, getters, valOrPath);
      } else if (typeof valOrPath === "string" && typeof handler !== "undefined") {
        let parsed = valOrPath.split(".");
        let result = signal.value;
        let next;
        while (parsed.length) {
          next = parsed.shift();
          if (parsed.length > 0) {
            if (typeof result[next] !== "object") {
              result[next] = {};
            }
            result = result[next];
          } else {
            result[next] = typeof handler === "function" ? handler(result[next]) : handler;
          }
        }
        forceUpdate = true;
        signal.value = signal.value;
      } else {
        signal.value = valOrPath;
      }
    },
    {
      set(state, prop, val) {
        if (prop === "value" || prop === "unsubscribe" || prop === "cleanup") {
          let old = state[prop];
          state[prop] = val;
          if (prop === "value" && (forceUpdate || val !== old)) {
            forceUpdate = false;
            for (let [handler, computed] of subscriptions) {
              computed.cleanup();
              let cleanup = handler(val);
              makeUnsubscribe(subscriptions, computed, handler, cleanup);
            }
          }
          return true;
        }
      },
      get(state, prop) {
        if (prop === "value") {
          return typeof state.value === "function" ? state.value() : state.value;
        }

        if (prop === "cleanup" || prop === "unsubscribe" || prop === "getter") {
          return state[prop];
        }

        if (prop in getters) {
          return getters[prop](state.value);
        }
      }
    }
  );

  Object.defineProperties(signal, {
    value: { value, writable: true, enumerable: true },
    cleanup: {
      value() {
        // eslint-disable-next-line no-unused-vars
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

  if (typeof key !== "undefined") {
    signals.set(key, signal);
  }

  return signal;
}

Signal.default = Signal;
module.exports = Signal;
