let rollup = require("rollup");
let includepaths = require("rollup-plugin-includepaths");
let filesize = require("rollup-plugin-filesize");
let sourcemaps = require("rollup-plugin-sourcemaps");
let { terser } = require("rollup-plugin-terser");
let { sizeSnapshot } = require("rollup-plugin-size-snapshot");

const argv = require("yargs").argv;
let file = argv.file || "index";
let distFile = file === "index" ? "valyrian" : file;

let inputOptions = {
  input: "./lib/" + file + ".js",
  plugins: [includepaths({ paths: ["./lib"] }), sourcemaps(), filesize(), sizeSnapshot()],
  cache: undefined
};

let outputOptions = {
  file: "./dist/" + distFile + ".min.js",
  format: "iife",
  sourcemap: true,
  name: "v",
  compact: true
};

if (process.env.NODE_ENV === "production") {
  outputOptions.sourcemap = false;
  inputOptions.plugins.push(
    terser({
      warnings: "verbose",
      output: {
        ecma: 6
      }
    })
  );
  rollup
    .rollup(inputOptions)
    .then((bundle) => bundle.write(outputOptions))
    .then(() => console.log("Bundle finished."))
    .catch(console.log);
}

if (process.env.NODE_ENV !== "production") {
  inputOptions.plugins.push(terser({ warnings: "verbose" }));

  inputOptions.output = outputOptions;
  inputOptions.watch = {
    include: ["./lib/**"],
    chokidar: false
  };

  const watch = rollup.watch(inputOptions);
  const stderr = console.error.bind(console);

  watch.on("event", (event) => {
    switch (event.code) {
      case "START":
        stderr("checking rollup-watch version...");
        break;
      case "BUNDLE_START":
        stderr(`bundling ${outputOptions.file}...`);
        break;
      case "BUNDLE_END":
        stderr(`${outputOptions.file} bundled in ${event.duration}ms.`);
        break;
      case "ERROR":
        stderr(`error: ${event.error}`);
        break;
      case "FATAL":
        stderr(`error: ${event.error}`);
        break;
      case "END":
        stderr(`Watching for changes...`);
        break;
      default:
        stderr(`unknown event: ${event}`);
    }
  });
}
