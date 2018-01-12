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
        entry: './app/index.js',
        output: {
            path: path.resolve(__dirname, 'app'),
            filename: 'index.min.js'
        },
        watch: true,
        plugins: [
            uglify
        ]
    }
];