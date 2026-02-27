import "valyrian.js/node";

import { describe, expect, test as it } from "bun:test";
import { ServerStorage } from "valyrian.js/node";
import { createContextScope, getContext, hasContext, runWithContext, setContext } from "valyrian.js/context";

describe("Context module", () => {
  const scope = createContextScope<string>("test.scope");

  it("should set and restore context values", () => {
    const restore = setContext(scope, "alpha");
    expect(getContext(scope)).toEqual("alpha");
    expect(hasContext(scope)).toBeTrue();

    restore();
    expect(getContext(scope)).toBeUndefined();
    expect(hasContext(scope)).toBeFalse();
  });

  it("should run sync callback within context", () => {
    const value = runWithContext(scope, "sync", () => getContext(scope));
    expect(value).toEqual("sync");
    expect(getContext(scope)).toBeUndefined();
  });

  it("should run async callback within context", async () => {
    const value = await runWithContext(scope, "async", async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return getContext(scope);
    });

    expect(value).toEqual("async");
    expect(getContext(scope)).toBeUndefined();
  });

  it("should isolate context values across concurrent ServerStorage requests", async () => {
    const runRequest = (value: string, waitMs: number) =>
      new Promise<string | undefined>((resolve, reject) => {
        ServerStorage.run(() => {
          void runWithContext(scope, value, async () => {
            await new Promise((done) => setTimeout(done, waitMs));
            resolve(getContext(scope));
          }).catch(reject);
        });
      });

    const [slow, fast] = await Promise.all([runRequest("slow", 20), runRequest("fast", 5)]);

    expect(slow).toEqual("slow");
    expect(fast).toEqual("fast");
  });
});
