let plugin = function (v) {
  if (!v.isNode) {
    v.sw = async function (file = v.sw.file, options = v.sw.options) {
      await navigator.serviceWorker
        .register(file, options);

      v.sw.ready = true;
      v.sw.file = file;
      v.sw.options = options;
      return navigator.serviceWorker;
    };

    v.sw.ready = false;
    v.sw.file = '/sw.js';
    v.sw.options = { scope: '/' };
  }
};

export default plugin;
