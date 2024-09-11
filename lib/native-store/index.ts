export interface NativeStorageInterface {
  state: Record<string, any>;
  set(key: string, value: any): void;
  get(key: string): any;
  delete(key: string): void;
  load(): void;
  clear(): void;
}

const nativeStore = sessionStorage || localStorage;

const ids = new Set<string>();

export function createNativeStore<T>(
  key: string,
  definition: Record<string, any> = {},
  reuseIfExist = false
): NativeStorageInterface & T {
  if (ids.has(key)) {
    if (reuseIfExist) {
      // eslint-disable-next-line no-console
      console.warn(`Store with key ${key} already exists and will be reused`);
    } else {
      throw new Error(`Store with key ${key} already exists`);
    }
  }
  ids.add(key);
  const Store: NativeStorageInterface = {
    state: {},
    set(key, value) {
      this.state[key] = value;
      nativeStore.setItem(key, JSON.stringify(this.state));
    },
    get(key) {
      if (!this.state) {
        this.load();
      }
      return this.state[key];
    },
    delete(key) {
      Reflect.deleteProperty(this.state, key);
      nativeStore.setItem(key, JSON.stringify(this.state));
    },
    load() {
      const state = nativeStore.getItem(key);
      if (!state) {
        this.state = {};
        nativeStore.setItem(key, JSON.stringify(this.state));
        return;
      }
      this.state = JSON.parse(state);
    },
    clear() {
      this.state = {};
      nativeStore.removeItem(key);
    },
    ...definition
  };

  Store.load();

  return Store as NativeStorageInterface & T;
}
