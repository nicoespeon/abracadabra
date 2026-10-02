import { readFile } from "node:fs/promises";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [htmlAsText()],
  test: {
    globals: true,
    // ~3x faster; safe as long as tests don't mutate module-level state
    isolate: false,
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
