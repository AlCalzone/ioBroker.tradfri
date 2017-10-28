const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    cache: true,
    devtool: "cheap-module-source-map",
    entry: {
        main: "./admin/src/index.tsx",
        vendor: ["react", "react-dom"],
    },
    output: {
        filename: "./admin/build/[name].bundle.js",
    },
    resolve: {
        extensions: [".tsx", ".ts", ".jsx", ".js"],
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.NamedModulesPlugin(),
        new webpack.NamedChunksPlugin((chunk) => {
            if (chunk.name) {
                return chunk.name;
            }
            return chunk.modules.map(m => path.relative(m.context, m.request)).join("_");
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: Infinity
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'runtime'
        }),
    ],
    module: {
        rules: [
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                options: {
                    configFile: "webpack.tsconfig.json",
                }
            },
        ],
    },
    externals: {
        jquery: 'jQuery',
        socketio: 'socket',
        sendTo: 'sendTo',
    }
}