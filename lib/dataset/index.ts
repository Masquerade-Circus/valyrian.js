import { VnodeWithDom, createElement, directive, patch, updateAttributes } from "valyrian.js";

interface DataSetInterface<T> {
  data: T[];
  // eslint-disable-next-line no-unused-vars
  reset: (data: T[]) => void;
  // eslint-disable-next-line no-unused-vars
  add: (...data: T[]) => void;
  // eslint-disable-next-line no-unused-vars
  update: (index: number, data: T) => void;
  // eslint-disable-next-line no-unused-vars
  delete: (index: number) => void;
}
interface DataSetHandler<T> {
  // eslint-disable-next-line no-unused-vars
  (data: T, index: number): VnodeWithDom;
}

function deepFreeze(obj: any) {
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

export class DataSet<T> implements DataSetInterface<T> {
  #vnode: VnodeWithDom | null = null;
  // eslint-disable-next-line no-unused-vars
  #handler: DataSetHandler<T> | null = null;
  #data: T[] = [];
  #isFrozen = false;
  #dataProxy: T[] | null = null;

  get data() {
    if (this.#dataProxy === null) {
      throw new Error("DataSet is not initialized");
    }

    return this.#dataProxy;
  }

  set data(data: T[]) {
    throw new Error("You need to use the reset method to set the data");
  }

  #setData(data: T[]) {
    if (this.#isFrozen) {
      this.#data = deepFreeze([...data]);
    } else {
      this.#data = data;
    }
    this.#dataProxy = new Proxy(this.#data as T[], {
      set: () => {
        throw new Error("You need to use the add, update or delete methods to change the data");
      },
      get(target: any, prop: string) {
        return target[prop];
      },
      deleteProperty: () => {
        throw new Error("You need to use the add, update or delete methods to change the data");
      }
    }) as T[];
  }

  constructor(data: T[] = [], shouldFreeze = true) {
    this.#isFrozen = shouldFreeze;
    this.#setData(data);
  }

  setVnodeAndHandler(vnode: VnodeWithDom, handler: DataSetHandler<T>) {
    this.#vnode = vnode;
    this.#handler = handler;
    this.reset(this.#data);
  }

  reset(data: T[]) {
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
        updateAttributes(child as VnodeWithDom, null);
        vnode.children[i] = child;
        patch(child as VnodeWithDom);
        continue;
      }

      child.isSVG = vnode.isSVG || child.tag === "svg";
      child.dom = createElement(child.tag as string, child.isSVG);
      vnode.dom.appendChild(child.dom);
      updateAttributes(child as VnodeWithDom, null);
      vnode.children.push(child);
      patch(child as VnodeWithDom);
    }

    for (let i = data.length; i < childrenLength; i++) {
      vnode.dom.removeChild(vnode.children[i].dom);
    }
    vnode.children.length = data.length;
  }

  add(...data: T[]) {
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
        child.dom = createElement(child.tag as string, child.isSVG);
        vnode.dom.appendChild(child.dom);
        updateAttributes(child as VnodeWithDom, null);
        vnode.children.push(child);
        patch(child as VnodeWithDom);
      }
    }
  }

  delete(index: number) {
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

  update(index: number, item: Partial<T>) {
    if (this.#data && this.#vnode && this.#handler) {
      const child = this.#vnode.children[index];
      if (this.#isFrozen) {
        this.#setData(this.#data.map((d, i) => (i === index ? { ...d, ...item } : d)));
      } else {
        this.#data[index] = { ...this.#data[index], ...item };
      }
      const newChild = this.#handler(this.#data[index], index);
      newChild.isSVG = this.#vnode.isSVG || newChild.tag === "svg";
      newChild.dom = child.dom;
      this.#vnode.children[index] = newChild;
      updateAttributes(newChild as VnodeWithDom, null);
      patch(newChild as VnodeWithDom);
    }
  }
}

directive("with-dataset", (dataSet: DataSet<any>, vnode: VnodeWithDom) => {
  dataSet.setVnodeAndHandler(vnode, vnode.children[0]);
  return false;
});
