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

  switch (true) {
    case Array.isArray(obj): {
      clone = [];
      seen.set(obj, clone);
      for (let i = 0, l = obj.length; i < l; i++) {
        clone[i] = deepCloneUnfreeze(obj[i], cloneClassInstances, seen);
      }
      return clone;
    }
    case obj instanceof Date: {
      clone = new Date(obj.getTime());
      seen.set(obj, clone);
      return clone;
    }
    case obj instanceof RegExp: {
      clone = new RegExp(obj.source, obj.flags);
      seen.set(obj, clone);
      return clone;
    }
    case obj instanceof Map: {
      clone = new Map();
      seen.set(obj, clone);
      for (const [key, value] of obj.entries()) {
        clone.set(
          deepCloneUnfreeze(key, cloneClassInstances, seen),
          deepCloneUnfreeze(value, cloneClassInstances, seen)
        );
      }
      return clone;
    }
    case obj instanceof Set: {
      clone = new Set();
      seen.set(obj, clone);
      for (const value of obj.values()) {
        clone.add(deepCloneUnfreeze(value, cloneClassInstances, seen));
      }
      return clone;
    }
    case obj instanceof ArrayBuffer: {
      clone = obj.slice(0);
      seen.set(obj, clone);
      return clone;
    }
    // TypedArrays and DataView
    case ArrayBuffer.isView(obj): {
      clone = new (obj as any).constructor(obj.buffer.slice(0));
      seen.set(obj, clone);
      return clone;
    }
    // Node.js Buffer
    case typeof Buffer !== "undefined" && obj instanceof Buffer: {
      clone = Buffer.from(obj);
      seen.set(obj, clone);
      return clone;
    }
    case obj instanceof Error: {
      clone = new (obj as any).constructor(obj.message);
      seen.set(obj, clone);
      break;
    }
    // Non clonable objects
    case obj instanceof Promise || obj instanceof WeakMap || obj instanceof WeakSet: {
      clone = obj;
      seen.set(obj, clone);
      return clone;
    }
    // Instance of a class
    case obj.constructor && obj.constructor !== Object: {
      if (!cloneClassInstances) {
        clone = obj;
        seen.set(obj, clone);
        return clone;
      }
      clone = Object.create(Object.getPrototypeOf(obj));
      seen.set(obj, clone);
      break;
    }

    // Plain objects
    default: {
      clone = {};
      seen.set(obj, clone);

      const keys = Reflect.ownKeys(obj);
      for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i];
        clone[key as string] = deepCloneUnfreeze((obj as any)[key as string], cloneClassInstances, seen);
      }
      return clone;
    }
  }

  const descriptors = Object.getOwnPropertyDescriptors(obj);
  for (const key of Reflect.ownKeys(descriptors)) {
    const descriptor = descriptors[key as string];
    if ("value" in descriptor) {
      descriptor.value = deepCloneUnfreeze(descriptor.value, cloneClassInstances, seen);
    }
    Object.defineProperty(clone, key, descriptor);
  }

  return clone;
}
