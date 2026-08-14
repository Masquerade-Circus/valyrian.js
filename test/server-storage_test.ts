import "valyrian.js/node";

import { describe, expect, test as it } from "bun:test";
import { mount, v } from "valyrian.js";
import { document as nodeDocument, NodeRuntime, render, ServerStorage } from "valyrian.js/node";

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

  it("isolates document identity, renderer state and listeners across concurrent runtime requests", async () => {
    const runRequest = (requestId: string, waitMs: number) =>
      NodeRuntime.run(async () => {
        const requestDocument = globalThis.document;
        const clicks: string[] = [];

        nodeDocument.body.addEventListener("click", () => {
          clicks.push(requestId);
        });
        await delay(waitMs);

        const html = mount("body", () => v("main", { id: requestId }, requestId));
        nodeDocument.body.dispatchEvent(new Event("click"));

        return {
          requestDocument,
          documentAfterAwait: globalThis.document,
          body: nodeDocument.body,
          html,
          bodyHtml: nodeDocument.body.innerHTML,
          foundText: nodeDocument.getElementById(requestId)?.textContent,
          clicks
        };
      });

    const [slow, fast] = await Promise.all([runRequest("slow", 20), runRequest("fast", 5)]);

    expect(slow.requestDocument).toBe(slow.documentAfterAwait);
    expect(fast.requestDocument).toBe(fast.documentAfterAwait);
    expect(slow.requestDocument).not.toBe(fast.requestDocument);
    expect(slow.body).not.toBe(fast.body);
    expect(slow.html).toEqual('<main id="slow">slow</main>');
    expect(fast.html).toEqual('<main id="fast">fast</main>');
    expect(slow.bodyHtml).toEqual('<main id="slow">slow</main>');
    expect(fast.bodyHtml).toEqual('<main id="fast">fast</main>');
    expect(slow.foundText).toEqual("slow");
    expect(fast.foundText).toEqual("fast");
    expect(slow.clicks).toEqual(["slow"]);
    expect(fast.clicks).toEqual(["fast"]);
  });

  it("isolates sessionStorage across concurrent NodeRuntime requests", async () => {
    sessionStorage.clear();

    const runRequest = (requestId: string, waitMs: number) =>
      NodeRuntime.run(async () => {
        sessionStorage.setItem("request-id", requestId);
        await delay(waitMs);
        return sessionStorage.getItem("request-id");
      });

    const [slow, fast] = await Promise.all([runRequest("runtime-slow", 20), runRequest("runtime-fast", 5)]);

    expect(slow).toEqual("runtime-slow");
    expect(fast).toEqual("runtime-fast");
    expect(sessionStorage.getItem("request-id")).toBeNull();
  });

  it("gives ServerStorage scopes isolated active documents for compatibility", async () => {
    const runRequest = (requestId: string, waitMs: number) =>
      ServerStorage.run(async () => {
        const requestDocument = globalThis.document;
        await delay(waitMs);
        mount("body", () => v("p", { id: requestId }, requestId));

        return {
          requestDocument,
          documentAfterAwait: globalThis.document,
          html: nodeDocument.body.innerHTML
        };
      });

    const [slow, fast] = await Promise.all([runRequest("storage-slow", 20), runRequest("storage-fast", 5)]);

    expect(slow.requestDocument).toBe(slow.documentAfterAwait);
    expect(fast.requestDocument).toBe(fast.documentAfterAwait);
    expect(slow.requestDocument).not.toBe(fast.requestDocument);
    expect(slow.html).toEqual('<p id="storage-slow">storage-slow</p>');
    expect(fast.html).toEqual('<p id="storage-fast">storage-fast</p>');
  });
});
