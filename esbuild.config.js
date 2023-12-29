/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-check

const fs = require("fs/promises");
const esbuild = require("esbuild");
const plugin = require("node-stdlib-browser/helpers/esbuild/plugin");
const stdLibBrowser = require("node-stdlib-browser");

const production = process.argv.includes("--production");

/**
 * @type {esbuild.BuildOptions}
 */
const commonOptions = {
  entryPoints: ["./src/extension.ts"],
  format: "cjs",
  bundle: true,
  minify: production,
  sourcemap: !production,
  metafile: !production,
  loader: { ".html": "text" },
  external: ["vscode"]
};

/**
 * @type {esbuild.BuildOptions[]}
 */
const options = [
  {
    ...commonOptions,
    outfile: "out/extension.js",
    platform: "node"
  },
  {
    ...commonOptions,
    outfile: "out/extension-browser.js",
    platform: "browser",
    inject: [require.resolve("node-stdlib-browser/helpers/esbuild/shim")],
    define: {
      assert: "assert",
      path: "path",
      process: "process",
      util: "util",
      Buffer: "Buffer"
    },
    plugins: [plugin(stdLibBrowser)]
  }
];

options
  .filter(({ platform }) => process.argv.includes(`--${platform}`))
  .forEach(async (option) => {
    const result = await esbuild.build(option);
    if (production) return;

    await fs.writeFile(
      `out/meta-${option.platform}.json`,
      JSON.stringify(result.metafile)
    );
  });
