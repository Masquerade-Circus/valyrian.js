// lib/network/index.ts
import { isNodeJs } from "valyrian.js";
import { isFiniteNumber, isFunction, isString } from "valyrian.js/utils";
var NetworkEvent = /* @__PURE__ */ ((NetworkEvent2) => {
  NetworkEvent2["ONLINE"] = "online";
  NetworkEvent2["OFFLINE"] = "offline";
  NetworkEvent2["CHANGE"] = "change";
  return NetworkEvent2;
})(NetworkEvent || {});
var SignalLevel = /* @__PURE__ */ ((SignalLevel2) => {
  SignalLevel2[SignalLevel2["None"] = 0] = "None";
  SignalLevel2[SignalLevel2["Poor"] = 1] = "Poor";
  SignalLevel2[SignalLevel2["Fair"] = 2] = "Fair";
  SignalLevel2[SignalLevel2["Good"] = 3] = "Good";
  SignalLevel2[SignalLevel2["Excellent"] = 4] = "Excellent";
  return SignalLevel2;
})(SignalLevel || {});
var NetworkError = class extends Error {
};
var NetworkManager = class {
  #onlineListeners = /* @__PURE__ */ new Set();
  #offlineListeners = /* @__PURE__ */ new Set();
  #changeListeners = /* @__PURE__ */ new Set();
  #isNodeRuntime;
  #navigator;
  #window;
  #onlineHandler = () => this.notifyListeners("online" /* ONLINE */);
  #offlineHandler = () => this.notifyListeners("offline" /* OFFLINE */);
  #changeHandler = () => this.notifyListeners("change" /* CHANGE */);
  NetworkEvent = NetworkEvent;
  constructor(options = {}) {
    const runtime = options.runtime || {};
    this.#isNodeRuntime = runtime.isNodeJs ?? isNodeJs;
    this.#navigator = runtime.navigator ?? (globalThis.navigator || null);
    this.#window = runtime.window ?? (globalThis.window || null);
    if (this.#isNodeRuntime || !this.#window || !this.#navigator) {
      return;
    }
    if (isFunction(this.#window.addEventListener)) {
      this.#window.addEventListener("online" /* ONLINE */, this.#onlineHandler);
      this.#window.addEventListener("offline" /* OFFLINE */, this.#offlineHandler);
    }
    try {
      const connection = this.getConnection();
      if (isFunction(connection.addEventListener)) {
        connection.addEventListener("change" /* CHANGE */, this.#changeHandler);
      }
    } catch {
    }
  }
  getConnection() {
    if (!this.#navigator) {
      throw new NetworkError("Navigator not available");
    }
    const connection = this.#navigator.connection || this.#navigator.mozConnection || this.#navigator.webkitConnection;
    if (!connection) {
      throw new NetworkError("Connection not available");
    }
    return connection;
  }
  getNetworkStatus() {
    if (this.#isNodeRuntime || !this.#navigator) {
      return { online: true };
    }
    const online = this.#navigator.onLine;
    try {
      const connection = this.getConnection();
      return {
        online,
        effectiveType: isString(connection.effectiveType) ? connection.effectiveType : void 0,
        downlink: isFiniteNumber(connection.downlink) ? connection.downlink : void 0,
        rtt: isFiniteNumber(connection.rtt) ? connection.rtt : void 0,
        saveData: connection.saveData === true
      };
    } catch {
      return { online };
    }
  }
  getSignalLevel() {
    const status = this.getNetworkStatus();
    if (!status.online) {
      return 0 /* None */;
    }
    if (status.effectiveType === "slow-2g") {
      return 0 /* None */;
    }
    if (!status.effectiveType) {
      return 3 /* Good */;
    }
    if (status.effectiveType === "4g") {
      if (isFiniteNumber(status.downlink) && status.downlink > 5 && isFiniteNumber(status.rtt) && status.rtt < 100) {
        return 4 /* Excellent */;
      }
      if (isFiniteNumber(status.downlink) && status.downlink >= 2) {
        return 3 /* Good */;
      }
      return 2 /* Fair */;
    }
    if (status.effectiveType === "3g") {
      if (isFiniteNumber(status.downlink) && status.downlink >= 1) {
        return 2 /* Fair */;
      }
      return 1 /* Poor */;
    }
    return 1 /* Poor */;
  }
  isConnectionPoor() {
    return this.getSignalLevel() === 0 /* None */;
  }
  getStatus() {
    return this.getNetworkStatus();
  }
  notifyListeners(event) {
    const status = this.getNetworkStatus();
    const listeners = this.getListeners(event);
    for (const listener of listeners) {
      listener(status);
    }
  }
  getListeners(event) {
    switch (event) {
      case "online" /* ONLINE */:
        return this.#onlineListeners;
      case "offline" /* OFFLINE */:
        return this.#offlineListeners;
      case "change" /* CHANGE */:
        return this.#changeListeners;
      default:
        throw new NetworkError("Invalid event type");
    }
  }
  on(event, listener) {
    this.getListeners(event).add(listener);
    return () => this.off(event, listener);
  }
  off(event, listener) {
    this.getListeners(event).delete(listener);
  }
  destroy() {
    if (!this.#isNodeRuntime) {
      if (this.#window && isFunction(this.#window.removeEventListener)) {
        this.#window.removeEventListener("online" /* ONLINE */, this.#onlineHandler);
        this.#window.removeEventListener("offline" /* OFFLINE */, this.#offlineHandler);
      }
      try {
        const connection = this.getConnection();
        if (isFunction(connection.removeEventListener)) {
          connection.removeEventListener("change" /* CHANGE */, this.#changeHandler);
        }
      } catch {
      }
    }
    this.#onlineListeners.clear();
    this.#offlineListeners.clear();
    this.#changeListeners.clear();
  }
};
export {
  NetworkError,
  NetworkEvent,
  NetworkManager,
  SignalLevel
};
