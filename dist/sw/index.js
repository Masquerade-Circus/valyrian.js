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

// lib/sw/index.ts
var sw_exports = {};
__export(sw_exports, {
  registerSw: () => registerSw
});
module.exports = __toCommonJS(sw_exports);
var import_valyrian = require("valyrian.js");
async function registerSw(file = "./sw.js", options = { scope: "/" }) {
  if (import_valyrian.isNodeJs) {
    return;
  }
  await navigator.serviceWorker.register(file, options);
  return navigator.serviceWorker;
}
