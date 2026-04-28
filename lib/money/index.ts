import { directive, setAttribute, VnodeWithDom } from "valyrian.js";

export type MoneyFormatOptions = {
  locale?: Intl.LocalesArgument;
  currency?: string;
  digits?: number;
  decimalPlaces?: number;
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getNumberSeparators(locale: Intl.LocalesArgument) {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  return {
    group: parts.find((part) => part.type === "group")?.value || ",",
    decimal: parts.find((part) => part.type === "decimal")?.value || "."
  };
}

function getLocalizedDigitMap(locale: Intl.LocalesArgument) {
  const formatter = new Intl.NumberFormat(locale, { useGrouping: false });
  const digitMap = new Map<string, string>();

  for (let digit = 0; digit <= 9; digit++) {
    digitMap.set(formatter.format(digit), String(digit));
  }

  return digitMap;
}

const unicodeZeroCodePoints = [0x0660, 0x06f0, 0x0966];

function normalizeLocalizedDigits(value: string, locale: Intl.LocalesArgument) {
  let normalized = value;
  for (const [localizedDigit, digit] of getLocalizedDigitMap(locale)) {
    normalized = normalized.replace(new RegExp(escapeRegExp(localizedDigit), "g"), digit);
  }

  return normalized.replace(/\p{Decimal_Number}/gu, (digit) => {
    const codePoint = digit.codePointAt(0);
    if (codePoint === undefined) {
      return digit;
    }

    for (const zeroCodePoint of unicodeZeroCodePoints) {
      const value = codePoint - zeroCodePoint;
      if (value >= 0 && value <= 9) {
        return String(value);
      }
    }

    return digit;
  });
}

function isValidGroupedInteger(value: string, separator: string) {
  if (!separator) {
    return false;
  }

  return new RegExp(`^[+-]?\\d{1,3}(${escapeRegExp(separator)}\\d{3})+$`).test(value);
}

function hasGroupedIntegerSuffix(value: string, separator: string) {
  const separatorIndex = value.lastIndexOf(separator);
  return separatorIndex !== -1 && /^\d{3}$/.test(value.slice(separatorIndex + separator.length));
}

function removeGrouping(value: string, separators: string[]) {
  let result = value;
  for (const separator of separators) {
    if (separator) {
      result = result.replace(new RegExp(escapeRegExp(separator), "g"), "");
    }
  }
  return result;
}

function chooseDecimalIndex(value: string, group: string, decimal: string) {
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
  if (
    commonSeparator &&
    !isValidGroupedInteger(value, commonSeparator) &&
    !(commonSeparator === group && hasGroupedIntegerSuffix(value, commonSeparator))
  ) {
    return value.lastIndexOf(commonSeparator);
  }

  return -1;
}

function normalizeMoneyInput(value: string, locale: Intl.LocalesArgument) {
  const { group, decimal } = getNumberSeparators(locale);
  const normalized = normalizeLocalizedDigits(String(value), locale)
    .replace(/[−]/g, "-")
    .replace(new RegExp(`[^0-9${escapeRegExp(group)}${escapeRegExp(decimal)}.,+-]`, "g"), "");
  const separators = [group, decimal, ".", ","];
  const decimalIndex = chooseDecimalIndex(normalized, group, decimal);

  if (decimalIndex !== -1) {
    const integer = removeGrouping(normalized.slice(0, decimalIndex), separators);
    const fraction = removeGrouping(normalized.slice(decimalIndex + 1), separators);
    return `${integer}.${fraction}`;
  }

  return removeGrouping(normalized, separators);
}

export function parseMoneyInput(
  value: string,
  options: { locale?: Intl.LocalesArgument; decimalPlaces?: number } = {}
) {
  const decimalPlaces = options.decimalPlaces ?? 2;
  const clean = normalizeMoneyInput(value, options.locale || "en");

  const amount = Number(clean);
  if (isNaN(amount)) {
    return Money.fromCents(0);
  }

  return Money.fromDecimal(amount, decimalPlaces);
}

export function formatMoney(value: Money | number, options: MoneyFormatOptions = {}) {
  const digits = options.digits ?? 2;
  const decimalPlaces = options.decimalPlaces ?? 2;
  const currency = options.currency || "USD";
  const locale = options.locale || "en";
  const style = options.style || "currency";
  const amount = value instanceof Money ? value.toDecimal(decimalPlaces) : value;

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
    decimalPlaces,
    currency,
    locale
  });

  setAttribute("value", value, vnode);

  const prevOnInput = vnode.props.oninput;

  setAttribute(
    "oninput",
    (event: Event) => {
      const target = event.target as unknown as HTMLInputElement;
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
