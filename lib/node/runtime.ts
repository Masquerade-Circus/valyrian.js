import { AsyncLocalStorage } from "node:async_hooks";
import { Document, Event, PopStateEvent } from "./utils/tree-adapter";

type BrowserHistoryEntry = {
  url: URL;
  state: unknown;
};

type RuntimeContext = {
  document: Document;
  browser: BrowserWindow | null;
  stores: Map<symbol, Record<string | symbol, unknown>>;
};

const runtimeContext = new AsyncLocalStorage<RuntimeContext>();
let assignedWindow: unknown;
let assignedLocation: unknown;
let assignedHistory: unknown;

export function installRuntimeGlobals(publicDocument: Document): void {
  Object.defineProperties(globalThis, {
    document: {
      configurable: true,
      get: () => runtimeContext.getStore()?.document ?? publicDocument
    },
    window: {
      configurable: true,
      get: () => {
        const context = runtimeContext.getStore();
        return context ? context.browser ?? undefined : assignedWindow;
      },
      set: (value) => {
        assignedWindow = value;
      }
    },
    location: {
      configurable: true,
      get: () => {
        const context = runtimeContext.getStore();
        return context ? context.browser?.location : assignedLocation;
      },
      set: (value) => {
        assignedLocation = value;
      }
    },
    history: {
      configurable: true,
      get: () => {
        const context = runtimeContext.getStore();
        return context ? context.browser?.history : assignedHistory;
      },
      set: (value) => {
        assignedHistory = value;
      }
    }
  });
}

class BrowserWindow {
  readonly window = this;
  readonly document: Document;
  readonly location: BrowserLocation;
  readonly history: BrowserHistory;
  private listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

  constructor(document: Document, initialUrl: URL) {
    this.document = document;
    this.location = new BrowserLocation(initialUrl);
    this.history = new BrowserHistory(this, initialUrl);
    document.location = this.location as unknown as Location;
  }

  addEventListener(type: string, callback: EventListenerOrEventListenerObject | null): void {
    if (callback === null) {
      return;
    }
    let listeners = this.listeners.get(type);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(type, listeners);
    }
    listeners.add(callback);
  }

  removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null): void {
    if (callback === null) {
      return;
    }
    this.listeners.get(type)?.delete(callback);
  }

  dispatchEvent(event: Event): boolean {
    if (event.target === null) {
      event.target = this;
    }
    event.currentTarget = this;
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      for (const callback of listeners) {
        if (event.propagationStopped) {
          break;
        }
        if (typeof callback === "function") {
          callback.call(this, event);
        } else {
          callback.handleEvent(event);
        }
      }
    }
    return !event.defaultPrevented;
  }
}

class BrowserLocation {
  private url: URL;

  constructor(url: URL) {
    this.url = new URL(url.href);
  }

  get href(): string {
    return this.url.href;
  }

  get origin(): string {
    return this.url.origin;
  }

  get hostname(): string {
    return this.url.hostname;
  }

  get protocol(): string {
    return this.url.protocol;
  }

  get port(): string {
    return this.url.port;
  }

  get pathname(): string {
    return this.url.pathname;
  }

  get search(): string {
    return this.url.search;
  }

  get hash(): string {
    return this.url.hash;
  }

  setUrl(url: URL): void {
    this.url = url;
  }
}

class BrowserHistory {
  private entries: BrowserHistoryEntry[];
  private index = 0;
  private readonly initialUrl: URL;

  constructor(
    private readonly target: BrowserWindow,
    initialUrl: URL
  ) {
    this.initialUrl = new URL(initialUrl.href);
    this.entries = [{ url: this.initialUrl, state: null }];
  }

  get state(): unknown {
    return this.entries[this.index].state;
  }

  get length(): number {
    return this.entries.length;
  }

  pushState(state: unknown, _unused: string, url?: string | URL | null): void {
    const nextUrl = this.resolveUrl(url);
    this.entries.splice(this.index + 1);
    this.entries.push({ url: nextUrl, state });
    this.index = this.entries.length - 1;
    this.target.location.setUrl(nextUrl);
  }

  replaceState(state: unknown, _unused: string, url?: string | URL | null): void {
    const nextUrl = this.resolveUrl(url);
    this.entries[this.index] = { url: nextUrl, state };
    this.target.location.setUrl(nextUrl);
  }

  back(): void {
    this.go(-1);
  }

  forward(): void {
    this.go(1);
  }

  go(delta = 0): void {
    if (!Number.isInteger(delta) || delta === 0) {
      return;
    }
    const nextIndex = this.index + delta;
    if (nextIndex < 0 || nextIndex >= this.entries.length) {
      return;
    }
    this.index = nextIndex;
    const entry = this.entries[this.index];
    this.target.location.setUrl(entry.url);
    this.target.dispatchEvent(new PopStateEvent("popstate", { state: entry.state }));
  }

  reset(): void {
    this.entries = [{ url: new URL(this.initialUrl.href), state: null }];
    this.index = 0;
    this.target.location.setUrl(this.initialUrl);
  }

  private resolveUrl(url?: string | URL | null): URL {
    if (url === null || typeof url === "undefined") {
      return new URL(this.target.location.href);
    }
    const resolved = new URL(url, this.target.location.href);
    if (resolved.origin !== this.target.location.origin) {
      throw new DOMException("History state URL must keep the current origin", "SecurityError");
    }
    return resolved;
  }
}

function createRuntimeContext(browserUrl: URL | null): RuntimeContext {
  const document = new Document();
  return {
    document,
    browser: browserUrl === null ? null : new BrowserWindow(document, browserUrl),
    stores: new Map()
  };
}

function runRuntimeContext<T>(browserUrl: URL | null, callback: () => T): T {
  return runtimeContext.run(createRuntimeContext(browserUrl), callback);
}

export function getActiveDocument(fallback: Document): Document {
  return runtimeContext.getStore()?.document ?? fallback;
}

export function getRuntimeStorage(storeKey: symbol): Record<string | symbol, unknown> | null {
  const context = runtimeContext.getStore();
  if (!context) {
    return null;
  }
  let store = context.stores.get(storeKey);
  if (!store) {
    store = {};
    context.stores.set(storeKey, store);
  }
  return store;
}

export function isRuntimeContextActive(): boolean {
  return Boolean(runtimeContext.getStore());
}

export class NodeRuntime {
  static run<T>(callback: () => T): T {
    return runRuntimeContext(null, callback);
  }

  static runBrowser<T>(options: { url: string | URL }, callback: () => T): T {
    return runRuntimeContext(new URL(options.url), callback);
  }

  static resetHistory(): void {
    const browser = runtimeContext.getStore()?.browser;
    if (browser === null || typeof browser === "undefined") {
      throw new Error("NodeRuntime.resetHistory() requires an active NodeRuntime.runBrowser() context");
    }
    browser.history.reset();
  }
}
