// lib/query/index.ts
import { createNativeStore, StorageType } from "valyrian.js/native-store";
function hashKey(key) {
  return JSON.stringify(key);
}
function keyStartsWith(key, partial) {
  if (partial.length > key.length) {
    return false;
  }
  for (let i = 0; i < partial.length; i++) {
    if (JSON.stringify(key[i]) !== JSON.stringify(partial[i])) {
      return false;
    }
  }
  return true;
}
function cloneState(state) {
  return Object.freeze({ ...state });
}
function isQueryStatus(value) {
  return value === "idle" || value === "loading" || value === "success" || value === "error";
}
function normalizePersistedState(state) {
  const source = state && typeof state === "object" ? state : {};
  const hasError = source.error !== null && typeof source.error !== "undefined";
  const status = isQueryStatus(source.status) ? source.status === "loading" ? "idle" : source.status : source.success ? "success" : hasError ? "error" : "idle";
  return {
    status,
    loading: false,
    success: status === "success",
    error: status === "error" ? source.error ?? null : null,
    data: "data" in source ? source.data ?? null : null,
    updatedAt: typeof source.updatedAt === "number" ? source.updatedAt : 0
  };
}
var QueryHandle = class {
  #entry;
  #fetch;
  #invalidate;
  constructor(entry, fetch, invalidate) {
    this.#entry = entry;
    this.#fetch = fetch;
    this.#invalidate = invalidate;
  }
  get key() {
    return this.#entry.key;
  }
  get state() {
    return cloneState(this.#entry.state);
  }
  get data() {
    return this.#entry.state.data;
  }
  fetch() {
    return this.#fetch();
  }
  invalidate() {
    this.#invalidate();
  }
};
var MutationHandle = class {
  #state;
  #execute;
  #reset;
  constructor(state, execute, reset) {
    this.#state = state;
    this.#execute = execute;
    this.#reset = reset;
  }
  get state() {
    return cloneState(this.#state);
  }
  execute(payload) {
    return this.#execute(payload);
  }
  reset() {
    this.#reset();
  }
};
var QueryClient = class {
  #staleTimeDefault;
  #cacheTime;
  #cache = /* @__PURE__ */ new Map();
  #listeners = /* @__PURE__ */ new Set();
  #persistStore;
  constructor(options = {}) {
    this.#staleTimeDefault = options.staleTime ?? 6e4;
    this.#cacheTime = options.cacheTime ?? 6e5;
    this.#persistStore = options.persist ? createNativeStore(options.persistId || "valyrian-query", {}, StorageType.Local, true) : null;
    this.#rehydrate();
  }
  #emit(event) {
    for (const listener of this.#listeners) {
      listener(event);
    }
  }
  #persist() {
    if (!this.#persistStore) {
      return;
    }
    const snapshot = Array.from(this.#cache.values()).map((entry) => ({
      key: entry.key,
      hash: entry.hash,
      state: entry.state,
      staleTime: entry.staleTime
    }));
    this.#persistStore.set("cache", snapshot);
  }
  #rehydrate() {
    if (!this.#persistStore) {
      return;
    }
    const snapshot = this.#persistStore.get("cache");
    if (!Array.isArray(snapshot)) {
      return;
    }
    for (const rawEntry of snapshot) {
      if (!rawEntry || typeof rawEntry !== "object") {
        continue;
      }
      const persisted = rawEntry;
      if (!Array.isArray(persisted.key)) {
        continue;
      }
      const key = persisted.key;
      const hash = hashKey(key);
      const staleTime = typeof persisted.staleTime === "number" && persisted.staleTime >= 0 ? persisted.staleTime : this.#staleTimeDefault;
      const state = normalizePersistedState(persisted.state);
      const entry = {
        key,
        hash,
        state,
        fetcher: () => state.data,
        staleTime,
        promise: null,
        gcTimer: null
      };
      this.#cache.set(hash, entry);
      this.#scheduleGc(entry);
    }
  }
  #scheduleGc(entry) {
    if (entry.gcTimer) {
      clearTimeout(entry.gcTimer);
    }
    entry.gcTimer = setTimeout(() => {
      this.#cache.delete(entry.hash);
      this.#emit({ type: "gc", key: entry.key });
      this.#persist();
    }, this.#cacheTime);
  }
  async #fetchEntry(entry) {
    const isFresh = Date.now() - entry.state.updatedAt < entry.staleTime;
    if (isFresh && entry.state.success) {
      return entry.state.data;
    }
    if (entry.promise) {
      return entry.promise;
    }
    entry.state.status = "loading";
    entry.state.loading = true;
    entry.state.success = false;
    entry.state.error = null;
    this.#emit({
      type: "query:start",
      key: entry.key,
      state: cloneState(entry.state)
    });
    const promise = Promise.resolve(entry.fetcher()).then((data) => {
      entry.state.data = data;
      entry.state.status = "success";
      entry.state.loading = false;
      entry.state.success = true;
      entry.state.error = null;
      entry.state.updatedAt = Date.now();
      this.#emit({
        type: "query:success",
        key: entry.key,
        state: cloneState(entry.state)
      });
      this.#persist();
      this.#scheduleGc(entry);
      return data;
    }).catch((error) => {
      entry.state.status = "error";
      entry.state.loading = false;
      entry.state.success = false;
      entry.state.error = error;
      this.#emit({
        type: "query:error",
        key: entry.key,
        state: cloneState(entry.state)
      });
      this.#persist();
      throw error;
    }).finally(() => {
      entry.promise = null;
    });
    entry.promise = promise;
    return promise;
  }
  query(config) {
    const key = config.key;
    const hash = hashKey(key);
    const staleTime = config.staleTime ?? this.#staleTimeDefault;
    if (!this.#cache.has(hash)) {
      this.#cache.set(hash, {
        key,
        hash,
        fetcher: config.fetcher,
        staleTime,
        promise: null,
        gcTimer: null,
        state: {
          status: "idle",
          loading: false,
          success: false,
          error: null,
          data: null,
          updatedAt: 0
        }
      });
    } else {
      const entry2 = this.#cache.get(hash);
      entry2.fetcher = config.fetcher;
      entry2.staleTime = staleTime;
    }
    const entry = this.#cache.get(hash);
    return new QueryHandle(
      entry,
      () => this.#fetchEntry(entry),
      () => {
        entry.state.updatedAt = 0;
        this.#emit({
          type: "query:invalidate",
          key: entry.key,
          state: cloneState(entry.state)
        });
      }
    );
  }
  mutation(config) {
    const state = {
      status: "idle",
      loading: false,
      success: false,
      error: null,
      data: null,
      updatedAt: 0
    };
    return new MutationHandle(
      state,
      async (payload) => {
        state.status = "loading";
        state.loading = true;
        state.success = false;
        state.error = null;
        this.#emit({
          type: "mutation:start",
          payload,
          state: cloneState(state)
        });
        try {
          const result = await config.execute(payload);
          state.status = "success";
          state.loading = false;
          state.success = true;
          state.data = result;
          state.updatedAt = Date.now();
          config.onSuccess?.(result);
          this.#emit({
            type: "mutation:success",
            payload,
            state: cloneState(state)
          });
          return result;
        } catch (error) {
          state.status = "error";
          state.loading = false;
          state.success = false;
          state.error = error;
          config.onError?.(error);
          this.#emit({
            type: "mutation:error",
            payload,
            state: cloneState(state)
          });
          throw error;
        }
      },
      () => {
        state.status = "idle";
        state.loading = false;
        state.success = false;
        state.error = null;
        state.data = null;
      }
    );
  }
  invalidate(partialKey) {
    for (const entry of this.#cache.values()) {
      if (keyStartsWith(entry.key, partialKey)) {
        entry.state.updatedAt = 0;
        this.#emit({
          type: "query:invalidate",
          key: entry.key,
          state: cloneState(entry.state)
        });
      }
    }
  }
  clear() {
    for (const entry of this.#cache.values()) {
      if (entry.gcTimer) {
        clearTimeout(entry.gcTimer);
      }
    }
    this.#cache.clear();
    this.#emit({ type: "cache:clear" });
    this.#persist();
  }
  on(event, callback) {
    if (event !== "change") {
      return () => void 0;
    }
    this.#listeners.add(callback);
    return () => this.#listeners.delete(callback);
  }
  off(event, callback) {
    if (event !== "change") {
      return;
    }
    this.#listeners.delete(callback);
  }
};
export {
  MutationHandle,
  QueryClient,
  QueryHandle
};
