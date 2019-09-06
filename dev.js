const argv = require('yargs').argv;

let exam = require('exam');

let options = {
  paths: ['test'],
  reporter: 'console',
  recursive: true,
  hideProgress: false,
  bench: true,
  benchTime: 1000,
  require: ['@babel/register', 'esm']
};

if (argv.w) {
  options.watch = true;
} else {
  options.done = () => {
    process.exit(0);
  };
}

if (argv.T) {
  options.benchTime = argv.T;
}

exam(options);
