/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-check

"use strict";

const path = require("path");
const webpack = require("webpack");
// const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

/** @returns {import('webpack').Configuration} */
const createConfig = (/** @type {{ browser?: boolean; }} */ env) => ({
  // Leaves the source code as close as possible to the original
  // (when packaging we set this to 'production')
  mode: "none",

  // vscode extensions run in a Node.js-context
  // => https://webpack.js.org/configuration/node/
  target: env.browser ? "webworker" : "node",

  // => https://webpack.js.org/configuration/entry-context/
  entry: "./src/extension.ts",

  output: {
    // Bundle is stored in the 'out' folder (check package.json)
    // => https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, "out"),
    filename: env.browser ? "extension-browser.js" : "extension.js",
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
    mainFields: ["browser", "main", "module"],
    // Support reading TypeScript and JavaScript files
    // => https://github.com/TypeStrong/ts-loader
    extensions: [".ts", ".js"],
    alias: env.browser
      ? {
          // These can't be resolved in the browser
          "@eslint/eslintrc": false,
          "@typescript-eslint/parser": false,
          eslint: false,
          "eslint-plugin-react-hooks": false
        }
      : {},
    fallback: env.browser
      ? {
          assert: require.resolve("assert"),
          buffer: require.resolve("buffer"),
          child_process: false,
          constants: false,
          console: false,
          crypto: false,
          fs: false,
          glob: false,
          http: false,
          https: false,
          os: false,
          perf_hooks: false,
          path: require.resolve("path-browserify"),
          stream: false,
          unxhr: false,
          url: false,
          util: require.resolve("util"),
          zlib: false
        }
      : {}
  },

  plugins: env.browser
    ? [
        new webpack.ProvidePlugin({
          process: "process/browser"
        }),
        // Work around for Buffer is undefined:
        // https://github.com/webpack/changelog-v5/issues/10
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"]
        })
        //new BundleAnalyzerPlugin()
      ]
    : [
        //new BundleAnalyzerPlugin()
      ],

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
      },
      {
        test: /\.html$/i,
        loader: "html-loader",
        options: {
          esModule: false
        }
      }
    ]
  }
});

module.exports = createConfig;
