// lib/native-store/index.ts
import { isNodeJs } from "valyrian.js";
import { createContextScope, getContext, isServerContextActive, setContext } from "valyrian.js/context";
var StorageType = /* @__PURE__ */ ((StorageType2) => {
  StorageType2["Session"] = "session";
  StorageType2["Local"] = "local";
  return StorageType2;
})(StorageType || {});
var stores = /* @__PURE__ */ new Map();
var nativeStoreRegistryScope = createContextScope("native-store.registry");
function getStoreRegistry() {
  if (!isNodeJs || !isServerContextActive()) {
    return stores;
  }
  let scopedStores = getContext(nativeStoreRegistryScope);
  if (!scopedStores) {
    scopedStores = /* @__PURE__ */ new Map();
    setContext(nativeStoreRegistryScope, scopedStores);
  }
  return scopedStores;
}
function getStorage(storageType) {
  if (isNodeJs && typeof localStorage === "undefined") {
    throw new Error(
      `localStorage and sessionStorage are not available in Node.js, to use it in your project, you need to "import "valyrian.js/node"`
    );
  }
  return storageType === "session" /* Session */ ? sessionStorage : localStorage;
}
function createNativeStore(id, definition = {}, storageType = "local" /* Local */, reuseIfExist = false) {
  const nativeStore = getStorage(storageType);
  const storeRegistry = getStoreRegistry();
  if (storeRegistry.has(id)) {
    if (reuseIfExist) {
      console.warn(`Store with key ${id} already exists and will be reused`);
      return storeRegistry.get(id);
    } else {
      throw new Error(`Store with key ${id} already exists`);
    }
  }
  const Store = {
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
    cleanup() {
    },
    ...definition
  };
  let storageListener = null;
  if (!isNodeJs && storageType === "local" /* Local */) {
    storageListener = (e) => {
      if (e.key === id) {
        try {
          Store.state = e.newValue === null ? {} : JSON.parse(e.newValue);
        } catch (err) {
          console.error(`Error syncing store ${id} from storage event`, err);
        }
      }
    };
    window.addEventListener("storage", storageListener);
  }
  Store.load();
  storeRegistry.set(id, Store);
  Store.cleanup = () => {
    if (storageListener) {
      window.removeEventListener("storage", storageListener);
      storageListener = null;
    }
    storeRegistry.delete(id);
  };
  return Store;
}
export {
  StorageType,
  createNativeStore
};
