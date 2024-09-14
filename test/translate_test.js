import expect from "expect";
import { afterEach } from "mocha";
import { mount, unmount, v } from "valyrian.js";
import { t, setTranslations, getTranslations, setLang, getLang, NumberFormatter } from "valyrian.js/translate";

describe("Translate", () => {
  // Test for t function
  describe("t function", () => {
    it("should return the correct translation when it exists", () => {
      setTranslations({ hello: "Hello" }, { es: { hello: "Hola" } });
      setLang("es");
      expect(t("hello")).toEqual("Hola");
    });

    it("should return the key when translation is not found", () => {
      setLang("es");
      expect(t("missing_key")).toEqual("missing_key");
    });

    it("should replace parameters in the translation", () => {
      setTranslations({ greeting: "Hello, {name}!" }, { es: { greeting: "Hola, {name}!" } });
      setLang("es");
      expect(t("greeting", { name: "John" })).toEqual("Hola, John!");
    });

    it("should return the key when translation has placeholders but no parameters provided", () => {
      setTranslations({ greeting: "Hello, {name}!" }, { es: { greeting: "Hola, {name}!" } });
      setLang("es");
      expect(t("greeting")).toEqual("Hola, {name}!");
    });
  });

  // Test for setTranslations function
  describe("setTranslations function", () => {
    it("should clear and set new translations", () => {
      setTranslations({ defaultKey: "default" }, { es: { newKey: "nuevo" } });
      setLang("es");
      expect(t("newKey")).toEqual("nuevo");
      expect(t("defaultKey")).toEqual("default");
    });

    it("should combine default translations with new translations", () => {
      setTranslations({ hello: "Hello" }, { es: { goodbye: "Adiós" } });
      setLang("es");
      expect(t("hello")).toEqual("Hello");
      expect(t("goodbye")).toEqual("Adiós");
    });
  });

  // Test for setLang function
  describe("setLang function", () => {
    it("should change the language correctly", () => {
      setTranslations({ hello: "Hello" }, { es: { hello: "Hola" } });
      setLang("es");
      expect(t("hello")).toEqual("Hola");
    });

    it("should throw an error if language is not found", () => {
      expect(() => setLang("fr")).toThrowError(/Language fr not found/);
    });

    it("should throw an error if language has an invalid format", () => {
      expect(() => setLang(123)).toThrowError(/Language 123 not found/);
    });
  });

  // Test for getLang function
  describe("getLang function", () => {
    it("should return the current language", () => {
      setTranslations({ hello: "Hola" }, { en: { hello: "Hello" } });
      setLang("en");
      expect(getLang()).toEqual("en");
    });
  });

  // Test for getTranslations function
  describe("getTranslations function", () => {
    it("should return the current translations object", () => {
      setTranslations({ hello: "Hello" }, { es: { goodbye: "Adiós" } });
      const translations = getTranslations();
      expect(translations).toEqual({
        en: {
          hello: "Hello"
        },
        es: {
          hello: "Hello",
          goodbye: "Adiós"
        }
      });
    });
  });

  // Test for NumberFormatter class
  describe("NumberFormatter class", () => {
    beforeEach(() => {
      setTranslations({}, { en: {}, de: {} });
    });
    afterEach(() => {
      setLang("en");
    });
    it("should format a number as currency correctly", () => {
      const formatter = NumberFormatter.create(1234.56);
      expect(formatter.format()).toEqual("$1,234.56");

      const formatter2 = NumberFormatter.create(1234.56);
      expect(formatter2.format(1)).toEqual("$1,234.6");
    });

    it("should format a number as currency correctly using default locale", function () {
      const formatter = NumberFormatter.create(1234.56);
      setLang("en");
      expect(formatter.format()).toEqual("$1,234.56");
      setLang("de");
      expect(formatter.format()).toEqual("1.234,56 $");
    });

    it("should format a number as currency correctly using custom locale", function () {
      const formatter = NumberFormatter.create(1234.56);
      expect(formatter.format(2, {}, "de-DE")).toEqual("1.234,56 $");
      expect(getLang()).toEqual("en");
    });

    it("should format a number with custom Intl.NumberFormat options", function () {
      const formatter = NumberFormatter.create(1234.56);
      const options = { style: "currency", currency: "EUR" };
      expect(formatter.format(2, options)).toEqual("€1,234.56");
    });

    it("should shift decimal places correctly using toDecimalPlaces", () => {
      const formatter = NumberFormatter.create(123.456);
      expect(formatter.toDecimalPlaces(1).value).toEqual(12345.6);
    });

    it("should shift decimal places correctly using fromDecimalPlaces", () => {
      const formatter = NumberFormatter.create(123.456);
      expect(formatter.fromDecimalPlaces(2).value).toEqual(1234.56);
    });

    it("should shift decimal places correctly using shiftDecimalPlaces", () => {
      const formatter = NumberFormatter.create(123.456);
      expect(formatter.shiftDecimalPlaces().value).toEqual(123456);
    });

    it("should clean a string number correctly", () => {
      const formatter = NumberFormatter.create("$1,234.56");
      expect(formatter.value).toEqual(1234.56);

      const formatter2 = NumberFormatter.create("1,234.56");
      expect(formatter2.value).toEqual(1234.56);

      const formatter3 = NumberFormatter.create("1234.56");
      expect(formatter3.value).toEqual(1234.56);

      const formatter4 = NumberFormatter.create("1234 . 56");
      expect(formatter4.value).toEqual(1234.56);

      const formatter5 = NumberFormatter.create("1,234.56", true);
      expect(formatter5.value).toEqual(123456);
    });

    it("should return the correct number of decimal places", () => {
      const formatter = NumberFormatter.create(1234.5678);
      expect(formatter.getDecimalPlaces()).toEqual(4);
    });
  });

  describe("v-t directive", () => {
    beforeEach(() => {
      unmount();
      setTranslations({}, {});
      setLang("en");
    });

    afterEach(unmount);

    it("should translate the text correctly", async () => {
      const div = document.createElement("div");
      setTranslations({ hello: "Hello" }, { es: { hello: "Hola" } });
      const component = () => <div v-t="hello"></div>;
      const result = mount(div, component);
      expect(result).toEqual("<div>Hello</div>");

      setLang("es");
      expect(div.innerHTML).toEqual("<div>Hola</div>");
    });

    it("should translate the text with parameters correctly", () => {
      const div = document.createElement("div");
      setTranslations({ greeting: "Hello, {name}!" }, { es: { greeting: "Hola, {name}!" } });
      const component = () => <div v-t="greeting" v-t-params={{ name: "John" }}></div>;
      const result = mount(div, component);
      expect(result).toEqual("<div>Hello, John!</div>");

      setLang("es");
      expect(div.innerHTML).toEqual("<div>Hola, John!</div>");
    });

    it("should translate the text with parameters correctly when using only children", () => {
      const div = document.createElement("div");
      setTranslations(
        { greeting: "Hello, {name}!", welcome: "Welcome again {name}!" },
        { es: { greeting: "Hola, {name}!", welcome: "Bienvenido de nuevo {name}!" } }
      );
      const component = () => (
        <div v-t v-t-params={{ name: "John" }}>
          {"greeting"} {"welcome"}
        </div>
      );
      const result = mount(div, component);
      expect(result).toEqual("<div>Hello, John! Welcome again John!</div>");

      setLang("es");
      expect(div.innerHTML).toEqual("<div>Hola, John! Bienvenido de nuevo John!</div>");
    });
  });
});
