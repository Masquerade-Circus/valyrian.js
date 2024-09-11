/* eslint-disable no-console */
import { get } from "valyrian.js/utils";

const translations: Record<string, Record<string, any>> = {};
let lang = "es";

interface TInterface {
  (path: string, params?: Record<string, string>): string;
}
function t(path: string, params?: Record<string, string>): string {
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
): TInterface {
  for (const lang in translations) {
    Reflect.deleteProperty(translations, lang);
  }

  for (const lang in newTranslations) {
    translations[lang] = {
      ...defaultTranslation,
      ...newTranslations[lang]
    };
  }

  return t;
}

export function setLang(newLang: string): void {
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

export class NumberFormatter {
  #value: number = 0;

  get value(): number {
    return this.#value;
  }

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

  format(digits = 2): string {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });

    return formatter.format(this.#value);
  }

  fromDecimalPlaces(decimalPlaces: number) {
    const factor = Math.pow(10, decimalPlaces);
    this.#value = Math.round(this.#value * factor);
    return this;
  }

  toDecimalPlaces(decimalPlaces: number) {
    const factor = Math.pow(10, decimalPlaces);
    this.#value = this.#value / factor;
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

  shiftDecimal() {
    return this.fromDecimalPlaces(this.getDecimalPlaces());
  }

  static create(value: number | string = 0, shiftDecimal = false): NumberFormatter {
    const formatter = new NumberFormatter();
    return formatter.set(value, shiftDecimal);
  }
}
