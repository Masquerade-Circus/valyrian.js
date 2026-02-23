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

* Keep JSX factory aligned with `v`/`v.fragment`.
* Keep docs examples and runtime behavior aligned with the same component APIs.

## 9.3. Express/Fastify SSR

Use `valyrian.js/node` for server rendering and request scoping.

```ts
import { render, ServerStorage } from "valyrian.js/node";

app.get("*", (req, res) => {
  ServerStorage.run(() => {
    const html = render(<App />);
    res.send(html);
  });
});
```

## 9.4. API Client Composition

Create per-domain clients with `request.new()` and attach plugins once.

```ts
const authApi = request.new("/api/auth");
const billingApi = request.new("/api/billing");
```

## 9.5. Offline-First Commands

Wrap mutating calls with `OfflineQueue` in flaky network contexts:

* enqueue operations while offline
* retry with backoff
* inspect failed queue and recover with `retryOne`/`retryAll`

## 9.6. Production Checklist

1. Confirm SSR route rendering and error handlers.
2. Confirm request URL rewriting for Node runtime.
3. Confirm service worker update strategy (`prompt-user`, `auto`, `manual`).
4. Confirm docs examples match tested module behavior.
