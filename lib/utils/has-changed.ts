// Utility function to check if dependencies have changed recursively
// eslint-disable-next-line sonarjs/cognitive-complexity
export function hasChanged(prev: any, current: any) {
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
