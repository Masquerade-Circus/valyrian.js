import { update } from "valyrian.js";

/* eslint-disable no-use-before-define */
interface Cleanup {
  (): void;
}

interface Subscription {
  // eslint-disable-next-line no-unused-vars
  (value: ProxySignal["value"]): void | Cleanup;
}

interface Subscriptions extends Map<Subscription, Cleanup> {}

interface Getter {
  // eslint-disable-next-line no-unused-vars
  (value: ProxySignal["value"]): any;
}

interface Getters {
  [key: string | symbol]: Getter;
}

interface ProxySignal {
  // Works as a getter of the value
  (): ProxySignal["value"];
  // Works as a subscription to the value
  // eslint-disable-next-line no-unused-vars
  (value: Subscription): ProxySignal;
  // Works as a setter with a path and a handler
  // eslint-disable-next-line no-unused-vars
  (path: string, handler: (valueAtPathPosition: any) => any): ProxySignal["value"];
  // Works as a setter with a path and a value
  // eslint-disable-next-line no-unused-vars
  (path: string, value: any): ProxySignal["value"];
  // Works as a setter with a value
  // eslint-disable-next-line no-unused-vars
  (value: any): ProxySignal["value"];
  // Gets the current value of the signal.
  value: any;
  // Cleanup function to be called to remove all subscriptions.
  cleanup: () => void;
  // Creates a getter on the signal.
  // eslint-disable-next-line no-unused-vars
  getter: (name: string, handler: Getter) => any;
  // To access the getters on the signal.
  [key: string | number | symbol]: any;
}

function makeUnsubscribe(
  subscriptions: Subscriptions,
  computed: ProxySignal,
  handler: Subscription,
  cleanup?: Cleanup
) {
  if (typeof cleanup === "function") {
    computed.cleanup = cleanup;
  }
  computed.unsubscribe = () => {
    subscriptions.delete(handler);
    computed?.cleanup();
  };
}

function createSubscription(signal: ProxySignal, subscriptions: Subscriptions, handler: Subscription) {
  if (subscriptions.has(handler) === false) {
    // eslint-disable-next-line no-use-before-define
    const computed = ProxySignal(() => handler(signal.value));
    const cleanup = computed(); // Execute to register itself
    makeUnsubscribe(subscriptions, computed, handler, cleanup);
    subscriptions.set(handler, computed);
  }

  return subscriptions.get(handler);
}

let updateTimeout: any;
function delayedUpdate() {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(update);
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function ProxySignal(value: any): ProxySignal {
  const subscriptions = new Map();
  const getters: Getters = {};

  let forceUpdate = false;

  const signal: ProxySignal = new Proxy(
    // eslint-disable-next-line no-unused-vars
    function (valOrPath?: any | Subscription, handler?: (valueAtPathPosition: any) => any) {
      // Works as a getter
      if (typeof valOrPath === "undefined") {
        return signal.value;
      }

      // Works as a subscription
      if (typeof valOrPath === "function") {
        return createSubscription(signal, subscriptions, valOrPath);
      }

      // Works as a setter with a path
      if (typeof valOrPath === "string" && typeof handler !== "undefined") {
        const parsed = valOrPath.split(".");
        let result = signal.value;
        let next;
        while (parsed.length) {
          next = parsed.shift() as string;
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

      // Works as a setter with a value
      signal.value = valOrPath;
      return signal.value;
    } as ProxySignal,
    {
      set(state, prop, val) {
        if (prop === "value" || prop === "unsubscribe" || prop === "cleanup") {
          const old = state[prop];
          state[prop] = val;
          if (prop === "value" && (forceUpdate || val !== old)) {
            forceUpdate = false;
            for (const [handler, computed] of subscriptions) {
              computed.cleanup();
              const cleanup = handler(val);
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
        // eslint-disable-next-line no-unused-vars
        for (const [handler, computed] of subscriptions) {
          computed.unsubscribe();
        }
      },
      writable: true,
      enumerable: true
    },
    getter: {
      value(name: string, handler: Getter) {
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
