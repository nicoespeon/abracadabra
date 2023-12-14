/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-check

const fs = require("fs/promises");
const esbuild = require("esbuild");
const plugin = require("node-stdlib-browser/helpers/esbuild/plugin");
const stdLibBrowser = require("node-stdlib-browser");

const platform = process.argv[2];
const production = process.argv.includes("--production");

/**
 * @type {Record<string, esbuild.BuildOptions>}
 */
const platformOptions = {
  browser: {
    outfile: "out/extension-browser.js",
    inject: [require.resolve("node-stdlib-browser/helpers/esbuild/shim")],
    define: {
      assert: "assert",
      path: "path",
      process: "process",
      util: "util",
      Buffer: "Buffer"
    },
    plugins: [plugin(stdLibBrowser)],
    platform: "browser"
  },
  node: {
    outfile: "out/extension.js",
    platform: "node"
  }
};

(async () => {
  const result = await esbuild.build({
    entryPoints: ["./src/extension.ts"],
    format: "cjs",
    bundle: true,
    minify: production,
    sourcemap: true,
    metafile: true,
    loader: { ".html": "text" },
    external: ["vscode"],
    ...platformOptions[platform]
  });

  await fs.writeFile(`meta-${platform}.json`, JSON.stringify(result.metafile));
})();
