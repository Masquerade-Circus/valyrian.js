import { directive, setAttribute, VnodeWithDom } from "valyrian.js";

export type MoneyFormatOptions = {
  locale?: Intl.LocalesArgument;
  currency?: string;
  digits?: number;
  style?: Intl.NumberFormatOptions["style"];
};

export class NumberFormatter {
  #value = 0;

  get value() {
    return this.#value;
  }

  private constructor() {}

  set(newValue: number | string, shiftDecimal = false) {
    this.#value = this.clean(newValue, shiftDecimal);
    return this;
  }

  private clean(value: string | number, shiftDecimal = false) {
    let stringNumber = String(value).replace(/[^0-9.-]+/g, "");
    if (shiftDecimal) {
      stringNumber = stringNumber.replace(/\./g, "");
    }
    const number = Number(stringNumber);
    return isNaN(number) ? 0 : number;
  }

  format(digits = 2, options: Intl.NumberFormatOptions = {}, locale: Intl.LocalesArgument = "en") {
    const formatter = new Intl.NumberFormat(locale, {
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

  toDecimalPlaces(decimalPlaces: number) {
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

  static create(value: number | string = 0, shiftDecimal = false) {
    const formatter = new NumberFormatter();
    return formatter.set(value, shiftDecimal);
  }
}

export class Money {
  private cents: number;

  private constructor(cents: number) {
    this.cents = Math.trunc(cents);
  }

  static fromCents(cents: number) {
    return new Money(cents);
  }

  static fromDecimal(value: number, decimalPlaces = 2) {
    const factor = Math.pow(10, decimalPlaces);
    return new Money(Math.round(value * factor));
  }

  toCents() {
    return this.cents;
  }

  toDecimal(decimalPlaces = 2) {
    const factor = Math.pow(10, decimalPlaces);
    return this.cents / factor;
  }

  add(other: Money) {
    return new Money(this.cents + other.toCents());
  }

  subtract(other: Money) {
    return new Money(this.cents - other.toCents());
  }

  multiply(multiplier: number) {
    return new Money(Math.round(this.cents * multiplier));
  }

  divide(divider: number) {
    if (divider === 0) {
      throw new Error("Cannot divide by zero");
    }
    return new Money(Math.round(this.cents / divider));
  }
}

export function parseMoneyInput(value: string, options: { locale?: Intl.LocalesArgument; decimalPlaces?: number } = {}) {
  const decimalPlaces = options.decimalPlaces ?? 2;
  const clean = String(value)
    .replace(/\s/g, "")
    .replace(/[^0-9,.-]/g, "")
    .replace(/,(?=\d{3}(\D|$))/g, "")
    .replace(/,/g, ".");

  const amount = Number(clean);
  if (isNaN(amount)) {
    return Money.fromCents(0);
  }

  return Money.fromDecimal(amount, decimalPlaces);
}

export function formatMoney(value: Money | number, options: MoneyFormatOptions = {}) {
  const digits = options.digits ?? 2;
  const currency = options.currency || "USD";
  const locale = options.locale || "en";
  const style = options.style || "currency";
  const amount = value instanceof Money ? value.toDecimal(digits) : value;

  return NumberFormatter.create(amount).format(digits, { style, currency }, locale);
}

type MoneyDirectiveOptions = {
  model: Record<string, any>;
  field: string;
  currency?: string;
  locale?: Intl.LocalesArgument;
  decimalPlaces?: number;
};

directive("money", (config: MoneyDirectiveOptions, vnode: VnodeWithDom) => {
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
    (event: Event) => {
      const target = event.target as HTMLInputElement;
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
