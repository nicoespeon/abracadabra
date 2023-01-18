import * as t from "./domain";
import { parse, transform } from "./transformation";

describe("Transformation", () => {
  describe("transform", () => {
    it("should not consider code changed with Windows EOL", () => {
      const code = "console.log('Hello Windows')\r\n";

      const { hasCodeChanged } = transform(code, {});

      expect(hasCodeChanged).toBe(false);
    });

    it("should not consider code changed with Unix EOL", () => {
      const code = "console.log('Hello UNIX')\n";

      const { hasCodeChanged } = transform(code, {});

      expect(hasCodeChanged).toBe(false);
    });

    it("should not crash with top-level await", () => {
      const code = `async function doSomething() {}

await doSomething();`;

      expect(() => transform(code, {})).not.toThrow();
    });

    it("should preserve tabs", () => {
      const code = `\t\tconsole.log("Hello Tabs")`;

      const { code: result } = transform(code, {
        StringLiteral(path) {
          path.node.value = `Tabs still here?`;
        }
      });

      expect(result).toBe(`\t\tconsole.log("Tabs still here?")`);
    });

    it("should preserve tabs (multi-lines)", () => {
      const code = `function doSomethingWithTabs() {
\tconst message = "Hello!";
\t\tconsole.log(message);
}`;

      const { code: result } = transform(code, {
        StringLiteral(path) {
          path.node.value = `Tabs still here?`;
        }
      });

      expect(result).toBe(`function doSomethingWithTabs() {
\tconst message = "Tabs still here?";
\t\tconsole.log(message);
}`);
    });

    it("should preserve spaces", () => {
      const code = `  console.log("Hello Tabs")`;

      const { code: result } = transform(code, {
        StringLiteral(path) {
          path.node.value = `Tabs still here?`;
        }
      });

      expect(result).toBe(`  console.log("Tabs still here?")`);
    });

    it("should preserve interpreter directive (shebang)", () => {
      const code = `#!/usr/bin/env node

function test() {}`;

      const { code: result } = transform(code, {
        FunctionDeclaration(path) {
          path.replaceWith(
            t.variableDeclaration("const", [
              t.variableDeclarator(
                t.identifier("hello"),
                t.stringLiteral("world")
              )
            ])
          );
        }
      });

      expect(result).toBe(`#!/usr/bin/env node

const hello = "world";`);
    });

    it("should preserve interpreter directive (shebang) when no transformation is made", () => {
      const code = `#!/usr/bin/env node

function test() {}`;

      const { code: result } = transform(code, {});

      expect(result).toBe(`#!/usr/bin/env node

function test() {}`);
    });
  });

  describe("parse", () => {
    it("throw if code contains syntax error", () => {
      const code = "function { console.log('missing }'); ";

      expect(() => parse(code)).toThrow();
    });

    it("should parse `satisfies` with comments inside", () => {
      const code = `const irrelant = {
  // this comment should not make parsing fail
  dummy: 0,
} satisfies DummyType;`;

      expect(() => parse(code)).not.toThrow();
    });
  });
});
