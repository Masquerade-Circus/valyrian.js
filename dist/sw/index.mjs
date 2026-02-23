// lib/sw/index.ts
import { isNodeJs } from "valyrian.js";
import { isFunction } from "valyrian.js/utils";
function cloneState(state) {
  return Object.freeze({ ...state });
}
function hasServiceWorker(navigatorRef) {
  return Boolean(navigatorRef && "serviceWorker" in navigatorRef);
}
async function registerSw(file = "./sw.js", options = { scope: "/" }, navigatorRef = globalThis.navigator || null) {
  if (!hasServiceWorker(navigatorRef)) {
    return;
  }
  return navigatorRef.serviceWorker.register(file, options);
}
var SwRuntimeManager = class {
  #swUrl;
  #scope;
  #strategy;
  #isNodeRuntime;
  #navigator;
  #window;
  #state = {
    updateAvailable: false,
    installing: false,
    registration: null,
    waiting: null
  };
  #listeners = {
    registered: /* @__PURE__ */ new Set(),
    updateavailable: /* @__PURE__ */ new Set(),
    updated: /* @__PURE__ */ new Set(),
    error: /* @__PURE__ */ new Set()
  };
  #controllerChangeHandler = () => {
    this.#state.updateAvailable = false;
    this.#state.waiting = null;
    this.#emit("updated");
    if (this.#strategy !== "manual" && isFunction(this.#window?.location?.reload)) {
      this.#window.location.reload();
    }
  };
  constructor(options = {}) {
    const runtime = options.runtime || {};
    this.#swUrl = options.swUrl || "./sw.js";
    this.#scope = options.scope || "/";
    this.#strategy = options.strategy || "prompt-user";
    this.#isNodeRuntime = runtime.isNodeJs ?? isNodeJs;
    this.#navigator = runtime.navigator ?? globalThis.navigator ?? null;
    this.#window = runtime.window ?? globalThis.window ?? null;
  }
  get state() {
    return cloneState(this.#state);
  }
  on(event, callback) {
    this.#listeners[event].add(callback);
    return () => this.off(event, callback);
  }
  off(event, callback) {
    this.#listeners[event].delete(callback);
  }
  #emit(event, payload) {
    for (const callback of this.#listeners[event]) {
      callback(payload);
    }
  }
  #isSupported() {
    return !this.#isNodeRuntime && hasServiceWorker(this.#navigator);
  }
  async init() {
    if (!this.#isSupported()) {
      return this;
    }
    try {
      const registration = await registerSw(this.#swUrl, { scope: this.#scope }, this.#navigator);
      if (!registration) {
        return this;
      }
      this.#state.registration = registration;
      this.#state.waiting = registration.waiting || null;
      this.#state.updateAvailable = Boolean(registration.waiting);
      this.#emit("registered", registration);
      if (this.#strategy === "auto" && this.#state.waiting) {
        this.applyUpdate();
      }
      registration.addEventListener("updatefound", () => {
        this.#state.installing = true;
        const installing = registration.installing;
        if (!installing) {
          return;
        }
        installing.addEventListener("statechange", () => {
          if (installing.state !== "installed") {
            return;
          }
          this.#state.installing = false;
          const serviceWorker = this.#navigator?.serviceWorker;
          if (serviceWorker?.controller) {
            this.#state.waiting = registration.waiting || installing;
            this.#state.updateAvailable = true;
            this.#emit("updateavailable", { waiting: this.#state.waiting });
            if (this.#strategy === "auto") {
              this.applyUpdate();
            }
          }
        });
      });
      this.#navigator.serviceWorker.addEventListener("controllerchange", this.#controllerChangeHandler);
    } catch (error) {
      this.#emit("error", error);
    }
    return this;
  }
  applyUpdate() {
    if (!this.#state.waiting) {
      return;
    }
    this.#state.waiting.postMessage({ type: "SKIP_WAITING" });
  }
  async checkForUpdate() {
    if (!this.#state.registration) {
      return;
    }
    await this.#state.registration.update();
  }
  async unregister() {
    if (!this.#state.registration) {
      return false;
    }
    if (this.#isSupported()) {
      const serviceWorker = this.#navigator.serviceWorker;
      if (isFunction(serviceWorker.removeEventListener)) {
        serviceWorker.removeEventListener("controllerchange", this.#controllerChangeHandler);
      }
    }
    return this.#state.registration.unregister();
  }
};
export {
  SwRuntimeManager,
  registerSw
};
