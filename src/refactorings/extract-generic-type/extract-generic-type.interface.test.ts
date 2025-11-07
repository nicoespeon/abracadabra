import { assert } from "../../assert";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { Code } from "../../editor/editor";
import { renameSymbol } from "../rename-symbol/rename-symbol";
import { extractGenericType } from "./extract-generic-type";

describe("Extract Generic Type - Interface", () => {
  describe("should extract generic type", () => {
    it("primitive type (number)", () => {
      shouldExtractGenericType({
        code: `interface Position {
  x: n[cursor]umber;
  y: number;
}`,
        expected: `interface Position<T = number> {
  x: T;
  y: number;
}`
      });
    });

    it("primitive type (string)", () => {
      shouldExtractGenericType({
        code: `interface Position {
  x: s[cursor]tring;
  y: number;
}`,
        expected: `interface Position<T = string> {
  x: T;
  y: number;
}`
      });
    });

    it("with existing generics", () => {
      shouldExtractGenericType({
        code: `interface Position<T = number> {
  x: T;
  y: n[cursor]umber;
}`,
        expected: `interface Position<T = number, U = number> {
  x: T;
  y: U;
}`
      });
    });

    it("with nested structure", () => {
      shouldExtractGenericType({
        code: `interface Position {
  data: {
    x: nu[cursor]mber;
    y: number;
  }
}`,
        expected: `interface Position<T = number> {
  data: {
    x: T;
    y: number;
  }
}`
      });
    });

    it("with complex nested structure", () => {
      shouldExtractGenericType({
        code: `interface Position<T = string> {
  timestamp: T;
  data: {
    x: number;
    _position: {
      y: n[cursor]umber;
    }
  }
}`,
        expected: `interface Position<T = string, U = number> {
  timestamp: T;
  data: {
    x: number;
    _position: {
      y: U;
    }
  }
}`
      });
    });
  });

  it("should rename extracted symbol", () => {
    const result = shouldExtractGenericType({
      code: `interface Position {
  x: number;
  y: number[cursor];
  isActive: boolean;
}`,
      expected: `interface Position<T = number> {
  x: number;
  y: T;
  isActive: boolean;
}`
    });
    expect(result.thenRun).toBe(renameSymbol);
  });

  describe("cursor position", () => {
    it("should put the cursor on extracted symbol", () => {
      shouldExtractGenericType({
        code: `interface Position {
  x: number;
  y: number[cursor];
  isActive: boolean;
}`,
        expected: `interface Position<[cursor]T = number> {
  x: number;
  y: T;
  isActive: boolean;
}`,
        checkCursorPosition: true
      });
    });

    it("should put the cursor on extracted symbol with existing type parameters", () => {
      shouldExtractGenericType({
        code: `interface Position<T = boolean> {
  x: number;
  y: number[cursor];
  isActive: boolean;
}`,
        expected: `interface Position<T = boolean, [cursor]U = number> {
  x: number;
  y: U;
  isActive: boolean;
}`,
        checkCursorPosition: true
      });
    });

    it("should put the cursor on extracted symbol when we extract an object", () => {
      shouldExtractGenericType({
        code: `interface Position {
  data: [cursor]{
    x: number;
    y: number;
  }
}`,
        expected: `interface Position<[cursor]T = {
  x: number;
  y: number;
}> {
  data: T
}`,
        checkCursorPosition: true
      });
    });
  });

  describe("multiple occurrences", () => {
    it("should ask user to replace all occurrences", () => {
      const code = `interface Position {
  x: [cursor]number;
  y: number;
  isActive: boolean;
}`;
      const editor = new InMemoryEditor(code);
      const result = extractGenericType({
        state: "new",
        code: editor.code,
        selection: editor.selection,
        highlightSources: []
      });

      expect(result).toMatchObject({
        action: "ask user choice",
        choices: [
          {
            value: "all occurrences",
            label: "Replace all 2 occurrences"
          },
          {
            value: "selected occurrence",
            label: "Replace this occurrence only"
          }
        ]
      });
    });

    it("should only replace the selected occurrence if user decides to", async () => {
      const code = `interface Position {
  x: number;
  y: [cursor]number;
  isActive: boolean;
}`;
      const editor = new InMemoryEditor(code);
      let result = extractGenericType({
        state: "new",
        code: editor.code,
        selection: editor.selection,
        highlightSources: []
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
        state: "with user responses",
        responses: [
          { id: "user-choice", type: "choice", value: selectedOccurrenceChoice }
        ],
        code: editor.code,
        selection: editor.selection,
        highlightSources: []
      });

      expect(result).toMatchObject({
        action: "write",
        code: `interface Position<T = number> {
  x: number;
  y: T;
  isActive: boolean;
}`
      });
    });

    it("should replace all occurrences if user decides to", () => {
      const code = `interface Position {
  x: [cursor]number;
  y: number;
  isActive: boolean;
}`;
      const editor = new InMemoryEditor(code);
      let result = extractGenericType({
        state: "new",
        code: editor.code,
        selection: editor.selection,
        highlightSources: []
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
        state: "with user responses",
        responses: [
          { id: "user-choice", type: "choice", value: allOccurrencesChoice }
        ],
        code: editor.code,
        selection: editor.selection,
        highlightSources: []
      });

      expect(result).toMatchObject({
        action: "write",
        code: `interface Position<T = number> {
  x: T;
  y: T;
  isActive: boolean;
}`
      });
    });

    it("should only replace all occurrences of the same interface", () => {
      const code = `interface Position {
  x: [cursor]number;
  y: number;
  isActive: boolean;
}

interface Occurrence {
  id: number;
}`;
      const editor = new InMemoryEditor(code);
      let result = extractGenericType({
        state: "new",
        code: editor.code,
        selection: editor.selection,
        highlightSources: []
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
        state: "with user responses",
        responses: [
          { id: "user-choice", type: "choice", value: allOccurrencesChoice }
        ],
        code: editor.code,
        selection: editor.selection,
        highlightSources: []
      });

      expect(result).toMatchObject({
        action: "write",
        code: `interface Position<T = number> {
  x: T;
  y: T;
  isActive: boolean;
}

interface Occurrence {
  id: number;
}`
      });
    });

    it("should replace nothing if user decides to", async () => {
      const code = `interface Position {
      x: [cursor]number;
      y: number;
      isActive: boolean;
    }`;
      const editor = new InMemoryEditor(code);
      let result = extractGenericType({
        state: "new",
        code: editor.code,
        selection: editor.selection,
        highlightSources: []
      });

      assert(
        result.action === "ask user choice",
        `Should ask user choice, but got "${result.action}"`
      );
      result = extractGenericType({
        state: "with user responses",
        responses: [],
        code: editor.code,
        selection: editor.selection,
        highlightSources: []
      });

      expect(result.action).toBe("do nothing");
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
  let result = extractGenericType({
    state: "new",
    code: editor.code,
    selection: editor.selection,
    highlightSources: []
  });

  if (result.action === "ask user choice") {
    const selectedOccurrenceChoice = result.choices.find(
      (choice) => choice.value === "selected occurrence"
    );
    assert(
      selectedOccurrenceChoice,
      "Should have a choice for selected occurrence"
    );

    result = extractGenericType({
      state: "with user responses",
      responses: [
        { id: "user-choice", type: "choice", value: selectedOccurrenceChoice }
      ],
      code: editor.code,
      selection: editor.selection,
      highlightSources: []
    });
  }

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
  return result;
}
