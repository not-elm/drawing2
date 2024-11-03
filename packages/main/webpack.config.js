const path = require("node:path");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const { execSync } = require("node:child_process");
const commitHash = execSync("git rev-parse --short HEAD").toString().trim();
const webpack = require("webpack");
module.exports = {
    mode: process.env.NODE_ENV ?? "development",
    entry: {
        index: path.resolve(__dirname, "./src/index.tsx"),
    },
    output: {
        path: path.resolve(__dirname, "build"),
        filename: "[name].js",
    },
    resolve: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
    },
    module: {
        rules: [
            {
                test: /\.(?:js|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                use: "babel-loader",
            },
            {
                test: /\.svg$/i,
                issuer: /\.[jt]sx?$/,
                use: [{ loader: "@svgr/webpack", options: {} }],
            },
        ],
    },
    experiments: {
        asyncWebAssembly: true,
    },
    devtool: "source-map",
    plugins: [
        new ForkTsCheckerWebpackPlugin(),
        new webpack.DefinePlugin({
            __COMMIT_HASH__: JSON.stringify(commitHash),
        }),
        new HTMLWebpackPlugin({
            template: path.resolve(__dirname, "./src/index.html"),
        }),
    ],
};
