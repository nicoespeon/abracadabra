import { Code, Command } from "../../editor/editor";
import { InMemoryEditor } from "../../editor/adapters/in-memory-editor";
import { testEach } from "../../tests-helpers";

import { extractGenericType } from "./extract-generic-type";
import { ReplacementStrategy } from "../extract/replacement-strategy";
import { Position } from "../../editor/position";

describe("Extract Generic Type - Interface declaration", () => {
  testEach<{ code: Code; expected: Code }>(
    "should extract generic type",
    [
      {
        description: "primitive type (number)",
        code: `interface Position {
  x: n[cursor]umber;
  y: number;
}`,
        expected: `interface Position<T = number> {
  x: T;
  y: number;
}`
      },
      {
        description: "primitive type (string)",
        code: `interface Position {
  x: s[cursor]tring;
  y: number;
}`,
        expected: `interface Position<T = string> {
  x: T;
  y: number;
}`
      },
      {
        description: "with existing generics",
        code: `interface Position<T = number> {
  x: T;
  y: n[cursor]umber;
}`,
        expected: `interface Position<T = number, U = number> {
  x: T;
  y: U;
}`
      },
      {
        description: "with nested structure",
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
      },
      {
        description: "with complex nested structure",
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

  it("should rename extracted symbol", async () => {
    const code = `interface Position {
  x: number;
  y: number[cursor];
  isActive: boolean;
}`;
    const editor = new InMemoryEditor(code);
    jest.spyOn(editor, "delegate");

    await extractGenericType(editor);

    expect(editor.delegate).toHaveBeenNthCalledWith(1, Command.RenameSymbol);
  });

  describe("cursor position", () => {
    it("should put the cursor on extracted symbol", async () => {
      const code = `interface Position {
  x: number;
  y: number[cursor];
  isActive: boolean;
}`;
      const editor = new InMemoryEditor(code);

      await extractGenericType(editor);

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
  y: number[cursor];
  isActive: boolean;
}`;
      const editor = new InMemoryEditor(code);

      await extractGenericType(editor);

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
  data: [cursor]{
    x: number;
    y: number;
  }
}`;
      const editor = new InMemoryEditor(code);

      await extractGenericType(editor);

      /**
       * Produced code =>
       *
       * interface Position<T = {
       */
      expect(editor.position).toEqual(new Position(0, 19));
    });
  });

  describe("multiple occurrences", () => {
    it("should ask user to replace all occurrences", async () => {
      const code = `interface Position {
  x: [cursor]number;
  y: number;
  isActive: boolean;
}`;
      const editor = new InMemoryEditor(code);
      jest.spyOn(editor, "askUserChoice");

      await extractGenericType(editor);

      expect(editor.askUserChoice).toHaveBeenCalledWith([
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
  y: [cursor]number;
  isActive: boolean;
}`;
      const editor = new InMemoryEditor(code);
      jest
        .spyOn(editor, "askUserChoice")
        .mockImplementation(([_, selectedOccurrence]) =>
          Promise.resolve(selectedOccurrence)
        );

      await extractGenericType(editor);

      const expected = `interface Position<T = number> {
  x: number;
  y: T;
  isActive: boolean;
}`;
      expect(editor.code).toBe(expected);
    });

    it("should replace all occurrences if user decides to", async () => {
      const code = `interface Position {
  x: [cursor]number;
  y: number;
  isActive: boolean;
}`;
      const editor = new InMemoryEditor(code);
      jest
        .spyOn(editor, "askUserChoice")
        .mockImplementation(([allOccurrences]) =>
          Promise.resolve(allOccurrences)
        );

      await extractGenericType(editor);

      const expected = `interface Position<T = number> {
  x: T;
  y: T;
  isActive: boolean;
}`;
      expect(editor.code).toBe(expected);
    });

    it("should only replace all occurrences of the same interface", async () => {
      const code = `interface Position {
  x: [cursor]number;
  y: number;
  isActive: boolean;
}

interface Occurrence {
  id: number;
}`;
      const editor = new InMemoryEditor(code);
      jest
        .spyOn(editor, "askUserChoice")
        .mockImplementation(([allOccurrences]) =>
          Promise.resolve(allOccurrences)
        );

      await extractGenericType(editor);

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
  x: [cursor]number;
  y: number;
  isActive: boolean;
}`;
      const editor = new InMemoryEditor(code);
      const originalCode = editor.code;
      jest
        .spyOn(editor, "askUserChoice")
        .mockImplementation(([_all, _selected, nothing]) =>
          Promise.resolve(nothing)
        );

      await extractGenericType(editor);

      expect(editor.code).toBe(originalCode);
    });
  });
});
