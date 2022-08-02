// lib/signal/index.ts
function makeUnsubscribe(subscriptions, computed, handler, cleanup) {
  if (typeof cleanup === "function") {
    computed.cleanup = cleanup;
  }
  computed.unsubscribe = () => {
    subscriptions.delete(handler);
    computed?.cleanup();
  };
}
function createSubscription(signal, subscriptions, handler) {
  if (subscriptions.has(handler) === false) {
    let computed = Signal(() => handler(signal.value));
    let cleanup = computed();
    makeUnsubscribe(subscriptions, computed, handler, cleanup);
    subscriptions.set(handler, computed);
  }
  return subscriptions.get(handler);
}
function Signal(value) {
  let subscriptions = /* @__PURE__ */ new Map();
  let getters = {};
  let forceUpdate = false;
  let signal = new Proxy(
    function(valOrPath, handler) {
      if (typeof valOrPath === "undefined") {
        return signal.value;
      }
      if (typeof valOrPath === "function") {
        return createSubscription(signal, subscriptions, valOrPath);
      }
      if (typeof valOrPath === "string" && typeof handler !== "undefined") {
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
        return signal.value;
      }
      signal.value = valOrPath;
      return signal.value;
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
        return false;
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
        for (let [handler, computed] of subscriptions) {
          computed.unsubscribe();
        }
      },
      writable: true,
      enumerable: true
    },
    getter: {
      value(name, handler) {
        if (name in getters) {
          throw new Error("Named computed already exists.");
        }
        getters[name] = handler;
      },
      enumerable: true
    }
  });
  return signal;
}
export {
  Signal
};
