import { AsyncLocalStorage } from "node:async_hooks";

const storageContext = new AsyncLocalStorage<Record<string, string>>();
let globalStore: Record<string, string> = {};

export class ServerStorage implements Storage {
  isContextActive(): boolean {
    return Boolean(storageContext.getStore());
  }

  get store(): Record<string, string> {
    return storageContext.getStore() || globalStore;
  }

  get length(): number {
    const store = this.store;
    return store ? Object.keys(store).length : 0;
  }

  clear(): void {
    const store = this.store;
    if (store) {
      for (const key in store) {
        Reflect.deleteProperty(store, key);
      }
    }
  }

  getItem(key: string): string | null {
    const store = this.store;
    return store ? store[key] || null : null;
  }

  key(index: number): string | null {
    const store = this.store;
    return store ? Object.keys(store)[index] || null : null;
  }

  removeItem(key: string): void {
    const store = this.store;
    if (store) {
      Reflect.deleteProperty(store, key);
    }
  }

  setItem(key: string, value: string): void {
    const store = this.store;
    if (store) {
      store[key] = String(value);
    }
  }

  static run(callback: () => void) {
    storageContext.run({}, callback);
  }

  static isContextActive(): boolean {
    return Boolean(storageContext.getStore());
  }

  toJSON(): Record<string, string> {
    const store = this.store;
    return store ? { ...store } : {};
  }
}

/*
On node.js environment, use ServerStorage for session storage.
At each request, a new storage context is created using ServerStorage.run method.
In browser environment, use the native sessionStorage.

server.get("*", (req, res) => {
  ServerStorage.run(() => {
      const html = router.go(req.url);
      res.send(html);
      
  });
});
*/
