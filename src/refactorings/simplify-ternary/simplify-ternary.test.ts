import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { simplifyTernary } from "./simplify-ternary";

describe("Simplify Ternary", () => {
  describe("should simplify ternary", () => {
    it("true ? a : b === a", () => {
      shouldSimplifyTernary({
        code: `const x = t[cursor]rue ? a : b;`,
        expected: `const x = a;`
      });
    });

    it("false ? a : b === a", () => {
      shouldSimplifyTernary({
        code: `const x = f[cursor]alse ? a : b;`,
        expected: `const x = b;`
      });
    });

    it("a ? true : false === Boolean(a)", () => {
      shouldSimplifyTernary({
        code: `const x = a[cursor] ? true : false;`,
        expected: `const x = Boolean(a);`
      });
    });

    it("a ? false : true === !a", () => {
      shouldSimplifyTernary({
        code: `const x = a[cursor] ? false : true;`,
        expected: `const x = !a;`
      });
    });

    it("a ? true : true === true", () => {
      shouldSimplifyTernary({
        code: `const x = a[cursor] ? true : true;`,
        expected: `const x = true;`
      });
    });

    it("a ? false : false === false", () => {
      shouldSimplifyTernary({
        code: `const x = a[cursor] ? false : false;`,
        expected: `const x = false;`
      });
    });

    it("a ? a : b === a || b", () => {
      shouldSimplifyTernary({
        code: `const x = a[cursor] ? a : b;`,
        expected: `const x = a || b;`
      });
    });
  });

  it("should show an error message if refactoring can't be made", () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    const result = simplifyTernary({
      state: "new",
      code: editor.code,
      selection: editor.selection
    });

    expect(result.action).toBe("show error");
  });
});

function shouldSimplifyTernary({
  code,
  expected
}: {
  code: Code;
  expected: Code;
}) {
  const editor = new InMemoryEditor(code);
  const result = simplifyTernary({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  expect(result).toMatchObject({ action: "write", code: expected });
}
