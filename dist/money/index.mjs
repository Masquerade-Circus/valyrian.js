// lib/money/index.ts
import { directive, setAttribute } from "valyrian.js";
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
function parseMoneyInput(value, options = {}) {
  const decimalPlaces = options.decimalPlaces ?? 2;
  const clean = String(value).replace(/\s/g, "").replace(/[^0-9,.-]/g, "").replace(/,(?=\d{3}(\D|$))/g, "").replace(/,/g, ".");
  const amount = Number(clean);
  if (isNaN(amount)) {
    return Money.fromCents(0);
  }
  return Money.fromDecimal(amount, decimalPlaces);
}
function formatMoney(value, options = {}) {
  const digits = options.digits ?? 2;
  const currency = options.currency || "USD";
  const locale = options.locale || "en";
  const style = options.style || "currency";
  const amount = value instanceof Money ? value.toDecimal(digits) : value;
  return NumberFormatter.create(amount).format(digits, { style, currency }, locale);
}
directive("money", (config, vnode) => {
  const decimalPlaces = config.decimalPlaces ?? 2;
  const currency = config.currency || "USD";
  const locale = config.locale || "en";
  const cents = Number(config.model[config.field] || 0);
  const value = formatMoney(Money.fromCents(cents), {
    digits: decimalPlaces,
    currency,
    locale
  });
  setAttribute("value", value, vnode);
  const prevOnInput = vnode.props.oninput;
  setAttribute(
    "oninput",
    (event) => {
      const target = event.target;
      const money = parseMoneyInput(target.value, { locale, decimalPlaces });
      config.model[config.field] = money.toCents();
      target.value = formatMoney(money, {
        digits: decimalPlaces,
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
export {
  Money,
  NumberFormatter,
  formatMoney,
  parseMoneyInput
};
