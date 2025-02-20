import fs from "fs";
import path from "path";

export function sw(file: string, options = {}) {
  const swfiletemplate = path.resolve(__dirname, "./node.sw.js");
  const swTpl = fs.readFileSync(swfiletemplate, "utf8");
  const opt = {
    version: "1",
    name: "Valyrian.js",
    urls: ["/"],
    debug: false,
    logFetch: false,
    offlinePage: "/offline.html",
    ...options
  };
  let contents = swTpl
    .replace("v1", `v${opt.version}`)
    .replace("Valyrian.js", opt.name)
    .replace('["/"]', '["' + opt.urls.join('","') + '"]')
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
