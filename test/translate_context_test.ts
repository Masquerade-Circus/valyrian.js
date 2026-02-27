import "valyrian.js/node";

import { describe, expect, test as it } from "bun:test";
import { ServerStorage } from "valyrian.js/node";
import { getLang, setLang, setTranslations, t } from "valyrian.js/translate";

describe("Translate server context", () => {
  it("should isolate current language across concurrent ServerStorage requests", async () => {
    setTranslations(
      { hello: "Hello" },
      {
        es: { hello: "Hola" },
        fr: { hello: "Salut" }
      }
    );

    const runRequest = (lang: string, waitMs: number) =>
      new Promise<{ lang: string; message: string }>((resolve, reject) => {
        ServerStorage.run(() => {
          try {
            setLang(lang);
          } catch (error) {
            reject(error);
            return;
          }

          setTimeout(() => {
            resolve({
              lang: getLang(),
              message: t("hello")
            });
          }, waitMs);
        });
      });

    const [slow, fast] = await Promise.all([runRequest("es", 20), runRequest("fr", 5)]);

    expect(slow).toEqual({ lang: "es", message: "Hola" });
    expect(fast).toEqual({ lang: "fr", message: "Salut" });
  });
});
