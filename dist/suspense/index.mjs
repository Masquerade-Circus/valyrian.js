// lib/suspense/index.ts
import {
  isVnodeComponent,
  isPOJOComponent,
  isComponent,
  v,
  current,
  updateVnode
} from "valyrian.js";
var domToSuspenseStores = /* @__PURE__ */ new WeakMap();
function getSuspenseStore(dom, key) {
  let stores = domToSuspenseStores.get(dom);
  if (!stores) {
    stores = /* @__PURE__ */ new Map();
    domToSuspenseStores.set(dom, stores);
  }
  let store = stores.get(key);
  if (!store) {
    store = {
      status: 0,
      value: null,
      error: null,
      version: 0,
      promise: null
    };
    stores.set(key, store);
  }
  return store;
}
function Suspense({
  key,
  fallback,
  error
}, children) {
  if (key === void 0 || key === null) {
    throw new Error("Suspense requires a 'key' prop");
  }
  return v(() => {
    const hostVnode = current.vnode;
    if (!hostVnode || !hostVnode.dom) {
      throw new Error("Suspense must be rendered inside a component");
    }
    const hostDom = hostVnode.dom;
    const store = getSuspenseStore(hostDom, key);
    if (store.status === 2 && store.error) {
      if (error) {
        return error(store.error);
      }
      return store.error.message;
    }
    if (store.status === 1) {
      return store.value;
    }
    if (!store.promise) {
      const version = ++store.version;
      const promise = Promise.all(
        children.map((child) => {
          if (isVnodeComponent(child)) {
            if (isPOJOComponent(child.tag)) {
              return child.tag.view.bind(child.tag)(child.props || {}, child.children);
            }
            return child.tag(child.props || {}, child.children);
          }
          if (isPOJOComponent(child)) {
            return child.view.bind(child)({}, []);
          }
          if (isComponent(child)) {
            return child({}, []);
          }
          return child;
        })
      );
      store.promise = promise;
      promise.then((newChildren) => {
        if (store.version !== version) {
          return;
        }
        store.status = 1;
        store.value = newChildren;
        store.error = null;
        store.promise = null;
        const vnodeToUpdate = hostDom.vnode;
        if (vnodeToUpdate) {
          updateVnode(vnodeToUpdate);
        }
      }).catch((e) => {
        if (store.version !== version) {
          return;
        }
        store.status = 2;
        store.error = e instanceof Error ? e : new Error(String(e));
        store.promise = null;
        const vnodeToUpdate = hostDom.vnode;
        if (vnodeToUpdate) {
          updateVnode(vnodeToUpdate);
        }
      });
    }
    return fallback;
  }, {});
}
export {
  Suspense
};
