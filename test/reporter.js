const mocha = require("mocha");
const Spec = mocha.reporters.Spec;

function CustomReporter(runner) {
  Spec.call(this, runner);

  runner.on("end", function () {
    // This is just a simple example, you'd modify the time logic in the appropriate place
    // eslint-disable-next-line no-console
    console.log("Finished in " + runner.stats.duration + "ms");
  });
}

CustomReporter.prototype = Object.create(Spec.prototype);
CustomReporter.prototype.constructor = CustomReporter;

module.exports = CustomReporter;
