import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { simplifyTernary } from "./simplify-ternary";

describe("Simplify Ternary", () => {
  testEach<{ code: Code; expected: Code }>(
    "should simplify ternary",
    [
      {
        description: "true ? a : b === a",
        code: `const x = t[cursor]rue ? a : b;`,
        expected: `const x = a;`
      },
      {
        description: "false ? a : b === a",
        code: `const x = f[cursor]alse ? a : b;`,
        expected: `const x = b;`
      },
      {
        description: "a ? true : false === Boolean(a)",
        code: `const x = a[cursor] ? true : false;`,
        expected: `const x = Boolean(a);`
      },
      {
        description: "a ? false : true === !a",
        code: `const x = a[cursor] ? false : true;`,
        expected: `const x = !a;`
      },
      {
        description: "a ? true : true === true",
        code: `const x = a[cursor] ? true : true;`,
        expected: `const x = true;`
      },
      {
        description: "a ? false : false === false",
        code: `const x = a[cursor] ? false : false;`,
        expected: `const x = false;`
      },
      {
        description: "a ? a : b === a || b",
        code: `const x = a[cursor] ? a : b;`,
        expected: `const x = a || b;`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await simplifyTernary(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await simplifyTernary(editor);

    expect(editor.showError).toHaveBeenCalledWith(
      ErrorReason.DidNotFindTernaryToSimplify
    );
  });
});
