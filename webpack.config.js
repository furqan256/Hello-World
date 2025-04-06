const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
    target: 'node',
    mode: 'none', // Set to 'production' for minification

    entry: './src/extension.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2'
    },
    externals: {
        vscode: 'commonjs vscode',
        // Don't bundle these Node.js native modules
        'cpu-features': 'cpu-features',
        'node-fetch': 'node-fetch'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            },
            {
                test: /\.node$/,
                use: 'node-loader',
            }
        ]
    },
    devtool: 'nosources-source-map',
    infrastructureLogging: {
        level: "log", // enables logging required for problem matchers
    }
};