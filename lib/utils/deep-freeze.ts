export function deepFreeze(obj: any): any {
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

      // If the object is an instance of a class (not a plain object or array) we need to freeze the prototype
      const proto = Object.getPrototypeOf(obj);
      if (proto && proto !== Object.prototype) {
        deepFreeze(proto);
      }
    }
    Object.freeze(obj);
  }

  return obj;
}

export function deepCloneUnfreeze<T>(obj: T): T {
  if (typeof obj === "undefined" || obj === null || typeof obj !== "object") {
    return obj;
  }

  // If the object is an instance of a class (not a plain object or array) we need to clone it
  // This could not work with classes that have required parameters in the constructor
  if (obj.constructor && obj.constructor !== Object && obj.constructor !== Array) {
    const clone = Reflect.construct(obj.constructor, []);

    for (const key of Reflect.ownKeys(obj)) {
      const value = (obj as Record<string | symbol, any>)[key];
      (clone as Record<string | symbol, any>)[key] = deepCloneUnfreeze(value);
    }

    return clone;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepCloneUnfreeze(item)) as unknown as T;
  }

  const clone = {} as T;
  for (const key of Reflect.ownKeys(obj)) {
    const value = (obj as Record<string | symbol, any>)[key];
    (clone as Record<string | symbol, any>)[key] = deepCloneUnfreeze(value);
  }

  return clone;
}
