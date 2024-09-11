// lib/translate/index.ts
import { get } from "valyrian.js/utils";
var translations = {};
var lang = "es";
function t(path, params) {
  const langDef = translations[lang];
  const translation = get(langDef, path);
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
  return t;
}
function setLang(newLang) {
  if (typeof newLang !== "string") {
    console.error(`Language ${newLang} not found`);
    return;
  }
  const parsedLang = newLang.toLowerCase().split("-").shift()?.split("_").shift();
  if (typeof parsedLang !== "string") {
    console.error(`Language ${newLang} not found`);
    return;
  }
  if (!translations[parsedLang]) {
    console.error(`Language ${newLang} not found`);
    return;
  }
  lang = parsedLang;
}
var NumberFormatter = class _NumberFormatter {
  #value = 0;
  get value() {
    return this.#value;
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
  format(digits = 2) {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
    return formatter.format(this.#value);
  }
  fromDecimalPlaces(decimalPlaces) {
    const factor = Math.pow(10, decimalPlaces);
    this.#value = Math.round(this.#value * factor);
    return this;
  }
  toDecimalPlaces(decimalPlaces) {
    const factor = Math.pow(10, decimalPlaces);
    this.#value = this.#value / factor;
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
  shiftDecimal() {
    return this.fromDecimalPlaces(this.getDecimalPlaces());
  }
  static create(value = 0, shiftDecimal = false) {
    const formatter = new _NumberFormatter();
    return formatter.set(value, shiftDecimal);
  }
};
export {
  NumberFormatter,
  setLang,
  setTranslations
};
