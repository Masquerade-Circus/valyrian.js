import { createNativeStore, StorageType } from "valyrian.js/native-store";

export type QueryKey = Array<string | number | boolean | Record<string, unknown>>;
export type QueryStatus = "idle" | "loading" | "success" | "error";

export type QueryState<TData> = {
  status: QueryStatus;
  loading: boolean;
  success: boolean;
  error: unknown;
  data: TData | null;
  updatedAt: number;
};

export type QueryConfig<TData> = {
  key: QueryKey;
  fetcher: () => Promise<TData> | TData;
  staleTime?: number;
};

export type MutationConfig<TPayload, TResult> = {
  execute: (payload: TPayload) => Promise<TResult> | TResult;
  onSuccess?: (result: TResult) => void;
  onError?: (error: unknown) => void;
};

export type QueryClientOptions = {
  staleTime?: number;
  cacheTime?: number;
  persist?: boolean;
  persistId?: string;
};

export type QueryChangeEvent = {
  type: string;
  key?: QueryKey;
  payload?: unknown;
  state?: QueryState<unknown>;
};

type CacheEntry<TData> = {
  key: QueryKey;
  hash: string;
  state: QueryState<TData>;
  fetcher: () => Promise<TData> | TData;
  staleTime: number;
  promise: Promise<TData | null> | null;
  gcTimer: ReturnType<typeof setTimeout> | null;
};

type PersistedCacheEntry = {
  key: QueryKey;
  state: Partial<QueryState<unknown>>;
  staleTime?: number;
};

function hashKey(key: QueryKey) {
  return JSON.stringify(key);
}

function keyStartsWith(key: QueryKey, partial: QueryKey) {
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

function cloneState<TData>(state: QueryState<TData>): Readonly<QueryState<TData>> {
  return Object.freeze({ ...state });
}

function isQueryStatus(value: unknown): value is QueryStatus {
  return value === "idle" || value === "loading" || value === "success" || value === "error";
}

function normalizePersistedState(state: unknown): QueryState<unknown> {
  const source = state && typeof state === "object" ? (state as Partial<QueryState<unknown>>) : {};
  const hasError = source.error !== null && typeof source.error !== "undefined";
  const status = isQueryStatus(source.status)
    ? source.status === "loading"
      ? "idle"
      : source.status
    : source.success
      ? "success"
      : hasError
        ? "error"
        : "idle";

  return {
    status,
    loading: false,
    success: status === "success",
    error: status === "error" ? source.error ?? null : null,
    data: "data" in source ? source.data ?? null : null,
    updatedAt: typeof source.updatedAt === "number" ? source.updatedAt : 0
  };
}

export class QueryHandle<TData> {
  #entry: CacheEntry<TData>;
  #fetch: () => Promise<TData | null>;
  #invalidate: () => void;

  constructor(entry: CacheEntry<TData>, fetch: () => Promise<TData | null>, invalidate: () => void) {
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
}

export class MutationHandle<TPayload, TResult> {
  #state: QueryState<TResult>;
  #execute: (payload: TPayload) => Promise<TResult>;
  #reset: () => void;

  constructor(
    state: QueryState<TResult>,
    execute: (payload: TPayload) => Promise<TResult>,
    reset: () => void
  ) {
    this.#state = state;
    this.#execute = execute;
    this.#reset = reset;
  }

  get state() {
    return cloneState(this.#state);
  }

  execute(payload: TPayload) {
    return this.#execute(payload);
  }

  reset() {
    this.#reset();
  }
}

export class QueryClient {
  #staleTimeDefault: number;
  #cacheTime: number;
  #cache = new Map<string, CacheEntry<unknown>>();
  #listeners = new Set<(event: QueryChangeEvent) => void>();
  #persistStore;

  constructor(options: QueryClientOptions = {}) {
    this.#staleTimeDefault = options.staleTime ?? 60000;
    this.#cacheTime = options.cacheTime ?? 600000;

    this.#persistStore = options.persist
      ? createNativeStore(options.persistId || "valyrian-query", {}, StorageType.Local, true)
      : null;

    this.#rehydrate();
  }

  #emit(event: QueryChangeEvent) {
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

      const persisted = rawEntry as Partial<PersistedCacheEntry>;
      if (!Array.isArray(persisted.key)) {
        continue;
      }

      const key = persisted.key as QueryKey;
      const hash = hashKey(key);
      const staleTime =
        typeof persisted.staleTime === "number" && persisted.staleTime >= 0
          ? persisted.staleTime
          : this.#staleTimeDefault;
      const state = normalizePersistedState(persisted.state);

      const entry: CacheEntry<unknown> = {
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

  #scheduleGc(entry: CacheEntry<unknown>) {
    if (entry.gcTimer) {
      clearTimeout(entry.gcTimer);
    }

    entry.gcTimer = setTimeout(() => {
      this.#cache.delete(entry.hash);
      this.#emit({ type: "gc", key: entry.key });
      this.#persist();
    }, this.#cacheTime);
  }

  async #fetchEntry<TData>(entry: CacheEntry<TData>) {
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

    const promise = Promise.resolve(entry.fetcher())
      .then((data) => {
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
        this.#scheduleGc(entry as unknown as CacheEntry<unknown>);
        return data;
      })
      .catch((error) => {
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
      })
      .finally(() => {
        entry.promise = null;
      });

    entry.promise = promise;
    return promise;
  }

  query<TData>(config: QueryConfig<TData>) {
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
      } as CacheEntry<unknown>);
    } else {
      const entry = this.#cache.get(hash)! as CacheEntry<TData>;
      entry.fetcher = config.fetcher;
      entry.staleTime = staleTime;
    }

    const entry = this.#cache.get(hash)! as CacheEntry<TData>;

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

  mutation<TPayload, TResult>(config: MutationConfig<TPayload, TResult>) {
    const state: QueryState<TResult> = {
      status: "idle",
      loading: false,
      success: false,
      error: null,
      data: null,
      updatedAt: 0
    };

    return new MutationHandle(
      state,
      async (payload: TPayload) => {
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

  invalidate(partialKey: QueryKey) {
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

  on(event: "change", callback: (event: QueryChangeEvent) => void) {
    if (event !== "change") {
      return () => undefined;
    }

    this.#listeners.add(callback);
    return () => this.#listeners.delete(callback);
  }

  off(event: "change", callback: (event: QueryChangeEvent) => void) {
    if (event !== "change") {
      return;
    }

    this.#listeners.delete(callback);
  }
}
