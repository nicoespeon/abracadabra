import { readFile } from "node:fs/promises";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [htmlAsText()],
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
    exclude: ["**/*.contract.test.ts"],
    setupFiles: ["./src/test/custom-matchers.ts"]
  }
});

// Mirrors esbuild's `.html: text` loader used to bundle the extension
function htmlAsText() {
  return {
    name: "html-as-text",
    enforce: "pre",
    async load(id) {
      if (!id.endsWith(".html")) return;
      const html = await readFile(id, "utf8");
      return `export default ${JSON.stringify(html)};`;
    }
  };
}
