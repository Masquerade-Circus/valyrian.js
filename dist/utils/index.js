"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/utils/index.ts
var index_exports = {};
__export(index_exports, {
  deepCloneUnfreeze: () => deepCloneUnfreeze,
  deepFreeze: () => deepFreeze,
  get: () => get,
  hasChanged: () => hasChanged,
  set: () => set
});
module.exports = __toCommonJS(index_exports);

// lib/utils/getter-setter.ts
function get(obj, path, defaultValue) {
  if (!path || typeof path !== "string" || !obj || typeof obj !== "object") {
    return defaultValue;
  }
  const result = path.split(".").reduce((acc, part) => acc && acc?.[part], obj);
  if (typeof result === "undefined") {
    return defaultValue || null;
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
      clone = /* @__PURE__ */ new Map();
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
      clone = /* @__PURE__ */ new Set();
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
      clone = new obj.constructor(obj.buffer.slice(0));
      cloned = true;
      break;
    }
    // Node.js Buffer
    case (typeof Buffer !== "undefined" && obj instanceof Buffer): {
      clone = Buffer.from(obj);
      cloned = true;
      break;
    }
    case obj instanceof Error: {
      clone = new obj.constructor(obj.message);
      break;
    }
    // Non clonable objects
    case (obj instanceof Promise || obj instanceof WeakMap || obj instanceof WeakSet || typeof obj === "function" || typeof obj === "symbol"): {
      clone = obj;
      cloned = true;
      break;
    }
    // Instance of a class
    case (obj.constructor && obj.constructor !== Object): {
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
      const descriptor = descriptors[key];
      if ("value" in descriptor) {
        descriptor.value = deepCloneUnfreeze(descriptor.value, cloneClassInstances, seen);
      }
      Object.defineProperty(clone, key, descriptor);
    }
  }
  return clone;
}
