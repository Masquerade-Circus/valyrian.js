let plugin = function (v) {
  if (v.is.browser) {
    v.sw = function (file = v.sw.file, options = v.sw.options) {
      return navigator.serviceWorker
        .register(file, options)
        .then(() => navigator.serviceWorker.ready)
        .then(() => {
          v.sw.ready = true;
          v.sw.file = file;
          v.sw.options = options;
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(navigator.serviceWorker);
            }, 10);
          });
        });
    };

    v.sw.ready = false;
    v.sw.file = '/sw.js';
    v.sw.options = { scope: '/' };
  }
};

// module.exports = plugin;
export default plugin;
