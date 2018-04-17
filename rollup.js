let rollup = require('rollup');
let commonjs = require('rollup-plugin-commonjs');
let nodeResolve = require('rollup-plugin-node-resolve');
let babel = require('rollup-plugin-babel');
let includepaths = require('rollup-plugin-includepaths');
let filesize = require('rollup-plugin-filesize');
let progress = require('rollup-plugin-progress');
let uglify = require('rollup-plugin-uglify');
let asyncPlugin = require('rollup-plugin-async');
let buble = require('rollup-plugin-buble');

let build = process.argv.indexOf('build') !== -1;

let uglifyOptions = {
    ecma: 5,
    mangle: true,
    compress: {
        warnings: false, // Suppress uglification warnings
        pure_getters: true,
        unsafe: true,
    },
    output: {
        comments: false,
    },
};

let inputOptions = {
    input: './lib/index.js',
    plugins: [
        progress({ clearLine: false }),
        includepaths({ paths: ['./lib', './node_modules'] }),
        nodeResolve({
            jsnext: true,
            main: true,
            browser: false,
        }),

        commonjs({
            include: './node_modules/**',  // Default: undefined
            // if false then skip sourceMap generation for CommonJS modules
            sourceMap: true,  // Default: true
        }),
        //asyncPlugin(),
        //babel(),
        buble(),
    ],
};

let outputOptions = {
    file: './dist/valyrian.min.js',
    format: 'iife',
    sourcemap: true,
};

if (build) {
    outputOptions.sourcemap = false;
    inputOptions.plugins.push(uglify(uglifyOptions));
}

inputOptions.plugins.push(filesize());

rollup.rollup(inputOptions)
    .then(bundle => bundle.write(outputOptions))
    .then(() => console.log('Bundle finished.'));
