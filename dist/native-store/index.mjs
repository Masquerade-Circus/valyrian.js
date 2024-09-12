// lib/native-store/index.ts
import { isNodeJs } from "valyrian.js";
var StorageType = /* @__PURE__ */ ((StorageType2) => {
  StorageType2["Session"] = "session";
  StorageType2["Local"] = "local";
  return StorageType2;
})(StorageType || {});
var ids = /* @__PURE__ */ new Set();
function getStorage(storageType) {
  if (isNodeJs && typeof localStorage === "undefined") {
    throw new Error(
      `localStorage and sessionStorage are not available in Node.js, to use it in your project, you need to "import "valyrian.js/node"`
    );
  }
  return storageType === "session" /* Session */ ? sessionStorage : localStorage;
}
function createNativeStore(key, definition = {}, storageType = "local" /* Local */, reuseIfExist = false) {
  const nativeStore = getStorage(storageType);
  if (ids.has(key)) {
    if (reuseIfExist) {
      console.warn(`Store with key ${key} already exists and will be reused`);
    } else {
      throw new Error(`Store with key ${key} already exists`);
    }
  }
  ids.add(key);
  const id = key;
  const Store = {
    state: {},
    set(key2, value) {
      try {
        this.state[key2] = value;
        nativeStore.setItem(id, JSON.stringify(this.state));
      } catch (e) {
        console.error("Error setting item in storage:", e);
      }
    },
    get(key2) {
      if (Object.keys(this.state).length === 0) {
        this.load();
      }
      return this.state[key2];
    },
    delete(key2) {
      try {
        Reflect.deleteProperty(this.state, key2);
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
  return Store;
}
export {
  StorageType,
  createNativeStore
};
