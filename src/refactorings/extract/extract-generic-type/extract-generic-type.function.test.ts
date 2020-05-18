import { Code } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { extractGenericType } from "./extract-generic-type";

describe("Extract Generic Type - Function declaration", () => {
  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should extract generic type from a function",
    [
      {
        description: "a primitive type",
        code: `function doSomething(message: string) {}`,
        selection: Selection.cursorAt(0, 30),
        expected: `function doSomething<T = string>(message: T) {}`
      },
      {
        description: "with existing generics",
        code: `function doSomething<T>(message: string): T {}`,
        selection: Selection.cursorAt(0, 33),
        expected: `function doSomething<T, U = string>(message: U): T {}`
      }
      // TODO: multiple occurrences
      // TODO: return type becomes generic
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doExtractGenericType(code, selection);

      expect(result).toBe(expected);
    }
  );

  async function doExtractGenericType(
    code: Code,
    selection: Selection
  ): Promise<Code> {
    const editor = new InMemoryEditor(code);
    jest
      .spyOn(editor, "askUser")
      .mockImplementation(([_, selectedOccurrence]) =>
        Promise.resolve(selectedOccurrence)
      );
    await extractGenericType(code, selection, editor);
    return editor.code;
  }
});
