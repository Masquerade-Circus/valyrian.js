import { isNodeJs } from "valyrian.js";

/* eslint-disable no-console */
export enum StorageType {
  // eslint-disable-next-line no-unused-vars
  Session = "session",
  // eslint-disable-next-line no-unused-vars
  Local = "local"
}

export interface NativeStorageInterface {
  state: Record<string, any>;
  // eslint-disable-next-line no-unused-vars
  set(key: string, value: any): void;
  // eslint-disable-next-line no-unused-vars
  get(key: string): any;
  // eslint-disable-next-line no-unused-vars
  delete(key: string): void;
  load(): void;
  clear(): void;
}

const ids = new Set<string>();

function getStorage(storageType: StorageType) {
  if (isNodeJs && typeof localStorage === "undefined") {
    throw new Error(
      `localStorage and sessionStorage are not available in Node.js, to use it in your project, you need to "import "valyrian.js/node"`
    );
  }
  return storageType === StorageType.Session ? sessionStorage : localStorage;
}

export function createNativeStore<T>(
  key: string,
  definition: Record<string, any> = {},
  storageType: StorageType = StorageType.Local,
  reuseIfExist = false
): NativeStorageInterface & T {
  const nativeStore = getStorage(storageType);

  if (ids.has(key)) {
    if (reuseIfExist) {
      // eslint-disable-next-line no-console
      console.warn(`Store with key ${key} already exists and will be reused`);
    } else {
      throw new Error(`Store with key ${key} already exists`);
    }
  }
  ids.add(key);

  const id = key;

  const Store: NativeStorageInterface = {
    state: {},
    set(key, value) {
      try {
        this.state[key] = value;
        nativeStore.setItem(id, JSON.stringify(this.state));
      } catch (e) {
        console.error("Error setting item in storage:", e);
      }
    },
    get(key) {
      if (Object.keys(this.state).length === 0) {
        this.load();
      }
      return this.state[key];
    },
    delete(key) {
      try {
        Reflect.deleteProperty(this.state, key);
        nativeStore.setItem(id, JSON.stringify(this.state));
      } catch (e) {
        console.error("Error deleting item in storage:", e);
      }
    },
    load() {
      try {
        const state = nativeStore.getItem(id);
        if (!state) {
          this.state = {};
          nativeStore.setItem(id, JSON.stringify(this.state));
          return;
        }
        this.state = JSON.parse(state);
      } catch (e) {
        console.error("Error loading state from storage:", e);
        this.state = {};
      }
    },
    clear() {
      try {
        this.state = {};
        nativeStore.removeItem(id);
      } catch (e) {
        console.error("Error clearing storage:", e);
      }
    },
    ...definition
  };

  Store.load();

  return Store as NativeStorageInterface & T;
}
