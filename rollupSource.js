let rollup = require('rollup');
let commonjs = require('rollup-plugin-commonjs');
let nodeResolve = require('rollup-plugin-node-resolve');
let includepaths = require('rollup-plugin-includepaths');
let filesize = require('rollup-plugin-filesize');
let progress = require('rollup-plugin-progress');
let uglify = require('rollup-plugin-uglify');
let buble = require('rollup-plugin-buble');
let string = require('rollup-plugin-string');

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
            browser: true,
        }),
        string({
            include: '**/*.tpl.js'
        }),
        commonjs({
            include: [
                './node_modules/**'
            ],  // Default: undefined
            // if false then skip sourceMap generation for CommonJS modules
            sourceMap: true,  // Default: true
        })
    ],
    cache: undefined
};

let outputOptions = {
    file: './dist/valyrian.min.js',
    format: 'iife',
    sourcemap: true,
    name: 'v'
};

if (process.env.NODE_ENV === 'production') {
    let promises = [];
    let fileDir = './dist/';
    let bundlesOutput = [
        // Normal bundle
        {
            file: fileDir + 'valyrian.js',
            format: 'umd',
            sourcemap: true
        },
        // Esm bundle
        {
            file: fileDir + 'valyrian.esm.js',
            format: 'es',
            sourcemap: true
        },
        // Minified bundle
        {
            file: fileDir + 'valyrian.min.js',
            format: 'iife',
            sourcemap: false
        }
    ];

    bundlesOutput.forEach(bundleOutput => {
        promises.push(
            new Promise((resolve, reject) => {
                let options = Object.assign({}, inputOptions);
                options.plugins = inputOptions.plugins.map(item => item);
                if (bundleOutput.format !== 'es'){
                    options.plugins.push(buble());
                }

                if (bundleOutput.sourcemap === false){
                    options.plugins.push(uglify(uglifyOptions));
                }

                options.plugins.push(filesize());

                rollup
                        .rollup(options)
                        .then(bundle => bundle.write(bundleOutput))
                        .then(resolve)
                        .catch(reject);

            })
        );
    });
    
    Promise.all(promises)
        .then(() => console.log('Bundle finished.'));
}

if (process.env.NODE_ENV !== 'production') {
    inputOptions.plugins.push(buble());
    inputOptions.plugins.push(uglify(uglifyOptions));
    inputOptions.plugins.push(filesize());

    inputOptions.output = outputOptions;
    inputOptions.watch = {
        include: ['./lib/**'],
        chokidar: false
    };

    const watch = rollup.watch(inputOptions);
    const stderr = console.error.bind(console);

    watch.on('event', (event) => {
        switch (event.code) {
            case 'START':
                stderr('checking rollup-watch version...');
                break;
            case 'BUNDLE_START':
                stderr(`bundling ${outputOptions.file}...`);
                break;
            case 'BUNDLE_END':
                stderr(`${outputOptions.file} bundled in ${event.duration}ms.`);
                break;
            case 'ERROR':
                stderr(`error: ${event.error}`);
                break;
            case 'FATAL':
                stderr(`error: ${event.error}`);
                break;
            case 'END':
                stderr(`Watching for changes...`);
                break;
            default:
                stderr(`unknown event: ${event}`);
        }
    });
}