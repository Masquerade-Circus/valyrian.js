// Utility function to check if dependencies have changed recursively
// eslint-disable-next-line sonarjs/cognitive-complexity
function hasChangedRecursive(prev: any, current: any, seen = new WeakMap()) {
  if (Array.isArray(prev)) {
    if (Array.isArray(current) === false) {
      return true;
    }

    if (prev.length !== current.length) {
      return true;
    }

    for (let i = 0; i < current.length; i++) {
      if (hasChangedRecursive(prev[i], current[i], seen)) {
        return true;
      }
    }

    return false;
  }

  if (typeof prev === "object" && prev !== null) {
    if (typeof current !== "object" || current === null) {
      return true;
    }

    if (seen.has(prev)) {
      return seen.get(prev) !== current;
    }

    seen.set(prev, current);

    const prevKeys = Object.keys(prev);
    const currentKeys = Object.keys(current);

    if (prevKeys.length !== currentKeys.length) {
      return true;
    }

    for (let i = 0; i < currentKeys.length; i++) {
      const key = currentKeys[i];
      if (hasChangedRecursive(prev[key], current[key], seen)) {
        return true;
      }
    }

    for (let i = 0; i < prevKeys.length; i++) {
      const key = prevKeys[i];
      if (hasChangedRecursive(prev[key], current[key], seen)) {
        return true;
      }
    }

    return false;
  }

  return Object.is(prev, current) === false;
}

export function hasChanged(prev: any, current: any) {
  return hasChangedRecursive(prev, current, new WeakMap());
}
