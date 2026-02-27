// lib/translate/index.ts
import { directive, isNodeJs, setPropNameReserved, update } from "valyrian.js";
import { createContextScope, getContext, isServerContextActive, setContext } from "valyrian.js/context";
import { get, isString } from "valyrian.js/utils";
var translations = {};
var currentLang = "en";
var storeStrategy = {
  get: () => currentLang,
  set: (lang) => {
    currentLang = lang;
  }
};
var langContextScope = createContextScope("translate.lang");
var log = false;
function setLog(value) {
  log = value;
}
function setStoreStrategy(strategy) {
  storeStrategy = strategy;
}
function getLang() {
  if (isNodeJs && isServerContextActive()) {
    const contextLang = getContext(langContextScope);
    if (isString(contextLang)) {
      return contextLang;
    }
  }
  return storeStrategy.get();
}
function setLang(newLang) {
  if (!isString(newLang)) {
    throw new Error(`Language ${newLang} not found`);
  }
  const parsedLang = newLang.toLowerCase().split("-").shift()?.split("_").shift();
  if (!isString(parsedLang)) {
    throw new Error(`Language ${newLang} not found`);
  }
  if (!translations[parsedLang]) {
    throw new Error(`Language ${newLang} not found`);
  }
  if (isNodeJs && isServerContextActive()) {
    setContext(langContextScope, parsedLang);
  } else {
    storeStrategy.set(parsedLang);
  }
  update();
}
function t(path, params) {
  const langDef = translations[getLang()];
  const translation = get(langDef, path);
  if (!isString(translation)) {
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
  update();
}
function getTranslations() {
  return translations;
}
directive("t", (value, vnode) => {
  const keys = isString(value) ? [value] : vnode.children;
  const params = vnode.props["v-t-params"] || {};
  const children = keys.map((key) => isString(key) && key.trim().length > 1 ? t(key.trim(), params) : key);
  vnode.children = children;
});
setPropNameReserved("v-t-params");
export {
  getLang,
  getTranslations,
  setLang,
  setLog,
  setStoreStrategy,
  setTranslations,
  t
};
