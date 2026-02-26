// Dot notation: get(obj, 'a.b.c' ) === obj.a.b.c
// get(obj, 'a.0.c') === obj.a[0].c
export function get(obj: unknown, path: string, defaultValue?: unknown) {
  if (!path || typeof path !== "string" || !obj || typeof obj !== "object") {
    return defaultValue;
  }

  const result = path.split(".").reduce((acc: any, part) => acc && acc?.[part], obj);

  if (typeof result === "undefined") {
    return defaultValue ?? null;
  }

  return result;
}

// Dot notation: set(obj, 'a.b.c', value) === obj.a.b.c = value
// set(obj, 'a.0.c', value) === obj.a[0].c = value
export function set(obj: any, path: string, value: any) {
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
