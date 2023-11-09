// lib/dataset/index.ts
import { createElement, directive, patch, updateAttributes } from "valyrian.js";
function deepFreeze(obj) {
  if (typeof obj === "object" && obj !== null && !Object.isFrozen(obj)) {
    if (Array.isArray(obj)) {
      for (let i = 0, l = obj.length; i < l; i++) {
        deepFreeze(obj[i]);
      }
    } else {
      const props = Reflect.ownKeys(obj);
      for (let i = 0, l = props.length; i < l; i++) {
        deepFreeze(obj[props[i]]);
      }
    }
    Object.freeze(obj);
  }
  return obj;
}
var DataSet = class {
  #vnode = null;
  // eslint-disable-next-line no-unused-vars
  #handler = null;
  #data = [];
  #isFrozen = false;
  #dataProxy = null;
  get data() {
    if (this.#dataProxy === null) {
      throw new Error("DataSet is not initialized");
    }
    return this.#dataProxy;
  }
  set data(data) {
    throw new Error("You need to use the reset method to set the data");
  }
  #setData(data) {
    if (this.#isFrozen) {
      this.#data = deepFreeze([...data]);
    } else {
      this.#data = data;
    }
    this.#dataProxy = new Proxy(this.#data, {
      set: () => {
        throw new Error("You need to use the add, update or delete methods to change the data");
      },
      get(target, prop) {
        return target[prop];
      },
      deleteProperty: () => {
        throw new Error("You need to use the add, update or delete methods to change the data");
      }
    });
  }
  constructor(data = [], shouldFreeze = true) {
    this.#isFrozen = shouldFreeze;
    this.#setData(data);
  }
  setVnodeAndHandler(vnode, handler) {
    this.#vnode = vnode;
    this.#handler = handler;
    this.reset(this.#data);
  }
  reset(data) {
    this.#setData(data);
    if (this.#vnode === null || this.#handler === null) {
      return;
    }
    const vnode = this.#vnode;
    const handler = this.#handler;
    if (data.length === 0) {
      vnode.children = [];
      vnode.dom.textContent = "";
      return;
    }
    const childrenLength = vnode.children.length;
    for (let i = 0, l = data.length; i < l; i++) {
      const child = handler(this.data[i], i);
      if (i < childrenLength) {
        const oldChild = vnode.children[i];
        child.isSVG = oldChild.isSVG;
        child.dom = oldChild.dom;
        updateAttributes(child, null);
        vnode.children[i] = child;
        patch(child);
        continue;
      }
      child.isSVG = vnode.isSVG || child.tag === "svg";
      child.dom = createElement(child.tag, child.isSVG);
      vnode.dom.appendChild(child.dom);
      updateAttributes(child, null);
      vnode.children.push(child);
      patch(child);
    }
    for (let i = data.length; i < childrenLength; i++) {
      vnode.dom.removeChild(vnode.children[i].dom);
    }
    vnode.children.length = data.length;
  }
  add(...data) {
    if (this.#data) {
      const oldLength = this.#data.length;
      if (this.#isFrozen) {
        this.#setData([...this.#data, ...data]);
      } else {
        this.#data.push(...data);
      }
      if (this.#vnode === null || this.#handler === null) {
        return;
      }
      const vnode = this.#vnode;
      const handler = this.#handler;
      for (let i = 0, ii = oldLength, l = data.length; i < l; i++, ii++) {
        const child = handler(this.#data[i], ii);
        child.isSVG = vnode.isSVG || child.tag === "svg";
        child.dom = createElement(child.tag, child.isSVG);
        vnode.dom.appendChild(child.dom);
        updateAttributes(child, null);
        vnode.children.push(child);
        patch(child);
      }
    }
  }
  delete(index) {
    if (this.#data && this.#vnode) {
      const child = this.#vnode.children[index];
      if (this.#isFrozen) {
        this.#setData(this.data.filter((_, i) => i !== index));
      } else {
        this.#data.splice(index, 1);
      }
      this.#vnode.dom.removeChild(child.dom);
      this.#vnode.children.splice(index, 1);
    }
  }
  update(index, item) {
    if (this.#data && this.#vnode && this.#handler) {
      const child = this.#vnode.children[index];
      if (this.#isFrozen) {
        this.#setData(this.#data.map((d, i) => i === index ? { ...d, ...item } : d));
      } else {
        this.#data[index] = { ...this.#data[index], ...item };
      }
      const newChild = this.#handler(this.#data[index], index);
      newChild.isSVG = this.#vnode.isSVG || newChild.tag === "svg";
      newChild.dom = child.dom;
      this.#vnode.children[index] = newChild;
      updateAttributes(newChild, null);
      patch(newChild);
    }
  }
};
directive("with-dataset", (dataSet, vnode) => {
  dataSet.setVnodeAndHandler(vnode, vnode.children[0]);
  return false;
});
export {
  DataSet
};
