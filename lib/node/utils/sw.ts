import fs from "fs";
import path from "path";

export function sw(file: string, options = {}) {
  const swfiletemplate = path.resolve(__dirname, "./node.sw.js");
  const swTpl = fs.readFileSync(swfiletemplate, "utf8");
  const opt = {
    version: "v1::",
    name: "Valyrian.js",
    urls: ["/"],
    debug: false,
    ...options
  };
  let contents = swTpl
    .replace("v1::", "v" + opt.version + "::")
    .replace("Valyrian.js", opt.name)
    .replace('["/"]', '["' + opt.urls.join('","') + '"]');

  if (!opt.debug) {
    contents = contents.replace("console.log", "() => {}");
  }

  fs.writeFileSync(file, contents, "utf8");
}

/*
  sw("sw.js", {
    version: "1",
    name: "Valyrian.js",
    urls: ["/", "/index.html"],
    debug: false
  });


  // On the client side
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js");

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "NEW_VERSION") {
        // Notify the user about the new version and ask if they want to update
        if (confirm("Hay una nueva versión disponible. ¿Deseas actualizar?")) {
          // Send a message to the service worker to skip the waiting
          navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
          window.location.reload();
        }
      }
    });
  }
*/
