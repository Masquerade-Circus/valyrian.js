// lib/offline/index.ts
import { NetworkEvent } from "valyrian.js/network";
import { createNativeStore, StorageType } from "valyrian.js/native-store";
import { isString } from "valyrian.js/utils";
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function toErrorMessage(error) {
  if (isString(error)) {
    return error;
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return "Unknown error";
}
function calculateBackoffDelay(retries, backoff = {}) {
  const strategy = backoff.strategy || "exponential";
  const baseMs = backoff.baseMs ?? 1e3;
  const maxMs = backoff.maxMs ?? 3e4;
  if (strategy === "linear") {
    return Math.min(maxMs, baseMs * retries);
  }
  return Math.min(maxMs, baseMs * Math.pow(2, retries - 1));
}
function cloneState(state) {
  return Object.freeze({ ...state });
}
var OfflineQueue = class {
  #network;
  #maxRetries;
  #retryable;
  #backoff;
  #handler;
  #offOnline = null;
  #store;
  #pending;
  #failed;
  #state;
  #listeners = {
    change: /* @__PURE__ */ new Set(),
    "sync:success": /* @__PURE__ */ new Set(),
    "sync:error": /* @__PURE__ */ new Set()
  };
  constructor(options) {
    if (!options.network) {
      throw new TypeError("OfflineQueue requires options.network");
    }
    this.#network = options.network;
    this.#maxRetries = options.maxRetries ?? 5;
    this.#retryable = options.isRetryable || (() => true);
    this.#backoff = options.backoff || {};
    this.#handler = options.handler;
    const storageType = options.storage === "session" ? StorageType.Session : StorageType.Local;
    this.#store = createNativeStore(options.id, {}, storageType, true);
    this.#pending = this.#store.get("pending") || [];
    this.#failed = this.#store.get("failed") || [];
    this.#state = {
      pending: this.#pending.length,
      failed: this.#failed.length,
      syncing: false,
      lastSyncAt: this.#store.get("lastSyncAt") || null,
      lastError: this.#store.get("lastError") || null
    };
    this.#offOnline = this.#network.on(NetworkEvent.ONLINE, () => {
      void this.sync();
    });
  }
  #emit(event, payload) {
    for (const listener of this.#listeners[event]) {
      listener(payload);
    }
    if (event !== "change") {
      const stateSnapshot = cloneState(this.#state);
      for (const listener of this.#listeners.change) {
        listener(stateSnapshot);
      }
    }
  }
  #persist() {
    this.#store.set("pending", this.#pending);
    this.#store.set("failed", this.#failed);
    this.#store.set("lastSyncAt", this.#state.lastSyncAt);
    this.#store.set("lastError", this.#state.lastError);
    this.#state.pending = this.#pending.length;
    this.#state.failed = this.#failed.length;
  }
  #createId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  async #syncOne(operation) {
    try {
      await this.#handler(operation);
      return { ok: true };
    } catch (error) {
      operation.retries += 1;
      operation.lastError = toErrorMessage(error);
      if (!this.#retryable(error) || operation.retries > this.#maxRetries) {
        return { ok: false, failed: true, error };
      }
      const delay = calculateBackoffDelay(operation.retries, this.#backoff);
      await sleep(delay);
      return { ok: false, failed: false, error };
    }
  }
  state() {
    return cloneState(this.#state);
  }
  pending() {
    return this.#pending.map((operation) => ({ ...operation }));
  }
  failed() {
    return this.#failed.map((operation) => ({ ...operation }));
  }
  enqueue(operation) {
    this.#pending.push({
      ...operation,
      id: this.#createId(),
      createdAt: Date.now(),
      retries: 0
    });
    this.#persist();
    this.#emit("change", cloneState(this.#state));
  }
  async sync() {
    if (this.#state.syncing) {
      return;
    }
    if (!this.#network.getNetworkStatus().online) {
      return;
    }
    this.#state.syncing = true;
    this.#emit("change", cloneState(this.#state));
    try {
      while (this.#pending.length > 0) {
        const operation = this.#pending[0];
        const result = await this.#syncOne(operation);
        if (result.ok) {
          this.#pending.shift();
          this.#state.lastError = null;
          this.#state.lastSyncAt = Date.now();
          this.#persist();
          this.#emit("sync:success", { ...operation });
          continue;
        }
        if (result.failed) {
          this.#pending.shift();
          this.#failed.push(operation);
          this.#state.lastError = operation.lastError || null;
          this.#persist();
          this.#emit("sync:error", { operation: { ...operation }, error: result.error });
          continue;
        }
        this.#state.lastError = operation.lastError || null;
        this.#persist();
        break;
      }
    } finally {
      this.#state.syncing = false;
      this.#persist();
      this.#emit("change", cloneState(this.#state));
    }
  }
  retryOne(id) {
    const index = this.#failed.findIndex((operation2) => operation2.id === id);
    if (index === -1) {
      return;
    }
    const operation = this.#failed.splice(index, 1)[0];
    operation.retries = 0;
    this.#pending.push(operation);
    this.#persist();
    this.#emit("change", cloneState(this.#state));
  }
  retryAll() {
    while (this.#failed.length > 0) {
      const operation = this.#failed.shift();
      if (!operation) {
        continue;
      }
      operation.retries = 0;
      this.#pending.push(operation);
    }
    this.#persist();
    this.#emit("change", cloneState(this.#state));
  }
  discardFailed() {
    this.#failed.splice(0, this.#failed.length);
    this.#persist();
    this.#emit("change", cloneState(this.#state));
  }
  on(event, callback) {
    this.#listeners[event].add(callback);
    return () => this.off(event, callback);
  }
  off(event, callback) {
    this.#listeners[event].delete(callback);
  }
  destroy() {
    this.#offOnline?.();
    this.#offOnline = null;
    this.#listeners.change.clear();
    this.#listeners["sync:success"].clear();
    this.#listeners["sync:error"].clear();
  }
};
export {
  OfflineQueue
};
