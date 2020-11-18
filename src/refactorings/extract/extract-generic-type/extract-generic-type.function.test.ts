import { Code } from "../../../editor/editor";
import { Position } from "../../../editor/position";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { extractGenericType } from "./extract-generic-type";

describe("Extract Generic Type - Function declaration", () => {
  testEach<{ code: Code; expected: Code }>(
    "should extract generic type from a function",
    [
      {
        description: "a primitive type",
        code: `function doSomething(message: [cursor]string) {}`,
        expected: `function doSomething<T = string>(message: T) {}`
      },
      {
        description: "with existing generics",
        code: `function doSomething<T>(message: [cursor]string): T {}`,
        expected: `function doSomething<T, U = string>(message: U): T {}`
      },
      {
        description: "return type",
        code: `function doSomething(message: string): [cursor]boolean {}`,
        expected: `function doSomething<T = boolean>(message: string): T {}`
      }
    ],
    async ({ code, expected }) => {
      const editor = new InMemoryEditor(code);
      jest
        .spyOn(editor, "askUserChoice")
        .mockImplementation(([_, selectedOccurrence]) =>
          Promise.resolve(selectedOccurrence)
        );

      await extractGenericType(editor);

      expect(editor.code).toBe(expected);
    }
  );

  describe("cursor position", () => {
    it("should put the cursor on extracted symbol", async () => {
      const code = `function doSomething(message: [cursor]string) {}`;
      const editor = new InMemoryEditor(code);

      await extractGenericType(editor);

      /**
       * Produced code =>
       *
       * function doSomething<T = string>(message: T) {
       */
      const expectedPosition = new Position(0, 21);
      expect(editor.position).toEqual(expectedPosition);
    });

    it("should put the cursor on extracted symbol with existing type parameters", async () => {
      const code = `function doSomething<T = number>(message: [cursor]string): T {}`;
      const editor = new InMemoryEditor(code);

      await extractGenericType(editor);

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
      const code = `function doSomething(message: [cursor]string, reason: string) {}`;
      const editor = new InMemoryEditor(code);
      jest
        .spyOn(editor, "askUserChoice")
        .mockImplementation(([_, selectedOccurrence]) =>
          Promise.resolve(selectedOccurrence)
        );

      await extractGenericType(editor);

      const expected = `function doSomething<T = string>(message: T, reason: string) {}`;
      expect(editor.code).toBe(expected);
    });

    it("should replace all occurrences if user decides to", async () => {
      const code = `function doSomething(message: [cursor]string, reason: string): string {}`;
      const editor = new InMemoryEditor(code);
      jest
        .spyOn(editor, "askUserChoice")
        .mockImplementation(([allOccurrences]) =>
          Promise.resolve(allOccurrences)
        );

      await extractGenericType(editor);

      const expected = `function doSomething<T = string>(message: T, reason: T): T {}`;
      expect(editor.code).toBe(expected);
    });

    it("should only replace all occurrences of the same interface", async () => {
      const code = `function doSomething(message: string, reason: string) {}
function doSomethingElse(message: [cursor]string, reason: string) {}`;
      const editor = new InMemoryEditor(code);
      jest
        .spyOn(editor, "askUserChoice")
        .mockImplementation(([allOccurrences]) =>
          Promise.resolve(allOccurrences)
        );

      await extractGenericType(editor);

      const expected = `function doSomething(message: string, reason: string) {}
function doSomethingElse<T = string>(message: T, reason: T) {}`;
      expect(editor.code).toBe(expected);
    });
  });
});
