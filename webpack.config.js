const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const uglify = new UglifyJsPlugin({
    parallel: true,
    uglifyOptions: {
        ecma: 5,
        mangle: true,
        compress: {
            warnings: false, // Suppress uglification warnings
            pure_getters: true,
            unsafe: true
        },
        output: {
            comments: false
        },
        exclude: [/\.min\.js$/gi]
    }
});

module.exports = [
    {
        entry: './lib/index.js',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'index.js'
        },
        watch: true,
        node: {
            console: false,
        	global: false,
        	process: false,
        	Buffer: false,
        	setImmediate: false
        },
        externals: {
          'html-element': 'htmlelement'
        },
        plugins: [
            uglify,
            new BundleAnalyzerPlugin()
        ]
    },
    {
        entry: './lib/router.js',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'router.js'
        },
        watch: true,
        node: {
            console: false,
        	global: false,
        	process: false,
        	Buffer: false,
        	setImmediate: false
        },
        externals: {

        },
        plugins: [
            uglify,
            // new BundleAnalyzerPlugin()
        ]
    },
    {
        entry: './client/index.js',
        output: {
            path: path.resolve(__dirname, 'client'),
            filename: 'index.cjs.js'
        },
        watch: true,
        plugins: [
            uglify
        ]
    }
];
