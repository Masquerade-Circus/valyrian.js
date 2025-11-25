export function deepFreeze(obj: any, freezeClassInstances: boolean = false, seen = new WeakSet()): any {
  if (obj === null || typeof obj !== "object" || seen.has(obj) || Object.isFrozen(obj)) {
    return obj;
  }

  seen.add(obj);

  if (Array.isArray(obj)) {
    for (let i = 0, l = obj.length; i < l; i++) {
      deepFreeze(obj[i], freezeClassInstances, seen);
    }
  } else {
    const props = Reflect.ownKeys(obj);
    for (let i = 0, l = props.length; i < l; i++) {
      deepFreeze(obj[props[i]], freezeClassInstances, seen);
    }

    // If the object is an instance of a class (not a plain object or array) we need to freeze the prototype
    if (freezeClassInstances) {
      const proto = Object.getPrototypeOf(obj);
      if (proto && proto !== Object.prototype) {
        deepFreeze(proto, freezeClassInstances, seen);
      }
    }
  }

  Object.freeze(obj);

  return obj;
}

export function deepCloneUnfreeze<T>(obj: T, cloneClassInstances = false, seen = new WeakMap()): T {
  if (typeof obj === "undefined" || obj === null || typeof obj !== "object") {
    return obj;
  }

  if (seen.has(obj)) {
    return seen.get(obj);
  }

  let clone: any;
  let cloned = false;

  switch (true) {
    case Array.isArray(obj): {
      clone = [];
      for (let i = 0, l = obj.length; i < l; i++) {
        clone[i] = deepCloneUnfreeze(obj[i], cloneClassInstances, seen);
      }
      cloned = true;
      break;
    }
    case obj instanceof Date: {
      clone = new Date(obj.getTime());
      cloned = true;
      break;
    }
    case obj instanceof RegExp: {
      clone = new RegExp(obj.source, obj.flags);
      cloned = true;
      break;
    }
    case obj instanceof Map: {
      clone = new Map();
      for (const [key, value] of obj.entries()) {
        clone.set(
          deepCloneUnfreeze(key, cloneClassInstances, seen),
          deepCloneUnfreeze(value, cloneClassInstances, seen)
        );
      }
      cloned = true;
      break;
    }
    case obj instanceof Set: {
      clone = new Set();
      for (const value of obj.values()) {
        clone.add(deepCloneUnfreeze(value, cloneClassInstances, seen));
      }
      cloned = true;
      break;
    }
    case obj instanceof ArrayBuffer: {
      clone = obj.slice(0);
      cloned = true;
      break;
    }
    // TypedArrays and DataView
    case ArrayBuffer.isView(obj): {
      clone = new (obj as any).constructor(obj.buffer.slice(0));
      cloned = true;
      break;
    }
    // Node.js Buffer
    case typeof Buffer !== "undefined" && obj instanceof Buffer: {
      clone = Buffer.from(obj);
      cloned = true;
      break;
    }
    case obj instanceof Error: {
      clone = new (obj as any).constructor(obj.message);
      break;
    }
    // Non clonable objects
    case obj instanceof Promise ||
      obj instanceof WeakMap ||
      obj instanceof WeakSet ||
      typeof obj === "function" ||
      typeof obj === "symbol": {
      clone = obj;
      cloned = true;
      break;
    }
    // Instance of a class
    case obj.constructor && obj.constructor !== Object: {
      if (!cloneClassInstances) {
        clone = obj;
        cloned = true;
        break;
      }
      clone = Object.create(Object.getPrototypeOf(obj));
      break;
    }

    // Plain objects
    default: {
      clone = {};

      for (const key in obj) {
        clone[key] = deepCloneUnfreeze(obj[key], cloneClassInstances, seen);
      }

      cloned = true;
      break;
    }
  }

  seen.set(obj, clone);

  if (!cloned) {
    const descriptors = Object.getOwnPropertyDescriptors(obj);
    for (const key of Reflect.ownKeys(descriptors)) {
      const descriptor = descriptors[key as string];
      if ("value" in descriptor) {
        descriptor.value = deepCloneUnfreeze(descriptor.value, cloneClassInstances, seen);
      }
      Object.defineProperty(clone, key, descriptor);
    }
  }

  return clone;
}
