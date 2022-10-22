import { isNodeJs } from "valyrian.js";

export async function registerSw(file = "./sw.js", options: RegistrationOptions = { scope: "/" }) {
  if (isNodeJs) {
    return;
  }
  await navigator.serviceWorker.register(file, options);
  return navigator.serviceWorker;
}
