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
export {
  get,
  hasChanged,
  set
};
