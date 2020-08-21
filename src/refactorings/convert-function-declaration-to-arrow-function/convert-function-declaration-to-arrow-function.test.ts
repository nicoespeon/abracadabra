import { ErrorReason, Code } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { convertFunctionDeclarationToArrowFunction } from "./convert-function-declaration-to-arrow-function";

describe("Convert Function Declaration To Arrow Function", () => {
  testEach<{ code: Code; expected: Code }>(
    "should convert function declaration to arrow function",
    [
      {
        description: "non-generic",
        code: `function fn(a: string): number { return 1; }`,
        expected: `const fn = (a: string): number => { return 1; };`
      },
      {
        description: "non-generic async",
        code: `async function fn(a: string): number { return 1; }`,
        expected: `const fn = async (a: string): number => { return 1; };`
      },
      {
        description: "generic",
        code: `function fn<T>(t: T): T { return t; }`,
        expected: `const fn = <T>(t: T): T => { return t; };`
      },
      {
        description: "generic async",
        code: `async function fn<T>(t: T): T { return t; }`,
        expected: `const fn = async <T>(t: T): T => { return t; };`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);

      await convertFunctionDeclarationToArrowFunction(editor);

      expect(editor.code).toBe(expected);
    }
  );

  it("should show an error message if refactoring can't be made", async () => {
    const code = `[cursor]// This is a comment, can't be refactored`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "showError");

    await convertFunctionDeclarationToArrowFunction(editor);

    expect(editor.showError).toBeCalledWith(
      ErrorReason.DidNotFindFunctionDeclarationToConvert
    );
  });
});
