import fs from "fs";
import path from "path";

interface SwOptions {
  version?: string;
  name?: string;
  /** @deprecated Use criticalUrls instead */
  urls?: string[];
  /** Critical URLs that block installation (required for app to work) */
  criticalUrls?: string[];
  /** Optional URLs cached in background (non-blocking, won't fail install) */
  optionalUrls?: string[];
  debug?: boolean;
  logFetch?: boolean;
  offlinePage?: string;
}

export function sw(file: string, options: SwOptions = {}) {
  const swfiletemplate = path.resolve(__dirname, "./node.sw.js");
  const swTpl = fs.readFileSync(swfiletemplate, "utf8");

  // Support backwards compatibility: if urls is provided but criticalUrls is not, use urls as criticalUrls
  const criticalUrls = options.criticalUrls ?? options.urls ?? ["/"];
  const optionalUrls = options.optionalUrls ?? [];

  const opt = {
    version: options.version ?? "1",
    name: options.name ?? "Valyrian.js",
    criticalUrls,
    optionalUrls,
    debug: options.debug ?? false,
    logFetch: options.logFetch ?? false,
    offlinePage: options.offlinePage ?? "/offline.html"
  };

  let contents = swTpl
    .replace("v1", `v${opt.version}`)
    .replace("Valyrian.js", opt.name)
    .replace('criticalUrls: ["/"]', `criticalUrls: ${JSON.stringify(opt.criticalUrls)}`)
    .replace("optionalUrls: []", `optionalUrls: ${JSON.stringify(opt.optionalUrls)}`)
    .replace("/offline.html", opt.offlinePage)
    .replace("logFetch: false", opt.logFetch ? "logFetch: true" : "logFetch: false");

  if (!opt.debug) {
    contents = contents.replace("console.log", "() => {}");
  }

  fs.writeFileSync(file, contents, "utf8");
}

/*
  // On the server side to generate the service worker
  sw("sw.js", {
    version: "1",
    name: "Valyrian.js",
    urls: ["/"],
    debug: false,
    logFetch: false,
    offlinePage: "/offline.html"
  });


  // On the client side
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.register("/sw.js");
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing as ServiceWorker;
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed") {
          // Notify the user about the new version and ask if they want to update
          if (confirm("There is a new version available. Do you want to update?")) {
            // Send a message to the service worker to skip the waiting
            navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
          }
        }
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }
*/
