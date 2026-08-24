import "valyrian.js/node";

import { describe, expect, test as it } from "bun:test";
import { NodeRuntime, PopStateEvent as NodePopStateEvent } from "valyrian.js/node";
import { Router, mountRouter } from "../lib/router/index";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Node browser navigation runtime", () => {
  it("activates window navigation explicitly and exposes coherent location fields", () => {
    NodeRuntime.runBrowser({ url: "https://example.test:8443/account?tab=profile#security" }, () => {
      expect(window.window).toBe(window);
      expect(window.document).toBe(document);
      expect(window.location).toBe(location);
      expect(window.history).toBe(history);
      expect(location.href).toEqual("https://example.test:8443/account?tab=profile#security");
      expect(location.origin).toEqual("https://example.test:8443");
      expect(location.hostname).toEqual("example.test");
      expect(location.protocol).toEqual("https:");
      expect(location.port).toEqual("8443");
      expect(location.pathname).toEqual("/account");
      expect(location.search).toEqual("?tab=profile");
      expect(location.hash).toEqual("#security");
    });
  });

  it("supports window events and PopStateEvent state", () => {
    NodeRuntime.runBrowser({ url: "https://example.test/" }, () => {
      const states: unknown[] = [];
      const onPopState = (event: Event) => {
        states.push((event as NodePopStateEvent).state);
      };

      window.addEventListener("popstate", onPopState);
      const event = new NodePopStateEvent("popstate", { state: { page: 2 } });
      const dispatched = window.dispatchEvent(event);

      expect(event).toBeInstanceOf(Event);
      expect(event.state).toEqual({ page: 2 });
      expect(dispatched).toBeTrue();
      expect(states).toEqual([{ page: 2 }]);

      window.removeEventListener("popstate", onPopState);
      window.dispatchEvent(new NodePopStateEvent("popstate", { state: { page: 3 } }));
      expect(states).toEqual([{ page: 2 }]);
    });
  });

  it("tracks history state, length, index traversal and deterministic reset", async () => {
    await NodeRuntime.runBrowser({ url: "https://example.test/start" }, async () => {
      const traversedStates: unknown[] = [];
      window.addEventListener("popstate", (event) => {
        traversedStates.push(event.state);
      });

      expect(history.state).toBeNull();
      expect(history.length).toEqual(1);

      history.pushState({ page: 1 }, "", "/one?mode=edit#fields");
      expect(history.state).toEqual({ page: 1 });
      expect(history.length).toEqual(2);
      expect(location.href).toEqual("https://example.test/one?mode=edit#fields");
      expect(traversedStates).toEqual([]);

      history.replaceState({ page: "one-replaced" }, "", "/one?mode=view#summary");
      expect(history.state).toEqual({ page: "one-replaced" });
      expect(history.length).toEqual(2);
      expect(location.pathname).toEqual("/one");
      expect(location.search).toEqual("?mode=view");
      expect(location.hash).toEqual("#summary");

      history.pushState({ page: 2 }, "", "/two");
      history.back();
      await delay(0);
      expect(location.href).toEqual("https://example.test/one?mode=view#summary");
      expect(history.state).toEqual({ page: "one-replaced" });

      history.forward();
      await delay(0);
      expect(location.pathname).toEqual("/two");
      expect(history.state).toEqual({ page: 2 });

      history.go(-2);
      await delay(0);
      expect(location.pathname).toEqual("/start");
      expect(history.state).toBeNull();
      expect(traversedStates).toEqual([{ page: "one-replaced" }, { page: 2 }, null]);

      NodeRuntime.resetHistory();
      expect(history.length).toEqual(1);
      expect(history.state).toBeNull();
      expect(location.href).toEqual("https://example.test/start");
    });
  });

  it("ignores history traversal outside the available range", async () => {
    await NodeRuntime.runBrowser({ url: "https://example.test/start" }, async () => {
      let popstateCalls = 0;
      window.addEventListener("popstate", () => {
        popstateCalls += 1;
      });

      history.back();
      history.forward();
      history.go(-1);
      history.go(1);
      await delay(0);

      expect(location.pathname).toEqual("/start");
      expect(history.length).toEqual(1);
      expect(popstateCalls).toEqual(0);
    });
  });

  it("rejects resetting history outside a browser runtime", () => {
    expect(() => NodeRuntime.resetHistory()).toThrow(/runBrowser/);
    NodeRuntime.run(() => {
      expect(() => NodeRuntime.resetHistory()).toThrow(/runBrowser/);
    });
  });

  it("lets Router use simulated History API while preserving pathname, search and hash", async () => {
    await NodeRuntime.runBrowser({ url: "https://example.test/start" }, async () => {
      const router = new Router();
      router.add("/start", () => () => <main>Start</main>);
      router.add("/next", (request) => () => (
        <main>
          Next {String(request.query.tab)} {request.url}
        </main>
      ));
      mountRouter("body", router);
      await delay(0);

      const result = await router.go("/next?tab=profile#details");

      expect(result).toContain("Next profile /next?tab=profile#details");
      expect(location.pathname).toEqual("/next");
      expect(location.search).toEqual("?tab=profile");
      expect(location.hash).toEqual("#details");
      expect(history.length).toEqual(2);
      expect(document.body.innerHTML).toContain("Next profile");

      history.back();
      await delay(0);
      expect(location.pathname).toEqual("/start");
      expect(document.body.innerHTML).toEqual("<main>Start</main>");
      expect(router.path).toEqual("/start");
    });
  });

  it("does not accumulate Router popstate listeners when mounting again", async () => {
    await NodeRuntime.runBrowser({ url: "https://example.test/start" }, async () => {
      let startRouteCalls = 0;
      const router = new Router();
      router.add("/start", () => {
        startRouteCalls += 1;
        return () => <main>Start</main>;
      });
      router.add("/next", () => () => <main>Next</main>);

      mountRouter("body", router);
      await delay(0);
      mountRouter("body", router);
      await delay(0);
      await router.go("/next");
      const callsBeforeTraversal = startRouteCalls;

      history.back();
      await delay(0);

      expect(startRouteCalls - callsBeforeTraversal).toEqual(1);
      expect(document.body.innerHTML).toEqual("<main>Start</main>");
    });
  });

  it("replaces the previous Router popstate listener in the same window", async () => {
    await NodeRuntime.runBrowser({ url: "https://example.test/start" }, async () => {
      let routerAStartCalls = 0;
      let routerBStartCalls = 0;
      const routerA = new Router();
      const routerB = new Router();

      routerA.add("/start", () => {
        routerAStartCalls += 1;
        return () => <main>Router A</main>;
      });
      routerB.add("/start", () => {
        routerBStartCalls += 1;
        return () => <main>Router B</main>;
      });
      routerB.add("/next", () => () => <main>Next</main>);

      mountRouter("body", routerA);
      await delay(0);
      mountRouter("body", routerB);
      await delay(0);
      await routerB.go("/next");

      const routerACallsBeforeTraversal = routerAStartCalls;
      const routerBCallsBeforeTraversal = routerBStartCalls;
      history.back();
      await delay(0);

      expect(routerAStartCalls).toEqual(routerACallsBeforeTraversal);
      expect(routerBStartCalls - routerBCallsBeforeTraversal).toEqual(1);
      expect(routerA.path).toEqual("/start");
      expect(routerB.path).toEqual("/start");
      expect(document.body.innerHTML).toEqual("<main>Router B</main>");
    });
  });

  it("isolates window, history, Router and rendered output across concurrent browser contexts", async () => {
    const runRequest = (requestId: string, waitMs: number) =>
      NodeRuntime.runBrowser({ url: `https://${requestId}.example.test/start` }, async () => {
        const requestWindow = window;
        const requestHistory = history;
        const popstates: string[] = [];
        const router = new Router();

        window.addEventListener("popstate", () => {
          popstates.push(requestId);
        });
        router.add("/start", () => () => <main>{requestId} start</main>);
        router.add("/next", () => () => <main>{requestId} next</main>);
        mountRouter("body", router);
        await delay(0);
        await delay(waitMs);
        await router.go(`/next?request=${requestId}#done`);

        return {
          requestWindow,
          windowAfterAwait: window,
          requestHistory,
          historyAfterAwait: history,
          href: location.href,
          historyLength: history.length,
          html: document.body.innerHTML,
          routerPath: router.path,
          popstates
        };
      });

    const [slow, fast] = await Promise.all([runRequest("slow", 20), runRequest("fast", 5)]);

    expect(slow.requestWindow).toBe(slow.windowAfterAwait);
    expect(fast.requestWindow).toBe(fast.windowAfterAwait);
    expect(slow.requestWindow).not.toBe(fast.requestWindow);
    expect(slow.requestHistory).toBe(slow.historyAfterAwait);
    expect(fast.requestHistory).toBe(fast.historyAfterAwait);
    expect(slow.requestHistory).not.toBe(fast.requestHistory);
    expect(slow.href).toEqual("https://slow.example.test/next?request=slow#done");
    expect(fast.href).toEqual("https://fast.example.test/next?request=fast#done");
    expect(slow.historyLength).toEqual(2);
    expect(fast.historyLength).toEqual(2);
    expect(slow.html).toEqual("<main>slow next</main>");
    expect(fast.html).toEqual("<main>fast next</main>");
    expect(slow.routerPath).toEqual("/next");
    expect(fast.routerPath).toEqual("/next");
    expect(slow.popstates).toEqual([]);
    expect(fast.popstates).toEqual([]);
  });
});
