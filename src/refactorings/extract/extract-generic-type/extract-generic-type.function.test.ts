import { Code } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { Position } from "../../../editor/position";
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
      },
      {
        description: "return type",
        code: `function doSomething(message: string): boolean {}`,
        selection: Selection.cursorAt(0, 39),
        expected: `function doSomething<T = boolean>(message: string): T {}`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doExtractGenericType(code, selection);

      expect(result).toBe(expected);
    }
  );

  describe("cursor position", () => {
    it("should put the cursor on extracted symbol", async () => {
      const code = `function doSomething(message: string) {}`;
      const selection = Selection.cursorAt(0, 30);
      const editor = new InMemoryEditor(code);

      await extractGenericType(code, selection, editor);

      /**
       * Produced code =>
       *
       * function doSomething<T = string>(message: T) {
       */
      const expectedPosition = new Position(0, 21);
      expect(editor.position).toEqual(expectedPosition);
    });

    it("should put the cursor on extracted symbol with existing type parameters", async () => {
      const code = `function doSomething<T = number>(message: string): T {}`;
      const selection = Selection.cursorAt(0, 42);
      const editor = new InMemoryEditor(code);

      await extractGenericType(code, selection, editor);

      /**
       * Produced code =>
       *
       * function doSomething<T = number, U = string>(message: U): T {
       */
      const expectedPosition = new Position(0, 33);
      expect(editor.position).toEqual(expectedPosition);
    });
  });

  describe("multiple occurrences", () => {
    it("should only replace the selected occurrence if user decides to", async () => {
      const code = `function doSomething(message: string, reason: string) {}`;
      const selection = Selection.cursorAt(0, 30);
      const editor = new InMemoryEditor(code);
      jest
        .spyOn(editor, "askUser")
        .mockImplementation(([_, selectedOccurrence]) =>
          Promise.resolve(selectedOccurrence)
        );

      await extractGenericType(code, selection, editor);

      const expected = `function doSomething<T = string>(message: T, reason: string) {}`;
      expect(editor.code).toBe(expected);
    });

    it("should replace all occurrences if user decides to", async () => {
      const code = `function doSomething(message: string, reason: string): string {}`;
      const selection = Selection.cursorAt(0, 30);
      const editor = new InMemoryEditor(code);
      jest
        .spyOn(editor, "askUser")
        .mockImplementation(([allOccurrences]) =>
          Promise.resolve(allOccurrences)
        );

      await extractGenericType(code, selection, editor);

      const expected = `function doSomething<T = string>(message: T, reason: T): T {}`;
      expect(editor.code).toBe(expected);
    });

    it("should only replace all occurrences of the same interface", async () => {
      const code = `function doSomething(message: string, reason: string) {}
function doSomethingElse(message: string, reason: string) {}`;
      const selection = Selection.cursorAt(1, 34);
      const editor = new InMemoryEditor(code);
      jest
        .spyOn(editor, "askUser")
        .mockImplementation(([allOccurrences]) =>
          Promise.resolve(allOccurrences)
        );

      await extractGenericType(code, selection, editor);

      const expected = `function doSomething(message: string, reason: string) {}
function doSomethingElse<T = string>(message: T, reason: T) {}`;
      expect(editor.code).toBe(expected);
    });
  });

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
