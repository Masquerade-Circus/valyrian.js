// lib/native-store/index.ts
import { isNodeJs } from "valyrian.js";
var StorageType = /* @__PURE__ */ ((StorageType2) => {
  StorageType2["Session"] = "session";
  StorageType2["Local"] = "local";
  return StorageType2;
})(StorageType || {});
var stores = /* @__PURE__ */ new Map();
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
  if (stores.has(id)) {
    if (reuseIfExist) {
      console.warn(`Store with key ${id} already exists and will be reused`);
      return stores.get(id);
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
    ...definition
  };
  if (!isNodeJs && storageType === "local" /* Local */) {
    let storageListener2 = function(e) {
      if (e.key === id) {
        try {
          Store.state = e.newValue === null ? {} : JSON.parse(e.newValue);
        } catch (err) {
          console.error(`Error syncing store ${id} from storage event`, err);
        }
      }
    };
    var storageListener = storageListener2;
    window.addEventListener("storage", storageListener2);
  }
  Store.load();
  stores.set(id, Store);
  return Store;
}
export {
  StorageType,
  createNativeStore
};
