// lib/sw/index.ts
import { isNodeJs } from "valyrian.js";
async function registerSw(file = "./sw.js", options = { scope: "/" }) {
  if (isNodeJs) {
    return;
  }
  await navigator.serviceWorker.register(file, options);
  return navigator.serviceWorker;
}
export {
  registerSw
};
