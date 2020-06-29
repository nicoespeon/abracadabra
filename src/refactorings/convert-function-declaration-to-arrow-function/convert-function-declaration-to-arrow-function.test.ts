import { Editor, ErrorReason, Code } from "../../editor/editor";
import { Selection } from "../../editor/selection";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { convertFunctionDeclarationToArrowFunction } from "./convert-function-declaration-to-arrow-function";

describe("Convert Function Declaration To Arrow Function", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should convert function declaration to arrow function",
    [
      {
        description: "basic",
        code: `function fn(a: string): number { return 1; }`,
        expected: `const fn = (a: string): number => { return 1; };`
      },
      {
        description: "generic",
        code: `function fn<T>(t: T): T { return t; }`,
        expected: `const fn = <T>(t: T): T => { return t; };`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doConvertFunctionDeclarationToArrowFunction(
        code,
        selection
      );

      expect(result).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doConvertFunctionDeclarationToArrowFunction(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindFunctionDeclarationToConvert
    );
  });

  async function doConvertFunctionDeclarationToArrowFunction(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    editor.showError = showErrorMessage;
    await convertFunctionDeclarationToArrowFunction(code, selection, editor);
    return editor.code;
  }
});
