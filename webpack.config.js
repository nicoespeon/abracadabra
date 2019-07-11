// @ts-check

"use strict";

const path = require("path");

/** @type {import('webpack').Configuration} */
const config = {
  // vscode extensions run in a Node.js-context
  // => https://webpack.js.org/configuration/node/
  target: "node",

  // => https://webpack.js.org/configuration/entry-context/
  entry: "./src/extension.ts",

  output: {
    // Bundle is stored in the 'out' folder (check package.json)
    // => https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, "out"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../[resource-path]"
  },

  devtool: "source-map",

  externals: {
    // The vscode-module is created on-the-fly and must be excluded.
    // Add other modules that cannot be webpack'ed.
    // => https://webpack.js.org/configuration/externals/
    vscode: "commonjs vscode"
  },

  resolve: {
    // Support reading TypeScript and JavaScript files
    // => https://github.com/TypeStrong/ts-loader
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader"
          }
        ]
      }
    ]
  }
};

module.exports = config;
