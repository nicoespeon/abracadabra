import { assert } from "../../assert";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { extractGenericType } from "./extract-generic-type";

describe("Extract Generic Type - Function declaration", () => {
  describe("should extract generic type", () => {
    it("a primitive type", () => {
      shouldExtractGenericType({
        code: `function doSomething(message: [cursor]string) {}`,
        expected: `function doSomething<T = string>(message: T) {}`
      });
    });

    it("with existing generics", () => {
      shouldExtractGenericType({
        code: `function doSomething<T>(message: [cursor]string): T {}`,
        expected: `function doSomething<T, U = string>(message: U): T {}`
      });
    });

    it("return type", () => {
      shouldExtractGenericType({
        code: `function doSomething(message: string): [cursor]boolean {}`,
        expected: `function doSomething<T = boolean>(message: string): T {}`
      });
    });
  });

  describe("cursor position", () => {
    it("should put the cursor on extracted symbol", () => {
      shouldExtractGenericType({
        code: `function doSomething(message: [cursor]string) {}`,
        expected: `function doSomething<[cursor]T = string>(message: T) {}`,
        checkCursorPosition: true
      });
    });

    it("should put the cursor on extracted symbol with existing type parameters", () => {
      shouldExtractGenericType({
        code: `function doSomething<T = number>(message: [cursor]string): T {}`,
        expected: `function doSomething<T = number, [cursor]U = string>(message: U): T {}`,
        checkCursorPosition: true
      });
    });
  });

  describe("multiple occurrences", () => {
    it("should only replace the selected occurrence if user decides to", () => {
      const code = `function doSomething(message: [cursor]string, reason: string) {}`;
      const editor = new InMemoryEditor(code);
      let result = extractGenericType({
        state: "new",
        code: editor.code,
        selection: editor.selection
      });

      assert(
        result.action === "ask user choice",
        `Should ask user choice, but got "${result.action}"`
      );
      const selectedOccurrenceChoice = result.choices.find(
        (choice) => choice.value === "selected occurrence"
      );
      assert(
        selectedOccurrenceChoice,
        "Should have a choice for selected occurrence"
      );
      result = extractGenericType({
        state: "user choice response",
        choice: selectedOccurrenceChoice,
        code: editor.code,
        selection: editor.selection
      });

      expect(result).toMatchObject({
        action: "write",
        code: `function doSomething<T = string>(message: T, reason: string) {}`
      });
    });

    it("should replace all occurrences if user decides to", () => {
      const code = `function doSomething(message: [cursor]string, reason: string): string {}`;
      const editor = new InMemoryEditor(code);
      let result = extractGenericType({
        state: "new",
        code: editor.code,
        selection: editor.selection
      });

      assert(
        result.action === "ask user choice",
        `Should ask user choice, but got "${result.action}"`
      );
      const allOccurrencesChoice = result.choices.find(
        (choice) => choice.value === "all occurrences"
      );
      assert(allOccurrencesChoice, "Should have a choice for all occurrences");
      result = extractGenericType({
        state: "user choice response",
        choice: allOccurrencesChoice,
        code: editor.code,
        selection: editor.selection
      });

      expect(result).toMatchObject({
        action: "write",
        code: `function doSomething<T = string>(message: T, reason: T): T {}`
      });
    });

    it("should only match identical type aliases", () => {
      const code = `function doSomething(message: [cursor]Message, reason: Reason): Message {}`;
      const editor = new InMemoryEditor(code);
      let result = extractGenericType({
        state: "new",
        code: editor.code,
        selection: editor.selection
      });

      assert(
        result.action === "ask user choice",
        `Should ask user choice, but got "${result.action}"`
      );
      const allOccurrencesChoice = result.choices.find(
        (choice) => choice.value === "all occurrences"
      );
      assert(allOccurrencesChoice, "Should have a choice for all occurrences");
      result = extractGenericType({
        state: "user choice response",
        choice: allOccurrencesChoice,
        code: editor.code,
        selection: editor.selection
      });

      expect(result).toMatchObject({
        action: "write",
        code: `function doSomething<T = Message>(message: T, reason: Reason): T {}`
      });
    });

    it("should only replace all occurrences of the same interface", () => {
      const code = `function doSomething(message: string, reason: string) {}
    function doSomethingElse(message: [cursor]string, reason: string) {}`;
      const editor = new InMemoryEditor(code);
      let result = extractGenericType({
        state: "new",
        code: editor.code,
        selection: editor.selection
      });

      assert(
        result.action === "ask user choice",
        `Should ask user choice, but got "${result.action}"`
      );
      const allOccurrencesChoice = result.choices.find(
        (choice) => choice.value === "all occurrences"
      );
      assert(allOccurrencesChoice, "Should have a choice for all occurrences");
      result = extractGenericType({
        state: "user choice response",
        choice: allOccurrencesChoice,
        code: editor.code,
        selection: editor.selection
      });

      expect(result).toMatchObject({
        action: "write",
        code: `function doSomething(message: string, reason: string) {}
    function doSomethingElse<T = string>(message: T, reason: T) {}`
      });
    });
  });
});
function shouldExtractGenericType({
  code,
  expected,
  checkCursorPosition
}: {
  code: Code;
  expected: Code;
  checkCursorPosition?: boolean;
}) {
  const editor = new InMemoryEditor(code);
  const result = extractGenericType({
    state: "new",
    code: editor.code,
    selection: editor.selection
  });

  const expectedEditor = new InMemoryEditor(expected);
  expect(result).toMatchObject(
    checkCursorPosition
      ? {
          action: "write",
          code: expectedEditor.code,
          newCursorPosition: expectedEditor.selection.start
        }
      : { action: "write", code: expectedEditor.code }
  );
}
