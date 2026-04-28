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

// lib/money/index.ts
var index_exports = {};
__export(index_exports, {
  Money: () => Money,
  NumberFormatter: () => NumberFormatter,
  formatMoney: () => formatMoney,
  parseMoneyInput: () => parseMoneyInput
});
module.exports = __toCommonJS(index_exports);
var import_valyrian = require("valyrian.js");
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
  format(digits = 2, options = {}, locale = "en") {
    const formatter = new Intl.NumberFormat(locale, {
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
var Money = class _Money {
  cents;
  constructor(cents) {
    this.cents = Math.trunc(cents);
  }
  static fromCents(cents) {
    return new _Money(cents);
  }
  static fromDecimal(value, decimalPlaces = 2) {
    const factor = Math.pow(10, decimalPlaces);
    return new _Money(Math.round(value * factor));
  }
  toCents() {
    return this.cents;
  }
  toDecimal(decimalPlaces = 2) {
    const factor = Math.pow(10, decimalPlaces);
    return this.cents / factor;
  }
  add(other) {
    return new _Money(this.cents + other.toCents());
  }
  subtract(other) {
    return new _Money(this.cents - other.toCents());
  }
  multiply(multiplier) {
    return new _Money(Math.round(this.cents * multiplier));
  }
  divide(divider) {
    if (divider === 0) {
      throw new Error("Cannot divide by zero");
    }
    return new _Money(Math.round(this.cents / divider));
  }
};
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function getNumberSeparators(locale) {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  return {
    group: parts.find((part) => part.type === "group")?.value || ",",
    decimal: parts.find((part) => part.type === "decimal")?.value || "."
  };
}
function getLocalizedDigitMap(locale) {
  const formatter = new Intl.NumberFormat(locale, { useGrouping: false });
  const digitMap = /* @__PURE__ */ new Map();
  for (let digit = 0; digit <= 9; digit++) {
    digitMap.set(formatter.format(digit), String(digit));
  }
  return digitMap;
}
var unicodeZeroCodePoints = [1632, 1776, 2406];
function normalizeLocalizedDigits(value, locale) {
  let normalized = value;
  for (const [localizedDigit, digit] of getLocalizedDigitMap(locale)) {
    normalized = normalized.replace(new RegExp(escapeRegExp(localizedDigit), "g"), digit);
  }
  return normalized.replace(/\p{Decimal_Number}/gu, (digit) => {
    const codePoint = digit.codePointAt(0);
    if (codePoint === void 0) {
      return digit;
    }
    for (const zeroCodePoint of unicodeZeroCodePoints) {
      const value2 = codePoint - zeroCodePoint;
      if (value2 >= 0 && value2 <= 9) {
        return String(value2);
      }
    }
    return digit;
  });
}
function isValidGroupedInteger(value, separator) {
  if (!separator) {
    return false;
  }
  return new RegExp(`^[+-]?\\d{1,3}(${escapeRegExp(separator)}\\d{3})+$`).test(value);
}
function hasGroupedIntegerSuffix(value, separator) {
  const separatorIndex = value.lastIndexOf(separator);
  return separatorIndex !== -1 && /^\d{3}$/.test(value.slice(separatorIndex + separator.length));
}
function removeGrouping(value, separators) {
  let result = value;
  for (const separator of separators) {
    if (separator) {
      result = result.replace(new RegExp(escapeRegExp(separator), "g"), "");
    }
  }
  return result;
}
function chooseDecimalIndex(value, group, decimal) {
  const lastDot = value.lastIndexOf(".");
  const lastComma = value.lastIndexOf(",");
  if (lastDot !== -1 && lastComma !== -1) {
    return Math.max(lastDot, lastComma);
  }
  if (decimal && decimal !== group) {
    const decimalIndex = value.lastIndexOf(decimal);
    if (decimalIndex !== -1) {
      return decimalIndex;
    }
  }
  if (group) {
    const groupIndex = value.lastIndexOf(group);
    if (groupIndex !== -1 && !isValidGroupedInteger(value, group) && !hasGroupedIntegerSuffix(value, group)) {
      return groupIndex;
    }
  }
  const commonSeparator = lastDot !== -1 ? "." : lastComma !== -1 ? "," : "";
  if (commonSeparator && !isValidGroupedInteger(value, commonSeparator) && !(commonSeparator === group && hasGroupedIntegerSuffix(value, commonSeparator))) {
    return value.lastIndexOf(commonSeparator);
  }
  return -1;
}
function normalizeMoneyInput(value, locale) {
  const { group, decimal } = getNumberSeparators(locale);
  const normalized = normalizeLocalizedDigits(String(value), locale).replace(/[−]/g, "-").replace(new RegExp(`[^0-9${escapeRegExp(group)}${escapeRegExp(decimal)}.,+-]`, "g"), "");
  const separators = [group, decimal, ".", ","];
  const decimalIndex = chooseDecimalIndex(normalized, group, decimal);
  if (decimalIndex !== -1) {
    const integer = removeGrouping(normalized.slice(0, decimalIndex), separators);
    const fraction = removeGrouping(normalized.slice(decimalIndex + 1), separators);
    return `${integer}.${fraction}`;
  }
  return removeGrouping(normalized, separators);
}
function parseMoneyInput(value, options = {}) {
  const decimalPlaces = options.decimalPlaces ?? 2;
  const clean = normalizeMoneyInput(value, options.locale || "en");
  const amount = Number(clean);
  if (isNaN(amount)) {
    return Money.fromCents(0);
  }
  return Money.fromDecimal(amount, decimalPlaces);
}
function formatMoney(value, options = {}) {
  const digits = options.digits ?? 2;
  const decimalPlaces = options.decimalPlaces ?? 2;
  const currency = options.currency || "USD";
  const locale = options.locale || "en";
  const style = options.style || "currency";
  const amount = value instanceof Money ? value.toDecimal(decimalPlaces) : value;
  return NumberFormatter.create(amount).format(digits, { style, currency }, locale);
}
(0, import_valyrian.directive)("money", (config, vnode) => {
  const decimalPlaces = config.decimalPlaces ?? 2;
  const currency = config.currency || "USD";
  const locale = config.locale || "en";
  const cents = Number(config.model[config.field] || 0);
  const value = formatMoney(Money.fromCents(cents), {
    digits: decimalPlaces,
    decimalPlaces,
    currency,
    locale
  });
  (0, import_valyrian.setAttribute)("value", value, vnode);
  const prevOnInput = vnode.props.oninput;
  (0, import_valyrian.setAttribute)(
    "oninput",
    (event) => {
      const target = event.target;
      const money = parseMoneyInput(target.value, { locale, decimalPlaces });
      config.model[config.field] = money.toCents();
      target.value = formatMoney(money, {
        digits: decimalPlaces,
        decimalPlaces,
        currency,
        locale
      });
      if (typeof prevOnInput === "function") {
        prevOnInput(event);
      }
    },
    vnode
  );
});
