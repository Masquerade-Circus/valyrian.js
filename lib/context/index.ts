import { isNodeJs } from "valyrian.js";

type ScopeMap = Map<symbol, unknown>;

const NODE_CONTEXT_STORE_KEY = "__valyrian_context_values__";
const browserContextStore: ScopeMap = new Map();

export type ContextScope<T> = {
  key: symbol;
  name: string;
  // Type marker only
  __type?: T;
};

export function createContextScope<T>(name: string): ContextScope<T> {
  return {
    key: Symbol(name),
    name
  };
}

function getNodeStoreObject(): Record<string | symbol, unknown> | null {
  if (!isNodeJs || typeof sessionStorage === "undefined") {
    return null;
  }

  const storage = sessionStorage as Storage & {
    store?: Record<string | symbol, unknown>;
  };

  if (!storage.store || typeof storage.store !== "object") {
    return null;
  }

  return storage.store;
}

function getScopeMap(create = false): ScopeMap | null {
  const nodeStore = getNodeStoreObject();
  if (nodeStore) {
    const existingMap = nodeStore[NODE_CONTEXT_STORE_KEY] as ScopeMap | undefined;
    if (existingMap) {
      return existingMap;
    }

    if (create) {
      const nextMap: ScopeMap = new Map();
      nodeStore[NODE_CONTEXT_STORE_KEY] = nextMap;
      return nextMap;
    }

    return null;
  }

  if (create) {
    return browserContextStore;
  }

  return browserContextStore.size > 0 ? browserContextStore : null;
}

export function isServerContextActive() {
  if (!isNodeJs || typeof sessionStorage === "undefined") {
    return false;
  }

  const maybeServerStorage = sessionStorage as Storage & {
    isContextActive?: () => boolean;
  };

  if (typeof maybeServerStorage.isContextActive === "function") {
    return Boolean(maybeServerStorage.isContextActive());
  }

  return false;
}

export function getContext<T>(scope: ContextScope<T>): T | undefined {
  const map = getScopeMap(false);
  if (!map) {
    return undefined;
  }

  return map.get(scope.key) as T | undefined;
}

export function hasContext<T>(scope: ContextScope<T>): boolean {
  const map = getScopeMap(false);
  if (!map) {
    return false;
  }

  return map.has(scope.key);
}

export function setContext<T>(scope: ContextScope<T>, value: T): () => void {
  const map = getScopeMap(true) as ScopeMap;
  const hasPrevious = map.has(scope.key);
  const previousValue = map.get(scope.key);

  map.set(scope.key, value);

  return () => {
    if (!hasPrevious) {
      map.delete(scope.key);
      return;
    }
    map.set(scope.key, previousValue);
  };
}

export function runWithContext<T, TResult>(scope: ContextScope<T>, value: T, callback: () => TResult): TResult;
export function runWithContext<T, TResult>(
  scope: ContextScope<T>,
  value: T,
  callback: () => Promise<TResult>
): Promise<TResult>;
export function runWithContext<T, TResult>(
  scope: ContextScope<T>,
  value: T,
  callback: () => TResult | Promise<TResult>
) {
  const restore = setContext(scope, value);
  try {
    const result = callback();
    if (result instanceof Promise) {
      return result.finally(restore);
    }
    restore();
    return result;
  } catch (error) {
    restore();
    throw error;
  }
}
