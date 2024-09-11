// lib/native-store/index.ts
var nativeStore = sessionStorage || localStorage;
var ids = /* @__PURE__ */ new Set();
function createNativeStore(key, definition = {}, reuseIfExist = false) {
  if (ids.has(key)) {
    if (reuseIfExist) {
      console.warn(`Store with key ${key} already exists and will be reused`);
    } else {
      throw new Error(`Store with key ${key} already exists`);
    }
  }
  ids.add(key);
  const Store = {
    state: {},
    set(key2, value) {
      this.state[key2] = value;
      nativeStore.setItem(key2, JSON.stringify(this.state));
    },
    get(key2) {
      if (!this.state) {
        this.load();
      }
      return this.state[key2];
    },
    delete(key2) {
      Reflect.deleteProperty(this.state, key2);
      nativeStore.setItem(key2, JSON.stringify(this.state));
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
  return Store;
}
export {
  createNativeStore
};
