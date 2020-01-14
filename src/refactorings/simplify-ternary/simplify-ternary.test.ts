import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { simplifyTernary } from "./simplify-ternary";

describe("Simplify Ternary", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should simplify ternary",
    [
      {
        description: "bool ? a : b === a",
        code: `const x = true ? a : b;`,
        selection: Selection.cursorAt(0, 11),
        expected: `const x = a;`
      },
      {
        description: "a ? true : false === Boolean(a)",
        code: `const x = a ? true : false;`,
        selection: Selection.cursorAt(0, 11),
        expected: `const x = Boolean(a);`
      },
      {
        description: "a ? false : true === !a",
        code: `const x = a ? false : true;`,
        selection: Selection.cursorAt(0, 11),
        expected: `const x = !a;`
      },
      {
        description: "a ? true : true === true",
        code: `const x = a ? true : true;`,
        selection: Selection.cursorAt(0, 11),
        expected: `const x = true;`
      },
      {
        description: "a ? false : false === false",
        code: `const x = a ? false : false;`,
        selection: Selection.cursorAt(0, 11),
        expected: `const x = false;`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doSimplifyTernary(code, selection);

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doSimplifyTernary(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFoundTernaryToSimplify
    );
  });

  async function doSimplifyTernary(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await simplifyTernary(code, selection, editor);
    return editor.code;
  }
});
