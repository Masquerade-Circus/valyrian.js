import "valyrian.js/node";

import { describe, expect, test as it } from "bun:test";
import { ServerStorage } from "valyrian.js/node";
import { createNativeStore, StorageType } from "valyrian.js/native-store";

describe("NativeStore server context", () => {
  it("should isolate store registries across concurrent ServerStorage requests", async () => {
    const runRequest = (requestId: string, waitMs: number) =>
      new Promise<string>((resolve, reject) => {
        ServerStorage.run(() => {
          try {
            const store = createNativeStore("ctx-shared", {}, StorageType.Session);
            store.set("request-id", requestId);

            setTimeout(() => {
              try {
                const reused = createNativeStore("ctx-shared", {}, StorageType.Session, true);
                resolve(reused.get("request-id"));
              } catch (error) {
                reject(error);
              }
            }, waitMs);
          } catch (error) {
            reject(error);
          }
        });
      });

    const [slow, fast] = await Promise.all([runRequest("slow", 20), runRequest("fast", 5)]);

    expect(slow).toEqual("slow");
    expect(fast).toEqual("fast");
  });
});
