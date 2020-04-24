import { Editor, ErrorReason, Code, Command } from "../../../editor/editor";
import { Selection } from "../../../editor/selection";
import { InMemoryEditor } from "../../../editor/adapters/in-memory-editor";
import { testEach } from "../../../tests-helpers";

import { extractGenericType } from "./extract-generic-type";
import { ReplacementStrategy } from "../replacement-strategy";
import { Position } from "../../../editor/position";

describe("Extract Generic Type", () => {
  let showErrorMessage: Editor["showError"];

  beforeEach(() => {
    showErrorMessage = jest.fn();
  });

  testEach<{ code: Code; selection?: Selection; expected: Code }>(
    "should extract generic type",
    [
      {
        description: "primitive type (number)",
        code: `interface Position {
  x: number;
  y: number;
}`,
        selection: Selection.cursorAt(1, 6),
        expected: `interface Position<T = number> {
  x: T;
  y: number;
}`
      },
      {
        description: "primitive type (string)",
        code: `interface Position {
  x: string;
  y: number;
}`,
        selection: Selection.cursorAt(1, 6),
        expected: `interface Position<T = string> {
  x: T;
  y: number;
}`
      },
      {
        description: "with existing generics",
        code: `interface Position<T = number> {
  x: T;
  y: number;
}`,
        selection: Selection.cursorAt(2, 6),
        expected: `interface Position<T = number, U = number> {
  x: T;
  y: U;
}`
      },
      {
        description: "with nested structure",
        code: `interface Position {
  data: {
    x: number;
    y: number;
  }
}`,
        selection: Selection.cursorAt(2, 9),
        expected: `interface Position<T = number> {
  data: {
    x: T;
    y: number;
  }
}`
      },
      {
        description: "with complex nested structure",
        code: `interface Position<T = string> {
  timestamp: T;
  data: {
    x: number;
    _position: {
      y: number;
    }
  }
}`,
        selection: Selection.cursorAt(5, 10),
        expected: `interface Position<T = string, U = number> {
  timestamp: T;
  data: {
    x: number;
    _position: {
      y: U;
    }
  }
}`
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0), expected }) => {
      const result = await doExtractGenericType(code, selection);

      expect(result).toBe(expected);
    }
  );

  testEach<{ code: Code; selection?: Selection }>(
    "should not extract generic type",
    [
      {
        description: "type not in an interface",
        code: `function isValid(message: string): boolean {}`,
        selection: Selection.cursorAt(0, 26)
      }
    ],
    async ({ code, selection = Selection.cursorAt(0, 0) }) => {
      const result = await doExtractGenericType(code, selection);

      expect(result).toBe(code);
    }
  );

  describe("multiple occurrences", () => {
    it("should ask user to replace all occurrences", async () => {
      const code = `interface Position {
  x: number;
  y: number;
  isActive: boolean;
}`;
      const selection = Selection.cursorAt(1, 5);
      const editor = new InMemoryEditor(code);
      jest.spyOn(editor, "askUser");

      await extractGenericType(code, selection, editor);

      expect(editor.askUser).toBeCalledWith([
        {
          value: ReplacementStrategy.AllOccurrences,
          label: "Replace all 2 occurrences"
        },
        {
          value: ReplacementStrategy.SelectedOccurrence,
          label: "Replace this occurrence only"
        }
      ]);
    });

    it("should only replace the selected occurrence if user decides to", async () => {
      const code = `interface Position {
  x: number;
  y: number;
  isActive: boolean;
}`;
      const selection = Selection.cursorAt(2, 5);
      const editor = new InMemoryEditor(code);
      jest
        .spyOn(editor, "askUser")
        .mockImplementation(([_, selectedOccurrence]) =>
          Promise.resolve(selectedOccurrence)
        );

      await extractGenericType(code, selection, editor);

      const expected = `interface Position<T = number> {
  x: number;
  y: T;
  isActive: boolean;
}`;
      expect(editor.code).toBe(expected);
    });

    it("should replace all occurrences if user decides to", async () => {
      const code = `interface Position {
  x: number;
  y: number;
  isActive: boolean;
}`;
      const selection = Selection.cursorAt(1, 5);
      const editor = new InMemoryEditor(code);
      jest
        .spyOn(editor, "askUser")
        .mockImplementation(([allOccurrences]) =>
          Promise.resolve(allOccurrences)
        );

      await extractGenericType(code, selection, editor);

      const expected = `interface Position<T = number> {
  x: T;
  y: T;
  isActive: boolean;
}`;
      expect(editor.code).toBe(expected);
    });

    it("should only replace all occurrences of the same interface", async () => {
      const code = `interface Position {
  x: number;
  y: number;
  isActive: boolean;
}

interface Occurrence {
  id: number;
}`;
      const selection = Selection.cursorAt(1, 5);
      const editor = new InMemoryEditor(code);
      jest
        .spyOn(editor, "askUser")
        .mockImplementation(([allOccurrences]) =>
          Promise.resolve(allOccurrences)
        );

      await extractGenericType(code, selection, editor);

      const expected = `interface Position<T = number> {
  x: T;
  y: T;
  isActive: boolean;
}

interface Occurrence {
  id: number;
}`;
      expect(editor.code).toBe(expected);
    });

    it("should replace nothing if user decides to", async () => {
      const code = `interface Position {
  x: number;
  y: number;
  isActive: boolean;
}`;
      const selection = Selection.cursorAt(1, 5);
      const editor = new InMemoryEditor(code);
      jest
        .spyOn(editor, "askUser")
        .mockImplementation(([_all, _selected, nothing]) =>
          Promise.resolve(nothing)
        );

      await extractGenericType(code, selection, editor);

      expect(editor.code).toBe(code);
    });
  });

  it("should rename extracted symbol", async () => {
    const code = `interface Position {
  x: number;
  y: number;
  isActive: boolean;
}`;
    const selection = Selection.cursorAt(2, 11);
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "delegate");

    await extractGenericType(code, selection, editor);

    expect(editor.delegate).toHaveBeenNthCalledWith(1, Command.RenameSymbol);
  });

  it("should put the cursor on extracted symbol", async () => {
    const code = `interface Position {
  x: number;
  y: number;
  isActive: boolean;
}`;
    const selection = Selection.cursorAt(2, 11);
    const editor = new InMemoryEditor(code);

    await extractGenericType(code, selection, editor);

    /**
     * Produced code =>
     *
     * interface Position<T = number> {
     */
    const expectedPosition = new Position(0, 19);
    expect(editor.position).toEqual(expectedPosition);
  });

  it("should put the cursor on extracted symbol with existing type parameters", async () => {
    const code = `interface Position<T = boolean> {
  x: number;
  y: number;
  isActive: boolean;
}`;
    const selection = Selection.cursorAt(2, 11);
    const editor = new InMemoryEditor(code);

    await extractGenericType(code, selection, editor);

    /**
     * Produced code =>
     *
     * interface Position<T = boolean, U = number> {
     */
    const expectedPosition = new Position(0, 32);
    expect(editor.position).toEqual(expectedPosition);
  });

  it("should put the cursor on extracted symbol when we extract an object", async () => {
    const code = `interface Position {
  data: {
    x: number;
    y: number;
  }
}`;
    const selection = Selection.cursorAt(1, 8);
    const editor = new InMemoryEditor(code);

    await extractGenericType(code, selection, editor);

    /**
     * Produced code =>
     *
     * interface Position<T = {
     */
    expect(editor.position).toEqual(new Position(0, 19));
  });

  it("should show an error message if refactoring can't be made", async () => {
    const code = `// This is a comment, can't be refactored`;
    const selection = Selection.cursorAt(0, 0);

    await doExtractGenericType(code, selection);

    expect(showErrorMessage).toBeCalledWith(
      ErrorReason.DidNotFindExtractableCode
    );
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
    editor.showError = showErrorMessage;
    await extractGenericType(code, selection, editor);
    return editor.code;
  }
});
