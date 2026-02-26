// lib/utils/getter-setter.ts
function get(obj, path, defaultValue) {
  if (!path || typeof path !== "string" || !obj || typeof obj !== "object") {
    return defaultValue;
  }
  const result = path.split(".").reduce((acc, part) => acc && acc?.[part], obj);
  if (typeof result === "undefined") {
    return defaultValue ?? null;
  }
  return result;
}
function set(obj, path, value) {
  if (!path || typeof path !== "string" || !obj || typeof obj !== "object") {
    return;
  }
  const parts = path.split(".");
  const last = parts.pop();
  if (!last) {
    return;
  }
  let target = obj;
  for (const part of parts) {
    if (!target[part]) {
      target[part] = {};
    }
    target = target[part];
  }
  target[last] = value;
}

// lib/utils/has-changed.ts
function hasChanged(prev, current) {
  if (Array.isArray(prev)) {
    if (Array.isArray(current) === false) {
      return true;
    }
    if (prev.length !== current.length) {
      return true;
    }
    for (let i = 0; i < current.length; i++) {
      if (hasChanged(prev[i], current[i])) {
        return true;
      }
    }
    return false;
  }
  if (typeof prev === "object" && prev !== null) {
    if (typeof current !== "object" || current === null) {
      return true;
    }
    for (const key in current) {
      if (hasChanged(prev[key], current[key])) {
        return true;
      }
    }
    for (const key in prev) {
      if (hasChanged(prev[key], current[key])) {
        return true;
      }
    }
    return false;
  }
  return Object.is(prev, current) === false;
}

// lib/utils/deep-freeze.ts
function deepFreeze(obj, freezeClassInstances = false, seen = /* @__PURE__ */ new WeakSet()) {
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
function deepCloneUnfreeze(obj, cloneClassInstances = false, seen = /* @__PURE__ */ new WeakMap()) {
  if (typeof obj === "undefined" || obj === null || typeof obj !== "object") {
    return obj;
  }
  if (seen.has(obj)) {
    return seen.get(obj);
  }
  let clone;
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
      clone = /* @__PURE__ */ new Map();
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
      clone = /* @__PURE__ */ new Set();
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
      clone = new obj.constructor(obj.buffer.slice(0));
      seen.set(obj, clone);
      return clone;
    }
    // Node.js Buffer
    case (typeof Buffer !== "undefined" && obj instanceof Buffer): {
      clone = Buffer.from(obj);
      seen.set(obj, clone);
      return clone;
    }
    case obj instanceof Error: {
      clone = new obj.constructor(obj.message);
      seen.set(obj, clone);
      break;
    }
    // Non clonable objects
    case (obj instanceof Promise || obj instanceof WeakMap || obj instanceof WeakSet): {
      clone = obj;
      seen.set(obj, clone);
      return clone;
    }
    // Instance of a class
    case (obj.constructor && obj.constructor !== Object): {
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
        clone[key] = deepCloneUnfreeze(obj[key], cloneClassInstances, seen);
      }
      return clone;
    }
  }
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  for (const key of Reflect.ownKeys(descriptors)) {
    const descriptor = descriptors[key];
    if ("value" in descriptor) {
      descriptor.value = deepCloneUnfreeze(descriptor.value, cloneClassInstances, seen);
    }
    Object.defineProperty(clone, key, descriptor);
  }
  return clone;
}

// lib/utils/validators.ts
function isEmpty(value) {
  return value === null || value === void 0 || typeof value === "string" && value.trim() === "" || Array.isArray(value) && value.length === 0 || typeof value === "object" && Object.keys(value).length === 0;
}
function is(value, type) {
  if (typeof type !== "string") {
    return value instanceof type;
  }
  if (type === "array") {
    return Array.isArray(value);
  }
  if (type === "object") {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  if (type === "number") {
    return typeof value === "number" && !isNaN(value);
  }
  return typeof value === type;
}
function isFunction(value) {
  return is(value, "function");
}
function isString(value) {
  return is(value, "string");
}
function isNumber(value) {
  return is(value, "number");
}
function isFiniteNumber(value) {
  return isNumber(value) && Number.isFinite(value);
}
function isBoolean(value) {
  return is(value, "boolean");
}
function isObject(value) {
  return is(value, "object");
}
function hasLength(value, length) {
  if (isString(value)) {
    return value.length === length;
  }
  return Array.isArray(value) && value.length === length;
}
function hasMinLength(value, length) {
  if (isString(value)) {
    return value.length >= length;
  }
  return Array.isArray(value) && value.length >= length;
}
function hasMaxLength(value, length) {
  if (isString(value)) {
    return value.length <= length;
  }
  return Array.isArray(value) && value.length <= length;
}
function hasLengthBetween(value, min, max) {
  if (isString(value)) {
    return value.length >= min && value.length <= max;
  }
  return Array.isArray(value) && value.length >= min && value.length <= max;
}
function isLessThan(value, limit) {
  return isNumber(value) && value < limit;
}
function isGreaterThan(value, limit) {
  return isNumber(value) && value > limit;
}
function isBetween(value, min, max) {
  return isNumber(value) && value >= min && value <= max;
}
function pick(source, keys) {
  const result = {};
  if (!source || typeof source !== "object") {
    return result;
  }
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = source[key];
    }
  }
  return result;
}
function ensureIn(value, allowed) {
  return allowed.includes(value);
}
export {
  deepCloneUnfreeze,
  deepFreeze,
  ensureIn,
  get,
  hasChanged,
  hasLength,
  hasLengthBetween,
  hasMaxLength,
  hasMinLength,
  is,
  isBetween,
  isBoolean,
  isEmpty,
  isFiniteNumber,
  isFunction,
  isGreaterThan,
  isLessThan,
  isNumber,
  isObject,
  isString,
  pick,
  set
};
