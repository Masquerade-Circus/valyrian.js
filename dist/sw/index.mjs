// lib/sw/index.ts
var localValyrian = {
  isNodeJs: Boolean(typeof process !== "undefined" && process.versions && process.versions.node)
};
async function registerSw(file = "./sw.js", options = { scope: "/" }) {
  if (localValyrian.isNodeJs) {
    return;
  }
  await navigator.serviceWorker.register(file, options);
  return navigator.serviceWorker;
}
var plugin = (v) => {
  localValyrian = v;
  v.registerSw = registerSw;
  return registerSw;
};
export {
  plugin,
  registerSw
};
