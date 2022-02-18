class Sw {
  file = "/sw.js";
  options = { scope: "/" };
  ready = false;
  sw = null;

  constructor(file, options) {
    if (Boolean(typeof process !== "undefined" && process.versions && process.versions.node)) {
      console.info('Service Worker registration not supported in node.js');
      return;
    }

    if (file) {
      this.file = file;
    }
    if (options) {
      this.options = options;
    }
  }

  async register() {
    await navigator.serviceWorker.register(this.file, this.options);
    this.ready = true;
    this.sw = navigator.serviceWorker;
    return this.sw;
  }
}

Sw.default = Sw;
module.exports = Sw;
