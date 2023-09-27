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

// lib/proxy-signal/index.ts
var proxy_signal_exports = {};
__export(proxy_signal_exports, {
  ProxySignal: () => ProxySignal
});
module.exports = __toCommonJS(proxy_signal_exports);
var import_valyrian = require("valyrian.js");
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
    let computed = ProxySignal(() => handler(signal.value));
    let cleanup = computed();
    makeUnsubscribe(subscriptions, computed, handler, cleanup);
    subscriptions.set(handler, computed);
  }
  return subscriptions.get(handler);
}
var updateTimeout;
function delayedUpdate() {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(import_valyrian.update);
}
function ProxySignal(value) {
  let subscriptions = /* @__PURE__ */ new Map();
  let getters = {};
  let forceUpdate = false;
  let signal = new Proxy(
    // eslint-disable-next-line no-unused-vars
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
            delayedUpdate();
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
