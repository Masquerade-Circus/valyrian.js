import { directive, setPropNameReserved, update, VnodeWithDom } from "valyrian.js";
import { get, isString } from "valyrian.js/utils";

const translations: Record<string, Record<string, any>> = {};
let currentLang = "en";

let storeStrategy = {
  get: () => currentLang,
  set: (lang: string) => {
    currentLang = lang;
  }
};

let log = false;

export function setLog(value: boolean) {
  log = value;
}

export function setStoreStrategy(strategy: { get: () => string; set: (lang: string) => void }) {
  storeStrategy = strategy;
}

export function getLang(): string {
  return storeStrategy.get();
}

export function setLang(newLang: string): void {
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

  storeStrategy.set(parsedLang);
  update();
}

export function t(path: string, params?: Record<string, string>): string {
  const langDef = translations[getLang()];
  const translation = get(langDef, path);

  if (!isString(translation)) {
    if (log) {
      // eslint-disable-next-line no-console
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

export function setTranslations(
  defaultTranslation: Record<string, any>,
  newTranslations: Record<string, Record<string, any>> = {}
) {
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

export function getTranslations(): Record<string, Record<string, any>> {
  return translations;
}

directive("t", (value: string | null, vnode: VnodeWithDom): void => {
  const keys = isString(value) ? [value] : vnode.children;
  const params = vnode.props["v-t-params"] || {};
  const children = keys.map((key) => (isString(key) && key.trim().length > 1 ? t(key.trim(), params) : key));
  vnode.children = children;
});

setPropNameReserved("v-t-params");
