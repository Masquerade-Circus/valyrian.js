import "valyrian.js/node";

import { describe, expect, test as it } from "bun:test";
import { v } from "valyrian.js";
import { render, ServerStorage } from "valyrian.js/node";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("ServerStorage", () => {
  it("should return sync callback values from run", () => {
    const result = ServerStorage.run(() => "sync-result");

    expect(result).toEqual("sync-result");
  });

  it("should return and resolve async callback values from run", async () => {
    const result = ServerStorage.run(async () => {
      await delay(1);
      return "async-result";
    });

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toEqual("async-result");
  });

  it("should preserve scoped storage across async callbacks", async () => {
    const result = await ServerStorage.run(async () => {
      sessionStorage.setItem("request-id", "async-scope");
      await delay(1);
      return sessionStorage.getItem("request-id");
    });

    expect(result).toEqual("async-scope");
  });

  it("should propagate sync callback errors from run", () => {
    const error = new Error("sync failure");

    expect(() => ServerStorage.run(() => {
      throw error;
    })).toThrow(error);
  });

  it("should return and propagate async callback rejections from run", async () => {
    const error = new Error("async failure");
    const rejection = Promise.reject(error);
    rejection.catch(() => undefined);

    const result = ServerStorage.run(() => rejection);

    expect(result).toBeInstanceOf(Promise);
    await expect(result).rejects.toThrow("async failure");
  });
});

describe("Node renderer", () => {
  it("should isolate concurrent SSR renders in ServerStorage scopes", async () => {
    const runRender = (requestId: string, waitMs: number) =>
      ServerStorage.run(async () => {
        sessionStorage.setItem("request-id", requestId);
        await delay(waitMs);

        return render(v("section", { id: requestId }, sessionStorage.getItem("request-id")));
      });

    const [slow, fast] = await Promise.all([runRender("slow", 20), runRender("fast", 5)]);

    expect(slow).toEqual('<section id="slow">slow</section>');
    expect(fast).toEqual('<section id="fast">fast</section>');
  });
});
