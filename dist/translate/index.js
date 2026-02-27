"use strict";
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

// lib/translate/index.ts
var index_exports = {};
__export(index_exports, {
  getLang: () => getLang,
  getTranslations: () => getTranslations,
  setLang: () => setLang,
  setLog: () => setLog,
  setStoreStrategy: () => setStoreStrategy,
  setTranslations: () => setTranslations,
  t: () => t
});
module.exports = __toCommonJS(index_exports);
var import_valyrian = require("valyrian.js");
var import_context = require("valyrian.js/context");
var import_utils = require("valyrian.js/utils");
var translations = {};
var currentLang = "en";
var storeStrategy = {
  get: () => currentLang,
  set: (lang) => {
    currentLang = lang;
  }
};
var langContextScope = (0, import_context.createContextScope)("translate.lang");
var log = false;
function setLog(value) {
  log = value;
}
function setStoreStrategy(strategy) {
  storeStrategy = strategy;
}
function getLang() {
  if (import_valyrian.isNodeJs && (0, import_context.isServerContextActive)()) {
    const contextLang = (0, import_context.getContext)(langContextScope);
    if ((0, import_utils.isString)(contextLang)) {
      return contextLang;
    }
  }
  return storeStrategy.get();
}
function setLang(newLang) {
  if (!(0, import_utils.isString)(newLang)) {
    throw new Error(`Language ${newLang} not found`);
  }
  const parsedLang = newLang.toLowerCase().split("-").shift()?.split("_").shift();
  if (!(0, import_utils.isString)(parsedLang)) {
    throw new Error(`Language ${newLang} not found`);
  }
  if (!translations[parsedLang]) {
    throw new Error(`Language ${newLang} not found`);
  }
  if (import_valyrian.isNodeJs && (0, import_context.isServerContextActive)()) {
    (0, import_context.setContext)(langContextScope, parsedLang);
  } else {
    storeStrategy.set(parsedLang);
  }
  (0, import_valyrian.update)();
}
function t(path, params) {
  const langDef = translations[getLang()];
  const translation = (0, import_utils.get)(langDef, path);
  if (!(0, import_utils.isString)(translation)) {
    if (log) {
      console.warn(`Translation not found for ${path}`);
    }
    return path;
  }
  if (!params) {
    return translation;
  }
  return translation.replace(/{(\w+)}/g, (_, key) => {
    if (key in params) {
      return params[key];
    }
    return `{${key}}`;
  });
}
function setTranslations(defaultTranslation, newTranslations = {}) {
  for (const lang in translations) {
    Reflect.deleteProperty(translations, lang);
  }
  translations.en = { ...defaultTranslation };
  for (const lang in newTranslations) {
    translations[lang] = {
      ...defaultTranslation,
      ...newTranslations[lang]
    };
  }
  (0, import_valyrian.update)();
}
function getTranslations() {
  return translations;
}
(0, import_valyrian.directive)("t", (value, vnode) => {
  const keys = (0, import_utils.isString)(value) ? [value] : vnode.children;
  const params = vnode.props["v-t-params"] || {};
  const children = keys.map((key) => (0, import_utils.isString)(key) && key.trim().length > 1 ? t(key.trim(), params) : key);
  vnode.children = children;
});
(0, import_valyrian.setPropNameReserved)("v-t-params");
