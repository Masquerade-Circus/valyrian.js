# 9. Recipes and Integrations

This page contains practical integration patterns.

Pick one recipe at a time. Keep the first integration path working before you combine strategies.

## 9.1. Vite Integration (Client App)

Valyrian works with Vite when you want HMR and ecosystem plugins.

```bash
npm i valyrian.js vite
```

Use `valyrian.js` in your app entry as usual; Vite handles dev server and production bundling.

## 9.2. Webpack/Rspack Integration

Use this path if your organization already standardizes on Webpack/Rspack.

Key points:

- Keep JSX factory aligned with `v`/`v.fragment`.
- Keep docs examples and runtime behavior aligned with the same component APIs.

## 9.3. Express/Fastify SSR

Use `valyrian.js/node` for request-scoped rendering on the server and mount the same app state on the client.

```tsx
import { v } from "valyrian.js";
import { render, ServerStorage } from "valyrian.js/node";
import { App } from "./app";

function AppShell({ initialState }, children) {
  const serializedState = JSON.stringify(initialState).replace(/</g, "\\u003c");

  return (
    <>
      {"<!doctype html>"}
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>Valyrian App</title>
        </head>
        <body>
          {children}
          <script>{`window.__INITIAL_STATE__=${serializedState};`}</script>
          <script type="module" src="/client-entry.js"></script>
        </body>
      </html>
    </>
  );
}

app.get("*", (req, res) => {
  ServerStorage.run(() => {
    const initialState = { path: req.url };
    const html = render(
      <AppShell initialState={initialState}>
        <App initialState={initialState} />
      </AppShell>
    );
    res.type("html").send(html);
  });
});
```

This recipe assumes the Valyrian app owns the full `body`.

Client entry:

```tsx
import { mount } from "valyrian.js";
import { App } from "./app";

declare global {
  interface Window {
    __INITIAL_STATE__?: Record<string, unknown>;
  }
}

mount("body", <App initialState={window.__INITIAL_STATE__ || {}} />);
```

For Fastify, use the same pattern and replace `res.type("html").send(...)` with `reply.type("text/html").send(...)`.

If you want to register Express/Fastify routes automatically from `router.routes()`, see [./7-ssr.md](./7-ssr.md) (Automatic Route Registration for Express/Fastify).

If you want router-level SSR prefetch with a client freshness refetch, see [./7-ssr.md](./7-ssr.md) (SSR + Router Prefetch + Client Refetch).

## 9.4. API Client Composition

Create per-domain clients with `request.new()` and attach plugins once.

```ts
const authApi = request.new("/api/auth");
const billingApi = request.new("/api/billing");
```

## 9.5. Offline-First Commands

Wrap mutating calls with `OfflineQueue` in flaky network contexts:

- enqueue operations while offline
- retry with backoff
- inspect failed queue and recover with `retryOne`/`retryAll`

## 9.6. Production Checklist

1. Confirm SSR route rendering and error handlers.
2. Confirm request URL rewriting for Node runtime.
3. Confirm route-level lazy loading chunks resolve correctly on direct URL access.
4. Confirm service worker update strategy (`prompt-user`, `auto`, `manual`).
5. Confirm docs examples match tested module behavior.
