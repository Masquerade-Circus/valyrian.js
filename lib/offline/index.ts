import { NetworkEvent, NetworkManager } from "valyrian.js/network";
import { createNativeStore, StorageType } from "valyrian.js/native-store";
import { isString } from "valyrian.js/utils";

export type RetryStrategy = "exponential" | "linear";

export type BackoffConfig = {
  strategy?: RetryStrategy;
  baseMs?: number;
  maxMs?: number;
};

export type OfflineOperation = {
  id: string;
  type: string;
  payload?: unknown;
  retries: number;
  createdAt: number;
  lastError?: string;
};

export type QueueState = {
  pending: number;
  failed: number;
  syncing: boolean;
  lastSyncAt: number | null;
  lastError: string | null;
};

export type OfflineQueueOptions = {
  id: string;
  network: NetworkManager;
  storage?: "local" | "session";
  handler: (operation: OfflineOperation) => Promise<unknown>;
  isRetryable?: (error: unknown) => boolean;
  backoff?: BackoffConfig;
  maxRetries?: number;
};

type OfflineQueueEventMap = {
  change: Readonly<QueueState>;
  "sync:success": OfflineOperation;
  "sync:error": { operation: OfflineOperation; error: unknown };
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toErrorMessage(error: unknown) {
  if (isString(error)) {
    return error;
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Unknown error";
}

function calculateBackoffDelay(retries: number, backoff: BackoffConfig = {}) {
  const strategy = backoff.strategy || "exponential";
  const baseMs = backoff.baseMs ?? 1000;
  const maxMs = backoff.maxMs ?? 30000;

  if (strategy === "linear") {
    return Math.min(maxMs, baseMs * retries);
  }

  return Math.min(maxMs, baseMs * Math.pow(2, retries - 1));
}

function cloneState(state: QueueState) {
  return Object.freeze({ ...state });
}

export class OfflineQueue {
  #network: NetworkManager;
  #maxRetries: number;
  #retryable: (error: unknown) => boolean;
  #backoff: BackoffConfig;
  #handler: (operation: OfflineOperation) => Promise<unknown>;
  #offOnline: (() => void) | null = null;

  #store;
  #pending: OfflineOperation[];
  #failed: OfflineOperation[];
  #state: QueueState;

  #destroyed = false;

  #listeners: {
    [K in keyof OfflineQueueEventMap]: Set<(payload: OfflineQueueEventMap[K]) => void>;
  } = {
    change: new Set(),
    "sync:success": new Set(),
    "sync:error": new Set()
  };

  constructor(options: OfflineQueueOptions) {
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

    this.#pending = (this.#store.get("pending") || []) as OfflineOperation[];
    this.#failed = (this.#store.get("failed") || []) as OfflineOperation[];

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

  #emit<K extends keyof OfflineQueueEventMap>(event: K, payload: OfflineQueueEventMap[K]) {
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

  async #syncOne(operation: OfflineOperation) {
    try {
      await this.#handler(operation);
      return { ok: true as const };
    } catch (error) {
      operation.retries += 1;
      operation.lastError = toErrorMessage(error);

      if (!this.#retryable(error) || operation.retries > this.#maxRetries) {
        return { ok: false as const, failed: true as const, error };
      }

      const delay = calculateBackoffDelay(operation.retries, this.#backoff);
      await sleep(delay);
      return { ok: false as const, failed: false as const, error };
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

  enqueue(operation: Omit<OfflineOperation, "id" | "createdAt" | "retries">) {
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
    if (this.#destroyed || this.#state.syncing) {
      return;
    }

    if (!this.#network.getNetworkStatus().online) {
      return;
    }

    this.#state.syncing = true;
    this.#emit("change", cloneState(this.#state));

    try {
      while (this.#pending.length > 0 && !this.#destroyed) {
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

  retryOne(id: string) {
    const index = this.#failed.findIndex((operation) => operation.id === id);
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

  on<K extends keyof OfflineQueueEventMap>(
    event: K,
    callback: (payload: OfflineQueueEventMap[K]) => void
  ) {
    this.#listeners[event].add(callback);
    return () => this.off(event, callback);
  }

  off<K extends keyof OfflineQueueEventMap>(
    event: K,
    callback: (payload: OfflineQueueEventMap[K]) => void
  ) {
    this.#listeners[event].delete(callback);
  }

  destroy() {
    this.#destroyed = true;
    this.#offOnline?.();
    this.#offOnline = null;

    this.#listeners.change.clear();
    this.#listeners["sync:success"].clear();
    this.#listeners["sync:error"].clear();
  }
}
