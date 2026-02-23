import { expect, describe, test as it, beforeEach, afterEach } from "bun:test";
import { mount, unmount, v } from "valyrian.js";
import { t, setTranslations, getTranslations, setLang, getLang } from "valyrian.js/translate";

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
      expect(() => setLang("123")).toThrowError(/Language 123 not found/);
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
