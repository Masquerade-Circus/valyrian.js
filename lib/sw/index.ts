import { Valyrian } from "Valyrian";

let localValyrian: Valyrian = {
  isNodeJs: Boolean(typeof process !== "undefined" && process.versions && process.versions.node)
} as unknown as Valyrian;

declare module "Valyrian" {
  // eslint-disable-next-line no-unused-vars
  interface Valyrian {
    // eslint-disable-next-line no-unused-vars, no-use-before-define
    registerSw?: typeof registerSw;
  }
}

export async function registerSw(file = "./sw.js", options: RegistrationOptions = { scope: "/" }) {
  if (localValyrian.isNodeJs) {
    return;
  }
  await navigator.serviceWorker.register(file, options);
  return navigator.serviceWorker;
}

const plugin = (v: Valyrian) => {
  localValyrian = v;
  v.registerSw = registerSw;
  return registerSw;
};

export default plugin;
