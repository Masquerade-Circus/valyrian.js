/* eslint-disable no-console */
import { get } from "valyrian.js/utils";

const translations: Record<string, Record<string, any>> = {};
let lang = "en";

export function t(path: string, params?: Record<string, string>): string {
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

export function setTranslations(
  defaultTranslation: Record<string, any>,
  newTranslations: Record<string, Record<string, any>>
) {
  for (const lang in translations) {
    Reflect.deleteProperty(translations, lang);
  }

  for (const lang in newTranslations) {
    translations[lang] = {
      ...defaultTranslation,
      ...newTranslations[lang]
    };
  }
}

export function getTranslations(): Record<string, Record<string, any>> {
  return translations;
}

export function setLang(newLang: string): void {
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

export function getLang(): string {
  return lang;
}

export class NumberFormatter {
  #value: number = 0;

  get value(): number {
    return this.#value;
  }

  private constructor() {}

  public set(newValue: number | string, shiftDecimal = false) {
    this.#value = this.clean(newValue, shiftDecimal);
    return this;
  }

  private clean(value: string | number, shiftDecimal = false): number {
    let stringNumber = String(value).replace(/[^0-9.-]+/g, "");

    if (shiftDecimal) {
      stringNumber = stringNumber.replace(/\./g, "");
    }

    const number = Number(stringNumber);

    return isNaN(number) ? 0 : number;
  }

  format(digits = 2, options: Intl.NumberFormatOptions = {}, customLocale?: Intl.LocalesArgument): string {
    const lang = customLocale || getLang();
    const formatter = new Intl.NumberFormat(lang, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      ...options
    });

    return formatter.format(this.#value);
  }

  fromDecimalPlaces(decimalPlaces: number) {
    const currentDecimalPlaces = this.getDecimalPlaces();
    const factor = Math.pow(10, decimalPlaces - currentDecimalPlaces);
    this.#value = Number((this.#value / factor).toFixed(decimalPlaces));
    return this;
  }

  // Ex toDecimalPlaces(1) = 123.456 -> 12345.6
  toDecimalPlaces(decimalPlaces: number) {
    const currentDecimalPlaces = this.getDecimalPlaces();
    const factor = Math.pow(10, currentDecimalPlaces - decimalPlaces);
    this.#value = Number((this.#value * factor).toFixed(decimalPlaces));
    return this;
  }

  getDecimalPlaces(): number {
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

  static create(value: number | string = 0, shiftDecimal = false): NumberFormatter {
    const formatter = new NumberFormatter();
    return formatter.set(value, shiftDecimal);
  }
}
