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
var utils_exports = {};
__export(utils_exports, {
  get: () => get,
  hasChanged: () => hasChanged,
  set: () => set
});
module.exports = __toCommonJS(utils_exports);

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
