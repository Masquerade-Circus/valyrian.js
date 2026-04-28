import "valyrian.js/node";

import { expect, describe, test as it, beforeEach, afterEach } from "bun:test";
import { mount, unmount, v } from "valyrian.js";
import { Money, NumberFormatter, parseMoneyInput, formatMoney } from "valyrian.js/money";

describe("Money", () => {
  beforeEach(() => {
    unmount();
  });

  afterEach(() => {
    unmount();
  });

  it("should support cent-based arithmetic", () => {
    const subtotal = Money.fromCents(1299);
    const tax = Money.fromDecimal(2.08);
    const total = subtotal.add(tax);

    expect(total.toCents()).toEqual(1507);
    expect(total.toDecimal()).toEqual(15.07);
    expect(total.subtract(Money.fromCents(507)).toCents()).toEqual(1000);
  });

  it("should support multiply and divide", () => {
    const amount = Money.fromCents(1000);
    expect(amount.multiply(1.5).toCents()).toEqual(1500);
    expect(amount.divide(4).toCents()).toEqual(250);
    expect(() => amount.divide(0)).toThrow("Cannot divide by zero");
  });

  it("should parse and format money input", () => {
    const amount = parseMoneyInput("$1,234.56", { locale: "en-US" });
    expect(amount.toCents()).toEqual(123456);

    const formatted = formatMoney(amount, {
      currency: "USD",
      locale: "en-US",
      digits: 2
    });

    expect(formatted).toEqual("$1,234.56");
  });

  it("should parse common international money input", () => {
    expect(parseMoneyInput("$1,234.56", { locale: "en-US" }).toCents()).toEqual(123456);
    expect(parseMoneyInput("1.234,56 €", { locale: "de-DE" }).toCents()).toEqual(123456);
    expect(parseMoneyInput("$1,234.56", { locale: "es-MX" }).toCents()).toEqual(123456);
    expect(parseMoneyInput("1\u00a0234,56 €", { locale: "fr-FR" }).toCents()).toEqual(123456);
    expect(parseMoneyInput("1\u202f234,56 €", { locale: "fr-FR" }).toCents()).toEqual(123456);
  });

  it("should parse signed localized money input", () => {
    expect(parseMoneyInput("−1.234,56 €", { locale: "de-DE" }).toCents()).toEqual(-123456);
  });

  it("should parse localized numerals and locale-specific grouping separators", () => {
    expect(parseMoneyInput("١٬٢٣٤٫٥٦ ج.م.‏", { locale: "ar-EG" }).toCents()).toEqual(123456);
    expect(parseMoneyInput("CHF 1’234.56", { locale: "de-CH" }).toCents()).toEqual(123456);
    expect(parseMoneyInput("₹१२,३४५.६७", { locale: "hi-IN" }).toCents()).toEqual(1234567);
  });

  it("should treat a lone comma as decimal separator when grouping is invalid", () => {
    expect(parseMoneyInput("1,23").toCents()).toEqual(123);
  });

  it("should keep valid thousands grouping without decimals", () => {
    expect(parseMoneyInput("1,234", { locale: "en-US" }).toCents()).toEqual(123400);
  });

  it("should keep valid hi-IN grouping without decimals", () => {
    expect(parseMoneyInput("₹१२,३४,५६७", { locale: "hi-IN" }).toCents()).toEqual(123456700);
    expect(parseMoneyInput("12,34,567", { locale: "hi-IN" }).toCents()).toEqual(123456700);
  });

  it("should fall back to the last common separator as decimal when locale separators do not match", () => {
    expect(parseMoneyInput("1.234,56", { locale: "en-US" }).toCents()).toEqual(123456);
  });

  it("should keep cents scale independent from display digits", () => {
    const amount = Money.fromCents(123456);

    expect(formatMoney(amount, { currency: "USD", locale: "en-US", digits: 0 })).toEqual("$1,235");
    expect(amount.toCents()).toEqual(123456);
  });

  it("should expose NumberFormatter from money module", () => {
    const formatter = NumberFormatter.create(1234.56);
    expect(formatter.format()).toEqual("$1,234.56");

    const shifted = NumberFormatter.create("1,234.56", true);
    expect(shifted.value).toEqual(123456);
  });

  it("should bind input with v-money directive", () => {
    const model = { amountInCents: 123456 };
    const div = document.createElement("div");

    const component = () => (
      <input
        name="amount"
        v-money={{
          model,
          field: "amountInCents",
          currency: "USD",
          locale: "en-US",
          decimalPlaces: 2
        }}
      />
    );

    const html = mount(div, component);
    expect(html).toContain("$1,234.56");

    const input = div.childNodes[0] as unknown as HTMLInputElement;
    input.value = "$2,000.00";
    (input as any).vnode.props.oninput({ target: input });

    expect(model.amountInCents).toEqual(200000);
    expect(input.value).toEqual("$2,000.00");
  });

  it("should bind zero-decimal currencies with v-money directive", () => {
    const model = { amountInMinorUnits: 123456 };
    const div = document.createElement("div");

    const component = () => (
      <input
        name="amount"
        v-money={{
          model,
          field: "amountInMinorUnits",
          currency: "JPY",
          locale: "ja-JP",
          decimalPlaces: 0
        }}
      />
    );

    const html = mount(div, component);
    const expectedInitialValue = new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(123456);
    expect(html).toContain(expectedInitialValue);

    const input = div.childNodes[0] as unknown as HTMLInputElement;
    input.value = "￥200,000";
    (input as any).vnode.props.oninput({ target: input });

    expect(model.amountInMinorUnits).toEqual(200000);
    expect(input.value).toEqual(
      new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(200000)
    );
  });
});
