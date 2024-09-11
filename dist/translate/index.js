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
var translate_exports = {};
__export(translate_exports, {
  NumberFormatter: () => NumberFormatter,
  getLang: () => getLang,
  getTranslations: () => getTranslations,
  setLang: () => setLang,
  setTranslations: () => setTranslations,
  t: () => t
});
module.exports = __toCommonJS(translate_exports);
var import_utils = require("valyrian.js/utils");
var translations = {};
var lang = "en";
function t(path, params) {
  const langDef = translations[lang];
  const translation = (0, import_utils.get)(langDef, path);
  if (typeof translation !== "string") {
    console.warn(`Translation not found for ${path}`);
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
function setTranslations(defaultTranslation, newTranslations) {
  for (const lang2 in translations) {
    Reflect.deleteProperty(translations, lang2);
  }
  for (const lang2 in newTranslations) {
    translations[lang2] = {
      ...defaultTranslation,
      ...newTranslations[lang2]
    };
  }
}
function getTranslations() {
  return translations;
}
function setLang(newLang) {
  if (typeof newLang !== "string") {
    throw new Error(`Language ${newLang} not found`);
  }
  const parsedLang = newLang.toLowerCase().split("-").shift()?.split("_").shift();
  if (typeof parsedLang !== "string") {
    throw new Error(`Language ${newLang} not found`);
  }
  if (!translations[parsedLang]) {
    throw new Error(`Language ${newLang} not found`);
  }
  lang = parsedLang;
}
function getLang() {
  return lang;
}
var NumberFormatter = class _NumberFormatter {
  #value = 0;
  get value() {
    return this.#value;
  }
  constructor() {
  }
  set(newValue, shiftDecimal = false) {
    this.#value = this.clean(newValue, shiftDecimal);
    return this;
  }
  clean(value, shiftDecimal = false) {
    let stringNumber = String(value).replace(/[^0-9.-]+/g, "");
    if (shiftDecimal) {
      stringNumber = stringNumber.replace(/\./g, "");
    }
    const number = Number(stringNumber);
    return isNaN(number) ? 0 : number;
  }
  format(digits = 2, options = {}, customLocale) {
    const lang2 = customLocale || getLang();
    const formatter = new Intl.NumberFormat(lang2, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      ...options
    });
    return formatter.format(this.#value);
  }
  fromDecimalPlaces(decimalPlaces) {
    const currentDecimalPlaces = this.getDecimalPlaces();
    const factor = Math.pow(10, decimalPlaces - currentDecimalPlaces);
    this.#value = Number((this.#value / factor).toFixed(decimalPlaces));
    return this;
  }
  // Ex toDecimalPlaces(1) = 123.456 -> 12345.6
  toDecimalPlaces(decimalPlaces) {
    const currentDecimalPlaces = this.getDecimalPlaces();
    const factor = Math.pow(10, currentDecimalPlaces - decimalPlaces);
    this.#value = Number((this.#value * factor).toFixed(decimalPlaces));
    return this;
  }
  getDecimalPlaces() {
    if (Math.floor(this.#value) === this.#value) {
      return 0;
    }
    const stringValue = String(this.#value);
    const decimalIndex = stringValue.indexOf(".");
    return decimalIndex === -1 ? 0 : stringValue.length - decimalIndex - 1;
  }
  shiftDecimalPlaces() {
    return this.toDecimalPlaces(0);
  }
  static create(value = 0, shiftDecimal = false) {
    const formatter = new _NumberFormatter();
    return formatter.set(value, shiftDecimal);
  }
};
