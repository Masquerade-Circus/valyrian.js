// Model an application shimming process in its own bundle context.
export const nodeVersion = "fixture";
Object.defineProperty(globalThis, "process", { value: { versions: { node: nodeVersion } } });
